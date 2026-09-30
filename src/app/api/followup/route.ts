import { NextRequest, NextResponse } from 'next/server';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';

// ─────────────────────────────────────────────────────
// POST /api/followup — Schedule a new follow-up message (Salesforce Only)
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.date || !body.time || !body.message || !body.contactPhone) {
      return NextResponse.json({ success: false, error: 'Date, Time, Message, and Contact Phone are required fields.' }, { status: 400 });
    }

    const { access_token, instance_url } = await getSalesCloudAccessToken();

    if (access_token.startsWith('mock-')) {
      return NextResponse.json({ success: false, error: 'Cannot schedule follow-up in Salesforce with a mock token.' }, { status: 400 });
    }

    const payload = {
      Tenant_Id__c: body.tenantId || 'tenant-1',
      Workspace_Id__c: body.workspaceId || 'salescloud-ws-1',
      Workspace_Type__c: body.workspaceType || 'salescloud',
      Contact_Id__c: body.contactId || '',
      Contact_Name__c: body.contactName || '',
      Contact_Phone__c: body.contactPhone,
      Agent_Id__c: body.agentId || 'SYSTEM',
      Agent_Name__c: body.agentName || 'Agent',
      Activity_Source__c: 'WHATSAPP_FOLLOW_UP',
      Status__c: 'Scheduled',
      Scheduled_Time__c: new Date(`${body.date}T${body.time}:00`).toISOString(),
      Message_Content__c: body.message.trim(),
    };

    const createUrl = `${instance_url}/services/data/v59.0/sobjects/WhatZupp_Communication_Activity__c`;
    const sfRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!sfRes.ok) {
      const errText = await sfRes.text();
      console.error('[api/followup] SF insert error', errText);
      throw new Error(`Salesforce API error: ${errText}`);
    }

    const sfData = await sfRes.json();
    console.log(`[api/followup] ✅ Salesforce activity logged: ${sfData.id}`);

    return NextResponse.json({
      success: true,
      message: 'Follow-up scheduled successfully in Salesforce.',
      data: {
        id: sfData.id,
        date: body.date,
        time: body.time,
        message: body.message,
        contactPhone: body.contactPhone,
        contactName: body.contactName,
        status: 'Scheduled',
      },
    });
  } catch (error: any) {
    console.error('[api/followup] POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────
// GET /api/followup — List follow-ups for contact (Salesforce Only)
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'contactId is required' }, { status: 400 });
    }

    const { access_token, instance_url } = await getSalesCloudAccessToken();
    if (access_token.startsWith('mock-')) {
      return NextResponse.json({ success: true, followUps: [], stats: {} });
    }

    const soql = `SELECT Id, Scheduled_Time__c, Message_Content__c, Status__c, CreatedDate FROM WhatZupp_Communication_Activity__c WHERE Contact_Id__c = '${contactId}' AND Activity_Source__c = 'WHATSAPP_FOLLOW_UP' ORDER BY Scheduled_Time__c DESC LIMIT 50`;
    
    const sfRes = await fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!sfRes.ok) {
      throw new Error(`Salesforce query failed: ${await sfRes.text()}`);
    }

    const sfData = await sfRes.json();
    
    const followUps = (sfData.records || []).map((r: any) => {
      // Parse Datetime back to date/time strings for UI
      let date = '';
      let time = '';
      if (r.Scheduled_Time__c) {
        const d = new Date(r.Scheduled_Time__c);
        const pad = (n: number) => n.toString().padStart(2, '0');
        date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      return {
        id: r.Id,
        date,
        time,
        message: r.Message_Content__c || '',
        status: r.Status__c || 'Scheduled',
        createdAt: r.CreatedDate,
      };
    });

    return NextResponse.json({
      success: true,
      followUps,
      stats: { total: followUps.length },
    });
  } catch (error: any) {
    console.error('[api/followup] GET Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────
// DELETE /api/followup — Delete a scheduled follow-up (Salesforce Only)
// ─────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Follow-up ID is required' }, { status: 400 });
    }

    const { access_token, instance_url } = await getSalesCloudAccessToken();
    if (access_token.startsWith('mock-')) {
      return NextResponse.json({ success: true, removed: true });
    }

    const sfRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/WhatZupp_Communication_Activity__c/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!sfRes.ok && sfRes.status !== 204 && sfRes.status !== 404) {
      throw new Error(`Salesforce DELETE failed: ${await sfRes.text()}`);
    }

    console.log(`[api/followup] 🗑️ Deleted follow-up from Salesforce: ${id}`);
    return NextResponse.json({ success: true, removed: true });
  } catch (error: any) {
    console.error('[api/followup] DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────
// PUT /api/followup — Edit a scheduled follow-up (Salesforce Only)
// ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, date, time, message } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Follow-up ID is required' }, { status: 400 });
    }

    const { access_token, instance_url } = await getSalesCloudAccessToken();
    if (access_token.startsWith('mock-')) {
      return NextResponse.json({ success: true });
    }

    const payload: any = {};
    if (date && time) {
      payload.Scheduled_Time__c = new Date(`${date}T${time}:00`).toISOString();
    }
    if (message) {
      payload.Message_Content__c = message.trim();
    }

    const sfRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/WhatZupp_Communication_Activity__c/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!sfRes.ok && sfRes.status !== 204) {
      throw new Error(`Salesforce PATCH failed: ${await sfRes.text()}`);
    }

    console.log(`[api/followup] ✏️ Edited follow-up in Salesforce: ${id} → ${date} ${time}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[api/followup] PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
