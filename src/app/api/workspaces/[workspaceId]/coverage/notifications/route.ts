import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { coverageNotificationService } from '@/lib/coverage/coverageNotificationService';

export const dynamic = 'force-dynamic';

/**
 * Coverage Notifications API Endpoint
 * 
 * GET /api/workspaces/[workspaceId]/coverage/notifications?userId=xxx&unreadOnly=true
 * PATCH /api/workspaces/[workspaceId]/coverage/notifications
 * Body: { notificationId?: string, userId?: string, markAll?: boolean }
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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
  }

  const notifications = unreadOnly 
    ? coverageNotificationService.getUnreadNotifications(auth.user?.tenantId || 'tenant-1', userId)
    : coverageNotificationService.getNotifications(auth.user?.tenantId || 'tenant-1', userId);
  const unreadCount = coverageNotificationService.getUnreadCount(auth.user?.tenantId || 'tenant-1', userId);

  return NextResponse.json({
    success: true,
    data: {
      notifications,
      unreadCount
    }
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;
  const auth = await validateWorkspaceAccess(request, workspaceId);

  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await request.json();
    const { notificationId, userId, markAll } = body;

    if (markAll && userId) {
      coverageNotificationService.markAllAsRead(auth.user?.tenantId || 'tenant-1', userId);
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      const updated = coverageNotificationService.markAsRead(notificationId);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Missing notificationId or userId+markAll' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update notification' }, { status: 500 });
  }
}
