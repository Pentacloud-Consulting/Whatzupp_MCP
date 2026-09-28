// src/app/api/admin/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authMiddleware';
import { connectToMongoDB, TenantModel, TenantLicenseModel, AuditLogModel } from '@/lib/db/mongodb';

export async function GET(request: NextRequest) {
  const { session, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    await connectToMongoDB();
    const dbTenants = await TenantModel.find().lean();
    const licenses = await TenantLicenseModel.find().lean();

    const formattedTenants = dbTenants.map((t: any) => {
      const license = licenses.find((l: any) => l.tenantId === t.tenantId);
      return {
        id: t._id,
        tenantCode: t.tenantId,
        name: t.companyName,
        status: t.status.toLowerCase(),
        plan: t.plan,
        createdAt: t.createdAt,
        tenantWorkspaces: t.licensedWorkspaces.map((ws: string) => ({ workspaceType: ws })),
        userUsage: license?.currentUsage || 0,
        userLimit: license?.userLimit || t.maxUsers,
        users: [] // Intentionally empty as per architecture rules (no fetching from SF/SFMC)
      };
    });

    return NextResponse.json({
      success: true,
      tenants: formattedTenants,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    await connectToMongoDB();
    const body = await request.json();
    const { action, tenantId, status, name, tenantCode } = body; // tenantId here could be _id or tenantCode

    if (action === 'DELETE' && tenantId) {
      await TenantModel.findByIdAndDelete(tenantId);
      // Also clean up licenses
      const t = await TenantModel.findById(tenantId);
      if (t) {
        await TenantLicenseModel.deleteOne({ tenantId: t.tenantId });
      }
      return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
    }

    if (action === 'TOGGLE_STATUS' && tenantId && status) {
      const updated = await TenantModel.findByIdAndUpdate(tenantId, { status: status.toUpperCase() }, { new: true });
      if (updated) {
        await AuditLogModel.create({
          tenantId: updated.tenantId,
          action: `TENANT_STATUS_${status.toUpperCase()}`,
          performedBy: session?.userId || 'SUPER_ADMIN',
        });
      }
      return NextResponse.json({ success: true, tenant: updated });
    }

    if (action === 'CREATE') {
      const code = (tenantCode || 'TENANT').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      
      const newTenant = await TenantModel.create({
        tenantId: code,
        companyName: name || 'New Enterprise Client',
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
        licensedWorkspaces: ['SFMC', 'SALES_CLOUD'],
        maxUsers: 50
      });

      await TenantLicenseModel.create({
        tenantId: code,
        licensedWorkspaces: ['SFMC', 'SALES_CLOUD'],
        userLimit: 50,
        currentUsage: 0
      });

      return NextResponse.json({ success: true, tenant: newTenant });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

