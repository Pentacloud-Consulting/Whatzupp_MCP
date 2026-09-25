// src/app/api/tenant/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { prisma, hasDatabaseUrl } from '@/lib/db';
import { checkUserLimit } from '@/lib/LicenseGuard';
import { getMockUsers, addMockUser, updateMockUser, deleteMockUser } from '@/lib/storage/mockUsersStore';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !['TENANT_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'AGENT'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!hasDatabaseUrl() || session.tenantId?.startsWith('t-')) {
      const allMockUsers = [
        { id: session.userId || '1', fullName: session.fullName, email: session.email, role: session.role, status: 'ACTIVE', workspacePermissions: [{ workspaceType: 'SFMC' }] },
        ...getMockUsers()
      ];
      return NextResponse.json({
        success: true,
        users: allMockUsers,
        usage: { plan: 'Growth', userLimit: 10, activeUsers: allMockUsers.length, pendingInvites: 0, salesCloudUsers: 0, sfmcUsers: allMockUsers.length }
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId! }
    });

    const users = await prisma.user.findMany({
      where: { tenantId: session.tenantId!, isDeleted: false },
      include: { workspacePermissions: true },
      orderBy: { createdAt: 'desc' }
    });

    let salesCloudCount = 0;
    let sfmcCount = 0;
    let activeUsers = 0;
    let pendingInvites = 0;

    users.forEach((u: any) => {
      if (u.status === 'ACTIVE') activeUsers++;
      if (u.status === 'PENDING_INVITATION') pendingInvites++;
      if (u.workspacePermissions.some((wp: any) => wp.workspaceType === 'SALES_CLOUD')) salesCloudCount++;
      if (u.workspacePermissions.some((wp: any) => wp.workspaceType === 'SFMC')) sfmcCount++;
    });

    return NextResponse.json({
      success: true,
      users,
      usage: {
        plan: tenant?.plan || 'Starter',
        userLimit: tenant?.userLimit || 5,
        activeUsers,
        pendingInvites,
        salesCloudUsers: salesCloudCount,
        sfmcUsers: sfmcCount,
        renewalDate: tenant?.renewalDate
      }
    });

  } catch (error: any) {
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

    if (!email || !fullName || !role || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // License Enforcement
    const licenseCheck = await checkUserLimit(session);
    if (!licenseCheck.allowed) {
      return NextResponse.json({ success: false, error: licenseCheck.error }, { status: 403 });
    }

    if (!hasDatabaseUrl() || session.tenantId?.startsWith('t-')) {
      const wsArray = Array.isArray(workspaces) ? workspaces : ['SFMC'];
      addMockUser({
        id: `mock-${Date.now()}`,
        tenantId: session.tenantId, // Store tenantId so login knows which tenant they belong to
        tenantName: session.tenantName,
        tenantCode: session.tenantCode,
        fullName,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password), // Must hash the password for login verification
        role,
        status: 'ACTIVE',
        workspacePermissions: wsArray.map((ws: string) => ({ workspaceType: ws }))
      });
      return NextResponse.json({ success: true, message: 'User created (mock)' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Create User
    const newUser = await prisma.user.create({
      data: {
        tenantId: session.tenantId!,
        email: email.toLowerCase(),
        fullName,
        role,
        passwordHash: hashedPassword,
        status: 'active'
      }
    });

    // Assign Workspaces
    const wsArray = Array.isArray(workspaces) ? workspaces : ['SFMC'];
    for (const ws of wsArray) {
      await prisma.workspacePermission.create({
        data: {
          userId: newUser.id,
          workspaceType: ws
        }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId!,
        userId: newUser.id,
        action: 'USER_CREATED',
        performedBy: session.userId,
        details: { role, workspaces: wsArray, status: 'active' }
      }
    });

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, fullName, role, workspaces, password } = body;

    if (!userId || !fullName || !role) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let updateData: any = { fullName, role };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    if (!hasDatabaseUrl() || session.tenantId?.startsWith('t-')) {
      const mockUser = getMockUsers().find((u: any) => u.id === userId);
      if (mockUser) {
        let updates: any = {
          fullName,
          role,
          workspacePermissions: workspaces.map((ws: string) => ({ workspaceType: ws }))
        };
        if (password) {
          updates.passwordHash = updateData.passwordHash;
        }
        updateMockUser(userId, updates);
      }
      return NextResponse.json({ success: true, message: 'User updated (mock)' });
    }

    // Update the user
    await prisma.user.update({
      where: { id: userId, tenantId: session.tenantId! },
      data: updateData
    });

    // Update workspaces
    await prisma.workspacePermission.deleteMany({
      where: { userId }
    });
    
    if (Array.isArray(workspaces)) {
      for (const ws of workspaces) {
        await prisma.workspacePermission.create({
          data: { userId, workspaceType: ws }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId!,
        userId,
        action: 'USER_UPDATED',
        performedBy: session.userId,
        details: { role, workspaces }
      }
    });

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (!hasDatabaseUrl() || session.tenantId?.startsWith('t-')) {
      deleteMockUser(userId);
      return NextResponse.json({ success: true, message: 'User deleted (mock)' });
    }

    // Protect against self-deletion or deleting super admins
    const targetUser = await prisma.user.findUnique({ where: { id: userId, tenantId: session.tenantId! } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (targetUser.id === session.userId || targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot delete this user' }, { status: 403 });
    }

    // Delete workspaces then the user
    await prisma.workspacePermission.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId!,
        userId,
        action: 'USER_DELETED',
        performedBy: session.userId,
      }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
