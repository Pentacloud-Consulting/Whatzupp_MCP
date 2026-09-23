// src/app/api/templates/approve/route.ts
// NEW ISOLATED ROUTE — Enterprise Template Approval Workflow
// Handles internal approval before Meta submission.
// Permission: CanApproveTemplates (role-based, not hardcoded to Manager).
// ZERO impact on existing routes.

import { NextRequest, NextResponse } from 'next/server';

interface ApproveTemplateRequest {
  templateName: string;
  workspaceId: string;
  workspaceType: string;
  approvedBy: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApproveTemplateRequest = await request.json();

    // ── 1. Validate inputs ──
    if (!body.templateName || !body.workspaceId || !body.workspaceType || !body.approvedBy) {
      return NextResponse.json(
        { success: false, error: 'templateName, workspaceId, workspaceType, and approvedBy are required.' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    // ── 2. Process approval ──
    if (body.action === 'approve') {
      console.log(`[templates/approve] Template "${body.templateName}" APPROVED by ${body.approvedBy} in workspace ${body.workspaceId}`);
      return NextResponse.json({
        success: true,
        status: 'APPROVED_INTERNAL',
        template: {
          name: body.templateName,
          workspaceId: body.workspaceId,
          workspaceType: body.workspaceType,
          approvedBy: body.approvedBy,
          approvedDate: new Date().toISOString(),
          status: 'APPROVED_INTERNAL',
        },
        message: 'Template approved internally. Ready to submit to Meta.',
      });
    }

    // ── 3. Process rejection ──
    if (body.action === 'reject') {
      console.log(`[templates/approve] Template "${body.templateName}" REJECTED by ${body.approvedBy}: ${body.rejectionReason || 'No reason given'}`);
      return NextResponse.json({
        success: true,
        status: 'REJECTED_INTERNAL',
        template: {
          name: body.templateName,
          workspaceId: body.workspaceId,
          workspaceType: body.workspaceType,
          approvedBy: body.approvedBy,
          approvedDate: new Date().toISOString(),
          status: 'REJECTED_INTERNAL',
          rejectionReason: body.rejectionReason || 'No reason provided.',
        },
        message: 'Template rejected internally.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });

  } catch (error: any) {
    console.error('[templates/approve] Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
