import { NextRequest, NextResponse } from 'next/server';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';
import { normalizePhoneNumber } from '@/utils/phone';
import { resolveAppUrl } from '@/lib/realtime';

export async function POST(request: NextRequest) {
  try {
    const { access_token, instance_url } = await getSalesCloudAccessToken();
    if (access_token.startsWith('mock-')) {
      return NextResponse.json({ success: true, processed: 0, message: 'Skipped processor in mock mode' });
    }

    const nowIso = new Date().toISOString();
    // Query Salesforce for Scheduled followups that are due
    const soql = `SELECT Id, Contact_Phone__c, Contact_Name__c, Message_Content__c, Workspace_Id__c, Tenant_Id__c, Contact_Id__c, Agent_Id__c, Agent_Name__c FROM WhatZupp_Communication_Activity__c WHERE Status__c = 'Scheduled' AND Scheduled_Time__c <= ${nowIso} AND Activity_Source__c = 'WHATSAPP_FOLLOW_UP' LIMIT 50`;
    
    const sfRes = await fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!sfRes.ok) {
      throw new Error(`Salesforce query failed: ${await sfRes.text()}`);
    }

    const sfData = await sfRes.json();
    const dueFollowUps = sfData.records || [];

    if (dueFollowUps.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No follow-ups due at this time.' });
    }

    console.log(`[followup/process] ⏰ Found ${dueFollowUps.length} due follow-up(s) in Salesforce. Processing...`);

    const appUrl = resolveAppUrl();
    const results = [];

    for (const fu of dueFollowUps) {
      try {
        const formattedPhone = normalizePhoneNumber(fu.Contact_Phone__c);
        console.log(`[followup/process] 📤 Sending to ${fu.Contact_Name__c} (${formattedPhone}): "${fu.Message_Content__c}"`);

        // 1. Send WhatsApp message
        const sendRes = await fetch(`${appUrl}/api/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formattedPhone,
            message: fu.Message_Content__c || '',
            workspaceId: fu.Workspace_Id__c || 'salescloud-ws-1',
          }),
        });

        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.success) {
          throw new Error(sendData.error || `Send API returned ${sendRes.status}`);
        }

        const wamid = sendData.data?.messages?.[0]?.id || `msg-${Date.now()}`;
        console.log(`[followup/process] ✅ Sent! wamid=${wamid}`);

        // 2. Update Salesforce Status to Sent
        const updatePayload = {
          Status__c: 'Sent',
        };
        const updateRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/WhatZupp_Communication_Activity__c/${fu.Id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (!updateRes.ok && updateRes.status !== 204) {
          console.error(`[followup/process] Failed to update SF status for ${fu.Id}: ${await updateRes.text()}`);
        }

        results.push({ id: fu.Id, status: 'Sent', messageId: wamid });
      } catch (sendErr: any) {
        console.error(`[followup/process] ❌ Failed ${fu.Id}:`, sendErr.message);

        // Update Salesforce Status to Failed
        await fetch(`${instance_url}/services/data/v59.0/sobjects/WhatZupp_Communication_Activity__c/${fu.Id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ Status__c: 'Failed' }),
        }).catch(() => {});

        results.push({ id: fu.Id, status: 'Failed', error: sendErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      sent: results.filter(r => r.status === 'Sent').length,
      failed: results.filter(r => r.status === 'Failed').length,
      results,
    });
  } catch (error: any) {
    console.error('[followup/process] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, status: 'Processor active' });
}
