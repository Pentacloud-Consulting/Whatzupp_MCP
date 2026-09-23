import { NextRequest, NextResponse } from 'next/server';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';

interface CallActivityRequest {
  tenantId: string;
  workspaceId: string;
  workspaceType: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
  agentId?: string;
  agentName?: string;
  activitySource: 'WHATSAPP_CALL' | 'WHATSAPP_VIDEO_CALL';
  status: 'CLICKED_CALL' | 'CLICKED_VIDEO_CALL' | 'WHATSAPP_OPENED' | 'FAILED_TO_OPEN';
}

export async function POST(request: NextRequest) {
  try {
    const body: CallActivityRequest = await request.json();

    // Validate multi-tenant context
    if (!body.tenantId || !body.workspaceId || !body.workspaceType) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID, Workspace ID, and Workspace Type are required for tenant isolation.' },
        { status: 400 }
      );
    }

    if (!body.contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Contact phone is required.' },
        { status: 400 }
      );
    }

    console.log(`[calls/activity] Tracking ${body.activitySource} attempt for ${body.contactPhone} in workspace ${body.workspaceId}`);

    // Push to Salesforce if Sales Cloud
    if (body.workspaceType.toLowerCase() === 'salescloud') {
      try {
        const { access_token, instance_url } = await getSalesCloudAccessToken();
        
        if (!access_token.startsWith('mock-')) {
          const payload = {
            Tenant_Id__c: body.tenantId,
            Workspace_Id__c: body.workspaceId,
            Workspace_Type__c: body.workspaceType,
            Contact_Id__c: body.contactId || '',
            Contact_Name__c: body.contactName || '',
            Contact_Phone__c: body.contactPhone || '',
            Agent_Id__c: body.agentId || 'SYSTEM',
            Agent_Name__c: body.agentName || 'Agent',
            Activity_Source__c: body.activitySource,
            Status__c: body.status,
            Created_Date__c: new Date().toISOString()
          };

          const createUrl = `${instance_url}/services/data/v59.0/sobjects/WhatZupp_Communication_Activity__c`;
          const res = await fetch(createUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error(`[calls/activity] Salesforce insert failed (${res.status}): ${errText}`);
          } else {
            const resData = await res.json();
            console.log(`[calls/activity] Saved to Salesforce: ${resData.id}`);
          }
        }
      } catch (sfErr) {
        console.error('[calls/activity] Salesforce sync error:', sfErr);
        // Do not fail the request if CRM is down, just log it.
      }
    }

    // In a real app, you would also save to the primary DB or SFMC here.
    // For this prototype, we simulate a successful tracking event.

    return NextResponse.json({
      success: true,
      message: 'Call activity logged successfully',
      data: {
        ...body,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[calls/activity] Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const workspaceId = searchParams.get('workspaceId');
    const workspaceType = searchParams.get('workspaceType');

    if (!tenantId || !workspaceId || !workspaceType) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID, Workspace ID, and Workspace Type are required.' },
        { status: 400 }
      );
    }

    if (workspaceType.toLowerCase() === 'salescloud') {
      try {
        const { access_token, instance_url } = await getSalesCloudAccessToken();
        
        if (!access_token.startsWith('mock-')) {
          const soql = `SELECT Id, Contact_Name__c, Contact_Phone__c, Agent_Name__c, Activity_Source__c, Status__c, Created_Date__c FROM WhatZupp_Communication_Activity__c WHERE Tenant_Id__c = '${tenantId}' AND Workspace_Id__c = '${workspaceId}' ORDER BY Created_Date__c DESC LIMIT 100`;
          const queryUrl = `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`;
          
          const res = await fetch(queryUrl, {
            headers: { Authorization: `Bearer ${access_token}` },
          });

          if (res.ok) {
            const data = await res.json();
            return NextResponse.json({ success: true, activities: data.records });
          }
        }
      } catch (sfErr) {
        console.error('[calls/activity] Salesforce fetch error:', sfErr);
      }
    }

    // Fallback Mock Data for Prototype
    return NextResponse.json({
      success: true,
      activities: [
        {
          Id: 'mock-1',
          Contact_Name__c: 'Mohamed Waseem',
          Contact_Phone__c: '919952374972',
          Agent_Name__c: 'System Agent',
          Activity_Source__c: 'WHATSAPP_VOICE_CALL',
          Status__c: 'WHATSAPP_OPENED',
          Created_Date__c: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          Id: 'mock-2',
          Contact_Name__c: 'Arshad',
          Contact_Phone__c: '918838210343',
          Agent_Name__c: 'System Agent',
          Activity_Source__c: 'WHATSAPP_VIDEO_CALL',
          Status__c: 'CLICKED_VIDEO_CALL',
          Created_Date__c: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        }
      ]
    });
  } catch (error: any) {
    console.error('[calls/activity] GET Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
