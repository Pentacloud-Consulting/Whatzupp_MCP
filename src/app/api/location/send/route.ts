// src/app/api/location/send/route.ts
// API route to trigger sending the Pentacloud Location to a recipient

import { NextResponse } from 'next/server';
import { sendPentacloudLocation } from '@/lib/locationService';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workspace-Id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, leadId, contactId, recordId, objectType, senderName } = body;

    const recipientPhone = phone;
    let targetLeadId = leadId;
    let targetContactId = contactId;

    if (!targetLeadId && !targetContactId && recordId && objectType) {
      if (objectType === 'Lead') targetLeadId = recordId;
      else if (objectType === 'Contact') targetContactId = recordId;
    }

    if (!recipientPhone) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await sendPentacloudLocation({
      recipientPhone,
      leadId: targetLeadId,
      contactId: targetContactId,
      senderName,
    });

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          data: { messages: [{ id: result.messageId }] },
        },
        { status: 200, headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (err: any) {
    console.error('[api/location/send] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

