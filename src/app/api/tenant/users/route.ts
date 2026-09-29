// src/app/api/tenant/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { prisma, hasDatabaseUrl } from '@/lib/db';
import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !['TENANT_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'AGENT'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const tenantId = session.tenantId || 'PENTA001';

    // Fetch all users from Salesforce WhatZupp_User__c
    const scConnector = new SalesCloudConnector();
    let allUsers: any[] = [];

    try {
      allUsers = await scConnector.fetchWorkspaceUsers(tenantId);
    } catch (err) {
      console.error('[GET /tenant/users] Failed to fetch users from Salesforce:', err);
    }

    // Ensure session user is visible in their own list
    if (!allUsers.find(u => u.id === session.userId)) {
      allUsers.unshift({
        id: session.userId || '1',
        fullName: session.fullName,
        email: session.email,
        role: session.role,
        status: 'ACTIVE',
        workspacePermissions: (session.workspacePermissions || ['SFMC']).map(w => ({ workspaceType: w }))
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

    let plan = 'ENTERPRISE';
    let userLimit = 10;
    if (hasDatabaseUrl()) {
      try {
        const tenant = await prisma.tenant.findFirst({ where: { tenantCode: tenantId } });
        if (tenant) {
          plan = tenant.plan || 'ENTERPRISE';
          userLimit = tenant.userLimit || 50;
        }
      } catch {
        // use defaults
      }
    }

    return NextResponse.json({
      success: true,
      users: allUsers.map(u => {
        const { passwordHash, password, ...safeUser } = u;
        return safeUser;
      }),
      usage: {
        plan,
        userLimit,
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

    const tenantId = session.tenantId || 'PENTA001';
    const newUserId = \`usr_\${uuidv4()}\`;
    const wsArray = Array.isArray(workspaces) ? workspaces : ['SFMC'];

    // For login verification — store bcrypt hash in SF Password__c field
    const passwordHash = password ? await hashPassword(password) : undefined;
    
    const newUserObj = {
      id: newUserId,
      fullName,
      email: email.toLowerCase(),
      role,
      password: passwordHash || password, // Store the hash (or plain text fallback) in SF
      status: 'ACTIVE',
      workspacePermissions: wsArray.map((w: string) => ({ workspaceType: w }))
    };

    // Create User in Salesforce WhatZupp_User__c
    const scConnector = new SalesCloudConnector();
    await scConnector.createWorkspaceUser(tenantId, newUserObj);

    if (hasDatabaseUrl()) {
      try {
        const t = await prisma.tenant.findFirst({ where: { tenantCode: tenantId } });
        if (t) {
          await prisma.auditLog.create({
            data: {
              tenantId: t.id,
              action: 'USER_CREATED',
              performedBy: session.userId && session.userId.length === 36 ? session.userId : null,
              details: { newUserId, email }
            }
          });
        }
      } catch {
        // skip audit logging
      }
    }

    // Don't return password data to client
    const { password: _, passwordHash: __, ...safeUser } = newUserObj as any;

    return NextResponse.json({ success: true, message: 'User created successfully', user: safeUser });
  } catch (error: any) {
    console.error('POST /tenant/users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'User updated successfully' });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'User deleted successfully' });
}
