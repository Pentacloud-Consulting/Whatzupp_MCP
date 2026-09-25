// src/lib/conversationFlows/flowStateStore.ts
// Workspace-isolated state persistence for Conversation Flow instances.
// Sales Cloud → Salesforce Custom Object (Conversation_Flow_Instance__c)
// SFMC → SFMC Data Extension (Conversation_Flow_Instance)
// NO local database, NO MongoDB, NO Prisma.

import { FlowInstance } from './flowSchema';

// ─── Sales Cloud Storage (Salesforce Custom Object) ─────────────
export const salesCloudFlowStateStore = {
  async upsertInstance(instance: FlowInstance, accessToken: string, instanceUrl: string): Promise<void> {
    const body = {
      Phone__c: instance.phone,
      Flow_Id__c: instance.flowId,
      Current_Step__c: instance.currentNodeId,
      Status__c: instance.status,
      Started_Date__c: instance.startedAt,
      Last_Response__c: instance.lastResponseAt,
      Responses_JSON__c: JSON.stringify(instance.responses),
      Tenant_Id__c: instance.tenantId,
      Workspace_Id__c: instance.workspaceId,
    };

    // Upsert by external ID (Flow_Instance_Id__c)
    const res = await fetch(
      `${instanceUrl}/services/data/v59.0/sobjects/Conversation_Flow_Instance__c/Flow_Instance_Id__c/${instance.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      const err = await res.text();
      console.error('[FlowStateStore][SalesCloud] Upsert failed:', err);
      throw new Error(`SF upsert failed: ${res.status}`);
    }
  },

  async getActiveInstance(phone: string, flowId: string, accessToken: string, instanceUrl: string): Promise<FlowInstance | null> {
    const query = encodeURIComponent(
      `SELECT Flow_Instance_Id__c, Phone__c, Flow_Id__c, Current_Step__c, Status__c, Started_Date__c, Last_Response__c, Responses_JSON__c, Tenant_Id__c, Workspace_Id__c FROM Conversation_Flow_Instance__c WHERE Phone__c = '${phone}' AND Flow_Id__c = '${flowId}' AND Status__c = 'active' ORDER BY CreatedDate DESC LIMIT 1`
    );

    const res = await fetch(`${instanceUrl}/services/data/v59.0/query/?q=${query}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.records || data.records.length === 0) return null;

    const r = data.records[0];
    return {
      id: r.Flow_Instance_Id__c,
      flowId: r.Flow_Id__c,
      phone: r.Phone__c,
      currentNodeId: r.Current_Step__c,
      status: r.Status__c,
      responses: JSON.parse(r.Responses_JSON__c || '{}'),
      startedAt: r.Started_Date__c,
      lastResponseAt: r.Last_Response__c,
      tenantId: r.Tenant_Id__c,
      workspaceId: r.Workspace_Id__c,
      workspaceType: 'salescloud',
    };
  },
};

// ─── SFMC Storage (Data Extension) ──────────────────────────────
export const sfmcFlowStateStore = {
  async upsertInstance(instance: FlowInstance, accessToken: string, restBaseUrl: string): Promise<void> {
    const deKey = 'Conversation_Flow_Instance';

    const rows = [{
      keys: { Flow_Instance_Id: instance.id },
      values: {
        Phone: instance.phone,
        Flow_Id: instance.flowId,
        CurrentStep: instance.currentNodeId,
        Status: instance.status,
        StartedDate: instance.startedAt,
        LastResponse: instance.lastResponseAt,
        ResponsesJSON: JSON.stringify(instance.responses),
        TenantId: instance.tenantId,
        WorkspaceId: instance.workspaceId,
      },
    }];

    const res = await fetch(`${restBaseUrl}/hub/v1/dataevents/key:${deKey}/rowset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[FlowStateStore][SFMC] Upsert failed:', err);
      throw new Error(`SFMC upsert failed: ${res.status}`);
    }
  },

  async getActiveInstance(phone: string, flowId: string, accessToken: string, restBaseUrl: string): Promise<FlowInstance | null> {
    // SFMC DE row lookup
    const filter = encodeURIComponent(`Phone eq '${phone}' and Flow_Id eq '${flowId}' and Status eq 'active'`);
    const res = await fetch(
      `${restBaseUrl}/data/v1/customobjectdata/key/Conversation_Flow_Instance/rowset?$filter=${filter}&$orderby=StartedDate desc&$top=1`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    const r = data.items[0].values;
    return {
      id: r.Flow_Instance_Id,
      flowId: r.Flow_Id,
      phone: r.Phone,
      currentNodeId: r.CurrentStep,
      status: r.Status,
      responses: JSON.parse(r.ResponsesJSON || '{}'),
      startedAt: r.StartedDate,
      lastResponseAt: r.LastResponse,
      tenantId: r.TenantId,
      workspaceId: r.WorkspaceId,
      workspaceType: 'sfmc',
    };
  },
};
