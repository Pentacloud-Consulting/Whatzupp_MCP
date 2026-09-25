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

  // Only Tenant Admin or Manager can reassign contacts
  if (auth.user?.role !== 'SUPER_ADMIN' && auth.user?.role !== 'TENANT_ADMIN' && auth.user?.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden: Insufficient role permissions for assignment' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { contactIds, assigneeId } = body;
    
    if (!Array.isArray(contactIds) || contactIds.length === 0 || assigneeId === undefined || assigneeId === null) {
      return NextResponse.json({ error: 'contactIds array and assigneeId are required' }, { status: 400 });
    }

    const isUnassigning = assigneeId === '' || assigneeId === 'unassigned' || assigneeId === 'none';
    const targetAssigneeId = isUnassigning ? 'unassigned' : assigneeId;
    const targetOwnerUserId = isUnassigning ? null : auth.user!.userId;

    if (!auth.connector!.upsertContactAssignment) {
      return NextResponse.json({ error: 'This connector does not support enterprise assignments natively.' }, { status: 400 });
    }

    const tenantId = auth.user?.tenantId || 'tenant-1';
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const assignmentPromises = contactIds.map(async (contactId) => {
      // Upsert the assignment
      await auth.connector!.upsertContactAssignment!({
        tenantId,
        workspaceId,
        contactId,
        ownerUserId: targetOwnerUserId || undefined,
        primaryAssigneeId: targetAssigneeId,
        createdByUserId: auth.user!.userId,
        assignedAt: new Date().toISOString(),
        assignedBy: auth.user!.userId,
        status: isUnassigning ? 'Unassigned' : 'Active',
        workspaceType: auth.connector!.workspaceType
      });

      // Audit log
      if (auth.connector!.logAssignmentAudit) {
        await auth.connector!.logAssignmentAudit({
          tenantId,
          workspaceId,
          contactId,
          action: 'Reassigned',
          whoId: auth.user!.userId,
          timestamp: new Date().toISOString(),
          toUserId: assigneeId
        });
      }
    });

    await Promise.all(assignmentPromises);

    return NextResponse.json({ success: true, workspaceId, assignedCount: contactIds.length });
  } catch (error: any) {
    console.error(`[API /workspaces/${workspaceId}/contacts/assign] Error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to assign contacts' }, { status: 500 });
  }
}
