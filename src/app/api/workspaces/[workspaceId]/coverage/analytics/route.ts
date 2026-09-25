import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { coverageAnalyticsService } from '@/lib/coverage/coverageAnalyticsService';

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
      return NextResponse.json({ error: 'Coverage not supported' }, { status: 400 });
    }

    const coverages = await auth.connector!.fetchCoverageTransfers({
      tenantId: auth.user?.tenantId || 'tenant-1',
      workspaceId
    });

    const metrics = coverageAnalyticsService.calculateMetrics(
      auth.user?.tenantId || 'tenant-1',
      workspaceId,
      coverages
    );

    const heatmap = coverageAnalyticsService.getCoverageHeatmap(coverages);
    const topAgents = coverageAnalyticsService.getTopAgents(coverages);

    return NextResponse.json({
      success: true,
      data: { metrics, heatmap, topAgents }
    });
  } catch (error: any) {
    console.error('[GET /coverage/analytics]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
