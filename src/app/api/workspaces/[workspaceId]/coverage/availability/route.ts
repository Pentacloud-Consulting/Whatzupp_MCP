import { NextRequest, NextResponse } from 'next/server';
import { validateWorkspaceAccess } from '@/lib/workspaceMiddleware';
import { userAvailabilityService, AvailabilityStatus } from '@/lib/coverage/userAvailabilityService';

export const dynamic = 'force-dynamic';

/**
 * User Availability API Endpoint
 * 
 * GET /api/workspaces/[workspaceId]/coverage/availability?userId=xxx
 * POST /api/workspaces/[workspaceId]/coverage/availability
 * Body: { userId, status: 'AVAILABLE'|'VACATION'|'BUSY'|'OFFLINE', notes?: string, customReturnTime?: string }
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

  if (userId) {
    const status = userAvailabilityService.getAvailability(auth.user?.tenantId || 'tenant-1', userId);
    return NextResponse.json({ success: true, data: status });
  }

  // Fallback if we just want to get all available (or all users)
  // Since there is no getAll(), we can just return an error or empty array if no userId provided
  return NextResponse.json({ error: 'userId is required for this endpoint' }, { status: 400 });
}

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
    const body = await request.json();
    const { userId, status, notes, returnTime } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }

    const updated = userAvailabilityService.setAvailability(auth.user?.tenantId || 'tenant-1', userId, status as AvailabilityStatus, { 
      statusMessage: notes,
      vacationEnd: returnTime
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update availability' }, { status: 500 });
  }
}
