import { NextRequest, NextResponse } from 'next/server';
import { coverageCronService } from '@/lib/coverage/coverageCronService';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';

export const dynamic = 'force-dynamic';

/**
 * Coverage Cron Endpoint
 * 
 * GET /api/workspaces/[workspaceId]/coverage/cron
 * 
 * Runs all coverage maintenance jobs:
 * - Auto-Expire past-due coverages
 * - Auto-Activate scheduled coverages  
 * - Send expiry reminders (1 hour before)
 * 
 * In production, this is triggered by Vercel Cron every 5 minutes.
 */
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
    const result = await coverageCronService.runAll(auth.connector!);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[GET /coverage/cron]', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
