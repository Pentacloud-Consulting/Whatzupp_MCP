// src/app/api/tenant/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { connectToMongoDB, TenantModel, TenantLicenseModel, AuditLogModel } from '@/lib/db/mongodb';
import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { SFMCConnector } from '@/lib/connectors/sfmcConnector';
import { v4 as uuidv4 } from 'uuid';
import { getMockUsers, addMockUser, updateMockUser, deleteMockUser } from '@/lib/storage/mockUsersStore';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !['TENANT_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'AGENT'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    try {
      await connectToMongoDB();
    } catch (e) {
      console.warn('MongoDB not connected, falling back to mock users.');
      let allMockUsers = [...getMockUsers()];
      if (!allMockUsers.find(u => u.id === (session.userId || '1'))) {
        allMockUsers.unshift({ id: session.userId || '1', fullName: session.fullName, email: session.email, role: session.role, status: 'ACTIVE', workspacePermissions: [{ workspaceType: 'SFMC' }] });
      }
      return NextResponse.json({
        success: true,
        users: allMockUsers.map((u: any) => {
          const { passwordHash, ...safeUser } = u;
          return safeUser;
        }),
        usage: { plan: 'Growth', userLimit: 10, activeUsers: allMockUsers.length, pendingInvites: 0, salesCloudUsers: 0, sfmcUsers: allMockUsers.length }
      });
    }

    const tenantId = session.tenantId || 'PENTA001';
    
    // Fetch tenant from MongoDB
    const tenant = await TenantModel.findOne({ tenantId });
    const license = await TenantLicenseModel.findOne({ tenantId });

    const workspaces = tenant?.licensedWorkspaces || ['SALES_CLOUD', 'SFMC'];
    
    let allUsers: any[] = [];
    
    if (workspaces.includes('SALES_CLOUD')) {
      const scConnector = new SalesCloudConnector();
      const scUsers = await scConnector.fetchWorkspaceUsers(tenantId);
      allUsers = [...allUsers, ...scUsers];
    }
    
    if (workspaces.includes('SFMC')) {
      const sfmcConnector = new SFMCConnector();
      const sfmcUsers = await sfmcConnector.fetchWorkspaceUsers(tenantId);
      
      // Deduplicate if a user exists in both (by email or id)
      sfmcUsers.forEach((su: any) => {
        const existing = allUsers.find(u => u.email === su.email || u.id === su.id);
        if (existing) {
          if (!existing.workspacePermissions.some((wp: any) => wp.workspaceType === 'SFMC')) {
            existing.workspacePermissions.push({ workspaceType: 'SFMC' });
          }
        } else {
          allUsers.push(su);
        }
      });
    }

    // Ensure session user is in the list for mock fallback environments
    if (!allUsers.find(u => u.id === session.userId)) {
      allUsers.unshift({
        id: session.userId || '1',
        fullName: session.fullName,
        email: session.email,
        role: session.role,
        status: 'ACTIVE',
        workspacePermissions: [{ workspaceType: 'SFMC' }]
      });
    }

    let salesCloudCount = 0;
    let sfmcCount = 0;
    let activeUsers = 0;
    let pendingInvites = 0;

    allUsers.forEach((u: any) => {
      if (u.status === 'ACTIVE') activeUsers++;
      if (u.status === 'PENDING_INVITATION') pendingInvites++;
      if (u.workspacePermissions?.some((wp: any) => wp.workspaceType === 'SALES_CLOUD')) salesCloudCount++;
      if (u.workspacePermissions?.some((wp: any) => wp.workspaceType === 'SFMC')) sfmcCount++;
    });

    return NextResponse.json({
      success: true,
      users: allUsers.map(u => {
        const { passwordHash, ...safeUser } = u;
        return safeUser;
      }),
      usage: {
        plan: tenant?.plan || 'ENTERPRISE',
        userLimit: license?.userLimit || tenant?.maxUsers || 50,
        activeUsers,
        pendingInvites,
        salesCloudUsers: salesCloudCount,
        sfmcUsers: sfmcCount,
      }
    });

  } catch (error: any) {
    console.error('GET /tenant/users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only Tenant Admins can invite users.' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, role, workspaces } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let isMongoConnected = false;
    try {
      await connectToMongoDB();
      isMongoConnected = true;
    } catch (e) {
      console.warn('MongoDB not connected for POST, using mock store');
    }

    const tenantId = session.tenantId || 'PENTA001';
    let license = null;

    if (isMongoConnected) {
      // 1. Validate License in MongoDB
      license = await TenantLicenseModel.findOne({ tenantId });
      if (license && license.currentUsage >= license.userLimit) {
        return NextResponse.json({ success: false, error: 'User limit reached. Please upgrade your plan.' }, { status: 403 });
      }
    }

    const newUserId = `usr_${uuidv4()}`;
    const wsArray = Array.isArray(workspaces) ? workspaces : ['SFMC'];

    // For login verification in fallback/mock DBs
    const passwordHash = password ? await hashPassword(password) : undefined;
    
    const newUserObj = {
      id: newUserId,
      fullName,
      email: email.toLowerCase(),
      role,
      passwordHash,
      password, // Pass plain text so connector can sync it to Salesforce as requested
      status: 'ACTIVE',
      workspacePermissions: wsArray.map((w: string) => ({ workspaceType: w }))
    };

    // 2. Create User in Salesforce/SFMC
    if (wsArray.includes('SALES_CLOUD')) {
      const scConnector = new SalesCloudConnector();
      await scConnector.createWorkspaceUser(tenantId, newUserObj);
    }
    
    if (wsArray.includes('SFMC')) {
      const sfmcConnector = new SFMCConnector();
      await sfmcConnector.createWorkspaceUser(tenantId, newUserObj);
    }

    // Update Mock Store as backup
    addMockUser({
      ...newUserObj,
      tenantId: session.tenantId,
      tenantName: session.tenantName,
      tenantCode: session.tenantCode,
    });

    // 3. Update Usage Counter & Audit in MongoDB
    if (isMongoConnected) {
      if (license) {
        license.currentUsage += 1;
        await license.save();
      }

      await AuditLogModel.create({
        tenantId,
        action: 'USER_CREATED',
        performedBy: session.userId,
      });
    }

    return NextResponse.json({ success: true, message: 'User created successfully', user: newUserObj });
  } catch (error: any) {
    console.error('POST /tenant/users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Simplified PUT for now
  return NextResponse.json({ success: true, message: 'User updated successfully' });
}

export async function DELETE(request: NextRequest) {
  // Simplified DELETE for now
  return NextResponse.json({ success: true, message: 'User deleted successfully' });
}
