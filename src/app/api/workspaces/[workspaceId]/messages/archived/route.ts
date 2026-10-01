import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { WorkspaceMessage } from '@/lib/connectors/connectorInterface';

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

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || searchParams.get('phoneNumber');

  if (!phone) {
    return NextResponse.json({ error: 'phone query parameter is required' }, { status: 400 });
  }

  try {
    const connector = auth.connector!;
    let archivedMessages: WorkspaceMessage[] = [];

    if (connector.fetchArchivedMessages) {
      archivedMessages = await connector.fetchArchivedMessages({
        phoneNumber: phone,
        workspaceId,
        limit: 100,
      });
    }

    return NextResponse.json({
      success: true,
      workspaceId,
      phoneNumber: phone,
      count: archivedMessages.length,
      archivedMessages,
    });
  } catch (error: any) {
    console.error(`[API /workspaces/${workspaceId}/messages/archived] Error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch archived messages' }, { status: 500 });
  }
}
