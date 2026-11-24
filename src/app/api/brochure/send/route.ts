// src/app/api/brochure/send/route.ts
// API route to trigger sending the Pentacloud Brochure (PDF) to a customer
// Can be called by Salesforce LWC or automated background jobs

import { NextRequest, NextResponse } from 'next/server';
import { sendPentacloudBrochure } from '@/lib/brochureService';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workspace-Id, X-Workspace-Key, bypass-tunnel-reminder',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, recordId, objectType, senderName, caption } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone number is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const leadId = objectType === 'Lead' ? recordId : undefined;
    const contactId = objectType === 'Contact' ? recordId : undefined;

    const result = await sendPentacloudBrochure({
      recipientPhone: phone,
      leadId,
      contactId,
      senderName: senderName || 'Mohamed Waseem',
      caption,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send brochure.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Pentacloud Brochure sent successfully',
        messageId: result.messageId,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API /api/brochure/send] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

