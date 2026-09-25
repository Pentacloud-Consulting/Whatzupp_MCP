import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { CoverageTransfer } from '@/lib/connectors/connectorInterface';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;
  const auth = await validateWorkspaceAccess(request, workspaceId);

  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    if (!auth.connector!.supportsCoverage || !auth.connector!.fetchCoverageTransfers) {
      return NextResponse.json({ error: 'Coverage not supported for this workspace type' }, { status: 400 });
    }

    const coverages = await auth.connector!.fetchCoverageTransfers({
      tenantId: auth.user?.tenantId || 'tenant-1',
      workspaceId
    });

    const now = Date.now();
    let active = 0, scheduled = 0, expiringToday = 0, emergency = 0;

    coverages.forEach(c => {
      if (c.priority === 'CRITICAL' || c.priority === 'HIGH') {
        if (c.effectiveStatus === 'ACTIVE' || c.effectiveStatus === 'PENDING') emergency++;
      }
      if (c.effectiveStatus === 'ACTIVE') {
        active++;
        const end = c.endTime ? new Date(c.endTime).getTime() : Number.MAX_SAFE_INTEGER;
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const endOfToday = new Date().setHours(23, 59, 59, 999);
        if (end >= startOfToday && end <= endOfToday) expiringToday++;
      } else if (c.effectiveStatus === 'PENDING' || c.effectiveStatus === 'SCHEDULED') {
        scheduled++;
      }
    });

    return NextResponse.json({
      success: true,
      data: { active, scheduled, expiringToday, emergency, transfers: coverages }
    });
  } catch (error: any) {
    console.error('[GET /coverage/dashboard]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
