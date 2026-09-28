import { NextResponse } from 'next/server';
import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignName, templateName, workspaceId, total, success, failed } = body;

    if (!campaignName) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const connector = new SalesCloudConnector();
    const access_token = await connector.getSalesCloudAccessToken();
    const instance_url = process.env.NEXT_PUBLIC_WORKSPACE_SALESCLOUD_INSTANCE_URL;

    const payload = {
      Name: campaignName,
      Template_Name__c: templateName,
      Workspace_Id__c: workspaceId,
      Total_Recipients__c: total,
      Successful_Sends__c: success,
      Failed_Sends__c: failed,
      Status__c: failed === 0 ? 'Completed' : (success === 0 ? 'Failed' : 'Completed')
    };

    const res = await fetch(`${instance_url}/services/data/v59.0/sobjects/WhatZupp_Broadcast__c/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error('Failed to create Salesforce Broadcast:', errorData);
      return NextResponse.json({ success: false, error: 'Failed to sync to Salesforce' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Broadcast sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync broadcast' }, { status: 500 });
  }
}
