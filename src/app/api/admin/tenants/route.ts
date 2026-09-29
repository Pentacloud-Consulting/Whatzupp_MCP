// src/app/api/admin/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authMiddleware';
import { prisma, hasDatabaseUrl } from '@/lib/db';
import { getLocalTenants, deleteLocalTenant, toggleLocalTenantStatus, saveLocalTenant } from '@/lib/storage/tenantStore';

export async function GET(request: NextRequest) {
  const { session, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    let dbTenants: any[] = [];
    if (hasDatabaseUrl()) {
      try {
        dbTenants = await prisma.tenant.findMany({
          include: {
            users: { select: { id: true } },
            workspaces: true,
          }
        });
      } catch (err: any) {
        console.warn('Prisma query error, falling back to local store', err.message);
      }
    }

    const localTenants = getLocalTenants();

    const formattedDb = dbTenants.map((t: any) => ({
      id: t.id,
      tenantCode: t.tenantCode,
      name: t.name,
      status: t.status.toLowerCase(),
      plan: t.plan,
      createdAt: t.createdAt,
      tenantWorkspaces: t.workspaces?.map((w: any) => ({ workspaceType: w.workspaceType })) || [],
      userUsage: t.users?.length || 0,
      userLimit: t.userLimit,
      users: []
    }));

    // Merge cleanly by tenantCode
    const tenantMap = new Map<string, any>();
    for (const t of localTenants) {
      tenantMap.set(t.tenantCode, {
        id: t.id,
        tenantCode: t.tenantCode,
        name: t.name,
        status: t.status,
        plan: 'Starter', // Default for local
        createdAt: t.createdAt,
        tenantWorkspaces: t.tenantWorkspaces || [],
        userUsage: t.users?.length || 0,
        userLimit: 5,
        users: []
      });
    }
    for (const t of formattedDb) {
      tenantMap.set(t.tenantCode, t);
    }

    return NextResponse.json({
      success: true,
      tenants: Array.from(tenantMap.values()),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { action, tenantId, status, name, tenantCode } = body;

    if (action === 'DELETE' && tenantId) {
      deleteLocalTenant(tenantId);
      if (hasDatabaseUrl()) {
        try {
          await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
        } catch {}
      }
      return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
    }

    if (action === 'TOGGLE_STATUS' && tenantId && status) {
      const newStatus = status.toUpperCase();
      toggleLocalTenantStatus(tenantId, newStatus.toLowerCase() as any);
      
      let updated = null;
      if (hasDatabaseUrl()) {
        try {
          updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: { status: newStatus }
          }).catch(() => null);

          if (updated) {
            await prisma.auditLog.create({
              data: {
                tenantId: updated.id,
                action: \`TENANT_STATUS_\${newStatus}\`,
                performedBy: session?.userId || 'SUPER_ADMIN',
              }
            });
          }
        } catch {}
      }
      return NextResponse.json({ success: true, tenant: updated });
    }

    if (action === 'CREATE') {
      const code = (tenantCode || 'TENANT').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      
      if (hasDatabaseUrl()) {
        try {
          const newTenant = await prisma.tenant.create({
            data: {
              name: name || 'New Enterprise Client',
              tenantCode: code,
              status: 'ACTIVE',
              plan: 'ENTERPRISE',
              userLimit: 50,
              workspaces: {
                create: [
                  { workspaceType: 'SFMC' },
                  { workspaceType: 'SALES_CLOUD' }
                ]
              }
            }
          });
          return NextResponse.json({ success: true, tenant: newTenant });
        } catch {}
      }

      // Fallback
      const newT = {
        id: \`t-\${Date.now()}\`,
        name: name || 'New Enterprise Client',
        tenantCode: code,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        tenantWorkspaces: [{ workspaceType: 'SFMC' }, { workspaceType: 'SALES_CLOUD' }],
        users: []
      };
      saveLocalTenant(newT);
      return NextResponse.json({ success: true, tenant: newT });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

