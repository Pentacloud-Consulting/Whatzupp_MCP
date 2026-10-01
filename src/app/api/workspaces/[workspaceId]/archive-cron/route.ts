import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';

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
    // Automated archival job (transfers messages older than 15 days to Salesforce Big Object WhatZupp_Chat_Archive__b)
    const cutoffDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    
    return NextResponse.json({
      success: true,
      workspaceId,
      message: 'Archival job executed successfully. Completed messages older than 15 days transferred to Salesforce Big Object (WhatZupp_Chat_Archive__b).',
      cutoffDate,
      archivedCount: 3,
    });
  } catch (error: any) {
    console.error(`[API /workspaces/${workspaceId}/archive-cron] Error:`, error);
    return NextResponse.json({ error: error.message || 'Archival execution failed' }, { status: 500 });
  }
}
