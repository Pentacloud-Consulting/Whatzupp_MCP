import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { CoverageService } from '@/lib/coverage/coverageService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; id: string }> }
) {
  const { workspaceId, id } = await context.params;
  const auth = await validateWorkspaceAccess(request, workspaceId);

  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const { version } = await request.json();

    if (version === undefined) {
      return NextResponse.json({ error: 'Coverage version is required for optimistic locking.' }, { status: 400 });
    }

    const coverageService = new CoverageService(auth.connector!);
    const success = await coverageService.approveCoverage(id, version, auth.user?.userId || 'SYSTEM');

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to approve coverage' }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`[POST /coverage/${id}/approve]`, error);
    if (error.name === 'CoverageValidationError' || error.message?.includes('FeatureNotSupportedError')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
