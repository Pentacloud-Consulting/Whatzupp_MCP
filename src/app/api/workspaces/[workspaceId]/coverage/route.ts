import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { CoverageService } from '@/lib/coverage/coverageService';
import { CoverageTransfer } from '@/lib/connectors/connectorInterface';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;
  const auth = await validateWorkspaceAccess(request, workspaceId);

  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body: Partial<CoverageTransfer> = await request.json();

    // Session Security Rule: Force tenant and workspace context
    body.tenantId = auth.user?.tenantId || 'tenant-1';
    body.workspaceId = workspaceId;
    body.workspaceType = auth.connector!.workspaceType;

    const coverageService = new CoverageService(auth.connector!);
    const coverage = await coverageService.createCoverage(body, auth.user?.userId || 'SYSTEM');

    return NextResponse.json({ success: true, coverage });
  } catch (error: any) {
    console.error('[POST /coverage]', error);
    if (error.name === 'CoverageValidationError' || error.message?.includes('FeatureNotSupportedError')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    return NextResponse.json({ success: true, coverages });
  } catch (error: any) {
    console.error('[GET /coverage]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
