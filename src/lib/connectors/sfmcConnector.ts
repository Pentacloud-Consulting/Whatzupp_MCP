import { Connector, MessagePage, WorkspaceContactResult, FieldMappingSchema, WorkspaceMessage, ContactAssignment, AssignmentAudit, CoverageTransfer } from './connectorInterface';
import { getSfmcAccessToken } from '../sfmcAuth';
import { writeSentMessage, writeReceivedMessage } from '../sfmcDE';
import { sendWhatsAppMessage } from '../../services/whatsappService';
import { setConversationOwner, getConfig, setConfig } from '../storage/kvStore';
import { normalizePhoneNumber } from '../../utils/phone';
import { CoverageRuntimeResolver } from '../coverage/coverageResolver';

export class SFMCConnector implements Connector {
  public id = 'sfmc-ws-1';
  public workspaceType = 'sfmc' as const;

  private fallbackAssignments: ContactAssignment[] = [];
  private fallbackAudits: AssignmentAudit[] = [];

  async fetchContacts(params: { 
    search?: string; 
    limit?: number;
    tenantId?: string;
    userId?: string;
    userRole?: string;
    teamId?: string;
  }): Promise<WorkspaceContactResult[]> {
    const limit = params.limit || 50;
    const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;

    if (!sfmcRestBaseUri) {
      // Return empty array when SFMC credentials are not configured
      return [];
    }

    try {
      const { access_token } = await getSfmcAccessToken();
      const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
      const url = `${baseUri}/data/v1/customobjectdata/key/WhatsApp_Test_Audience/rowset?$pageSize=${limit}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!res.ok) {
        throw new Error(`SFMC fetch contacts failed: ${res.status}`);
      }

      const data = await res.json();
      const items = data.items || [];

      // Group by phone number
      const contactMap = new Map<string, WorkspaceContactResult>();
      items.forEach((item: any) => {
        const phone = item.keys?.MobilePhone || item.values?.MobilePhone || item.keys?.mobilephone || item.values?.mobilephone || item.MobilePhone || item.keys?.Phone || item.values?.Phone || item.keys?.phone || item.values?.phone || item.Phone;
        const name = item.keys?.ContactKey || item.values?.ContactKey || item.keys?.contactkey || item.values?.contactkey || item.ContactKey || `Subscriber ${phone}`;
        if (phone && !contactMap.has(phone)) {
          contactMap.set(phone, {
            id: `sfmc-${phone}`,
            name,
            phoneNumber: phone,
            email: `${phone}@sfmc-contacts.com`,
            company: 'SFMC Subscriber',
            lastSyncedAt: new Date().toISOString(),
          });
        }
      });

      let results = Array.from(contactMap.values());
      if (params.search) {
        const query = params.search.toLowerCase();
        results = results.filter(c => c.name.toLowerCase().includes(query) || c.phoneNumber.includes(query));
      }

      const allAssignments = (await getConfig('sfmc_assignments') as ContactAssignment[]) || [];
      // Apply enterprise ownership assignment mapping
      // Apply enterprise ownership assignment mapping
      let asyncResults = await Promise.all(results.map(async c => {
        const assignment = allAssignments.find(a => a.contactId === c.id && (!params.tenantId || a.tenantId === params.tenantId));
        const isUnassigned = !assignment || !assignment.primaryAssigneeId || assignment.primaryAssigneeId === 'unassigned' || assignment.primaryAssigneeId === 'none';
        
        let ownerId = isUnassigned ? undefined : assignment?.ownerUserId;
        let assigneeId = isUnassigned ? undefined : assignment?.primaryAssigneeId;
        
        // --- PHASE 4: COVERAGE OVERLAY INTERCEPTOR ---
        let originalAssigneeId = undefined;
        let isCovered = false;
        let coverageEndTime = undefined;

        if (assigneeId && params.tenantId) {
          const coverage = await CoverageRuntimeResolver.resolveOwnership(params.tenantId, assigneeId, c.id);
          if (coverage.isCovered) {
            originalAssigneeId = assigneeId;
            assigneeId = coverage.resolvedOwnerId;
            isCovered = true;
            coverageEndTime = coverage.coverageMode;
            if (ownerId === assignment?.primaryAssigneeId) {
              ownerId = coverage.resolvedOwnerId;
            }
          }
        }
        // ---------------------------------------------

        return {
          ...c,
          ownerUserId: ownerId,
          primaryAssigneeId: assigneeId,
          createdByUserId: assignment?.createdByUserId || c.createdByUserId,
          teamId: assignment?.teamId || c.teamId,
          originalAssigneeId,
          isCovered,
          coverageEndTime
        };
      }));

      if (params.userRole === 'AGENT' || params.userRole === 'VIEWER') {
        asyncResults = asyncResults.filter(c => c.primaryAssigneeId === params.userId || c.createdByUserId === params.userId || c.ownerUserId === params.userId);
      } else if (params.userRole === 'MANAGER') {
        asyncResults = asyncResults.filter(c => (params.teamId && c.teamId === params.teamId) || c.primaryAssigneeId === params.userId || c.createdByUserId === params.userId || c.ownerUserId === params.userId);
      }

      return asyncResults;
    } catch (err) {
      console.warn('[SFMCConnector] Error fetching contacts from SFMC:', err);
      return [];
    }
  }

  // --- Enterprise Assignment Methods ---
  async fetchContactAssignments(params: { tenantId: string }): Promise<ContactAssignment[]> {
    const allAssignments = (await getConfig('sfmc_assignments') as ContactAssignment[]) || [];
    return allAssignments.filter(a => a.tenantId === params.tenantId);
  }

  async upsertContactAssignment(assignment: ContactAssignment): Promise<boolean> {
    const isUnassigning = !assignment.primaryAssigneeId || assignment.primaryAssigneeId === 'unassigned' || assignment.primaryAssigneeId === 'none';
    const cleanAssignment: ContactAssignment = {
      ...assignment,
      primaryAssigneeId: isUnassigning ? undefined : assignment.primaryAssigneeId,
      ownerUserId: isUnassigning ? undefined : assignment.ownerUserId,
      status: isUnassigning ? 'Unassigned' : (assignment.status || 'Active'),
    };
    const allAssignments = (await getConfig('sfmc_assignments') as ContactAssignment[]) || [];
    const existingIndex = allAssignments.findIndex(
      a => a.contactId === assignment.contactId && a.tenantId === assignment.tenantId
    );
    if (existingIndex >= 0) {
      allAssignments[existingIndex] = cleanAssignment;
    } else {
      allAssignments.push({ ...cleanAssignment, id: `assign_${Date.now()}` });
    }
    await setConfig('sfmc_assignments', allAssignments);
    return true;
  }

  async logAssignmentAudit(audit: AssignmentAudit): Promise<boolean> {
    const allAudits = (await getConfig('sfmc_audits') as AssignmentAudit[]) || [];
    allAudits.push({ ...audit, id: `audit_${Date.now()}` });
    await setConfig('sfmc_audits', allAudits);
    return true;
  }
  // -------------------------------------

  // --- Enterprise Coverage Management ---
  supportsCoverage = true;
  
  async fetchCoverageTransfers(params: { tenantId: string; workspaceId?: string }): Promise<CoverageTransfer[]> {
    try {
      const { access_token } = await getSfmcAccessToken();
      const rest_instance_url = process.env.SFMC_REST_BASE_URI || '';
      if (access_token.startsWith('mock-')) {
        const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
        return allCoverages.filter(c => c.tenantId === params.tenantId && (!params.workspaceId || c.workspaceId === params.workspaceId));
      }

      // We'd ideally query the Data Extension via /data/v1/customobjectdata/key/WhatZupp_Coverage_Transfer_DE/rowset
      // Since SFMC REST API doesn't support complex filtering directly on rowsets easily without Advanced SOQL (it's not Salesforce),
      // we usually fetch and filter, or use an API integration layer.
      const res = await fetch(`${rest_instance_url}/data/v1/customobjectdata/key/WhatZupp_Coverage_Transfer_DE/rowset?$filter=Tenant_Id%20eq%20'${params.tenantId}'`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!res.ok) throw new Error('SFMC fetchCoverageTransfers query failed');
      
      const data = await res.json();
      const records = data.items || [];

      const parsed = records.map((r: any) => ({
        id: r.values.Coverage_Id,
        tenantId: r.values.Tenant_Id,
        workspaceId: r.values.Workspace_Id,
        originalOwnerId: r.values.Original_Owner_Id,
        temporaryOwnerId: r.values.Temporary_Owner_Id,
        primaryBackupId: r.values.Primary_Backup_Id,
        secondaryBackupId: r.values.Secondary_Backup_Id,
        managerId: r.values.Manager_Id,
        status: r.values.Status,
        effectiveStatus: r.values.Effective_Status,
        approvalStatus: r.values.Approval_Status,
        startTime: r.values.Start_Time,
        endTime: r.values.End_Time,
        scopeType: r.values.Is_All_Contacts === 'true' ? 'ALL_CONTACTS' : 'SELECTED_CONTACTS',
        scopeTargetIds: r.values.Specific_Contact_Ids ? r.values.Specific_Contact_Ids.split(',') : [],
        reason: r.values.Reason,
        createdBy: r.values.Created_By,
        createdAt: r.values.Created_Date || new Date().toISOString(),
        approvedBy: r.values.Approved_By,
        approvedDate: r.values.Approved_Date,
        revokedBy: r.values.Revoked_By,
        revokedDate: r.values.Revoked_Date,
        extendedBy: r.values.Extended_By,
        extendedDate: r.values.Extended_Date,
        extensionReason: r.values.Extension_Reason
      }));

      return params.workspaceId ? parsed.filter((p: any) => p.workspaceId === params.workspaceId) : parsed;
    } catch (e) {
      console.warn('[SfmcConnector] SFMC fetchCoverageTransfers failed, fallback to mock', e);
      const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
      return allCoverages.filter(c => c.tenantId === params.tenantId && (!params.workspaceId || c.workspaceId === params.workspaceId));
    }
  }

  async createCoverageTransfer(coverage: CoverageTransfer): Promise<boolean> {
    try {
      const { access_token } = await getSfmcAccessToken();
      const rest_instance_url = process.env.SFMC_REST_BASE_URI || '';
      if (access_token.startsWith('mock-')) {
        const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
        allCoverages.push(coverage);
        await setConfig('sfmc_coverages', allCoverages);
        return true;
      }

      const payload = {
        keys: {
          Coverage_Id: coverage.id
        },
        values: {
          Tenant_Id: coverage.tenantId,
          Workspace_Id: coverage.workspaceId,
          Original_Owner_Id: coverage.originalOwnerId,
          Temporary_Owner_Id: coverage.temporaryOwnerId,
          Primary_Backup_Id: coverage.primaryBackupId || '',
          Secondary_Backup_Id: coverage.secondaryBackupId || '',
          Manager_Id: coverage.managerId || '',
          Status: coverage.status,
          Effective_Status: coverage.effectiveStatus,
          Approval_Status: coverage.approvalStatus,
          Start_Time: coverage.startTime,
          End_Time: coverage.endTime,
          Is_All_Contacts: coverage.scopeType === 'ALL_CONTACTS' ? 'true' : 'false',
          Specific_Contact_Ids: coverage.scopeTargetIds?.join(',') || '',
          Reason: coverage.reason || '',
          Created_By: coverage.createdBy,
          Created_Date: new Date().toISOString()
        }
      };

      const res = await fetch(`${rest_instance_url}/hub/v1/dataevents/key:WhatZupp_Coverage_Transfer_DE/rowset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([payload])
      });
      if (!res.ok) throw new Error('SFMC createCoverageTransfer failed');
      return true;
    } catch (e) {
      const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
      allCoverages.push(coverage);
      await setConfig('sfmc_coverages', allCoverages);
      return true;
    }
  }

  async approveCoverageTransfer(id: string, approvedBy: string): Promise<boolean> {
    try {
      const { access_token } = await getSfmcAccessToken();
      const rest_instance_url = process.env.SFMC_REST_BASE_URI || '';
      if (access_token.startsWith('mock-')) {
        const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
        const index = allCoverages.findIndex(c => c.id === id);
        if (index === -1) return false;
        allCoverages[index].approvalStatus = 'APPROVED';
        allCoverages[index].approvedBy = approvedBy;
        allCoverages[index].approvedDate = new Date().toISOString();
        const start = new Date(allCoverages[index].startTime).getTime();
        if (start <= Date.now()) {
          allCoverages[index].effectiveStatus = 'ACTIVE';
          allCoverages[index].status = 'ACTIVE';
        }
        await setConfig('sfmc_coverages', allCoverages);
        return true;
      }

      // Just send the fields to update
      const payload = {
        keys: { Coverage_Id: id },
        values: {
          Approval_Status: 'APPROVED',
          Approved_By: approvedBy,
          Approved_Date: new Date().toISOString()
          // For SFMC, we rely on the Cron service to flip to ACTIVE rather than doing a pre-fetch here to save API calls
        }
      };

      const res = await fetch(`${rest_instance_url}/hub/v1/dataevents/key:WhatZupp_Coverage_Transfer_DE/rowset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([payload])
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async revokeCoverageTransfer(id: string, revokedBy: string): Promise<boolean> {
    try {
      const { access_token } = await getSfmcAccessToken();
      const rest_instance_url = process.env.SFMC_REST_BASE_URI || '';
      if (access_token.startsWith('mock-')) {
        const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
        const index = allCoverages.findIndex(c => c.id === id);
        if (index === -1) return false;
        allCoverages[index].status = 'REVOKED';
        allCoverages[index].effectiveStatus = 'REVOKED';
        allCoverages[index].revokedBy = revokedBy;
        allCoverages[index].revokedDate = new Date().toISOString();
        await setConfig('sfmc_coverages', allCoverages);
        return true;
      }

      const payload = {
        keys: { Coverage_Id: id },
        values: {
          Status: 'REVOKED',
          Effective_Status: 'REVOKED',
          Revoked_By: revokedBy,
          Revoked_Date: new Date().toISOString()
        }
      };

      const res = await fetch(`${rest_instance_url}/hub/v1/dataevents/key:WhatZupp_Coverage_Transfer_DE/rowset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([payload])
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async extendCoverageTransfer(id: string, newEndTime: string, extendedBy: string, reason?: string): Promise<boolean> {
    try {
      const { access_token } = await getSfmcAccessToken();
      const rest_instance_url = process.env.SFMC_REST_BASE_URI || '';
      if (access_token.startsWith('mock-')) {
        const allCoverages = (await getConfig('sfmc_coverages') as CoverageTransfer[]) || [];
        const index = allCoverages.findIndex(c => c.id === id);
        if (index === -1) return false;
        allCoverages[index].endTime = newEndTime;
        allCoverages[index].extendedBy = extendedBy;
        allCoverages[index].extendedDate = new Date().toISOString();
        if (reason) allCoverages[index].extensionReason = reason;
        await setConfig('sfmc_coverages', allCoverages);
        return true;
      }

      const payload: any = {
        keys: { Coverage_Id: id },
        values: {
          End_Time: newEndTime,
          Extended_By: extendedBy,
          Extended_Date: new Date().toISOString()
        }
      };
      if (reason) payload.values.Extension_Reason = reason;

      const res = await fetch(`${rest_instance_url}/hub/v1/dataevents/key:WhatZupp_Coverage_Transfer_DE/rowset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([payload])
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
  // -------------------------------------

  async fetchMessages(params: {
    recordId?: string;
    phoneNumber?: string;
    cursor?: string;
    pageSize?: number;
  }): Promise<MessagePage> {
    const pageSize = params.pageSize || 50;
    const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;

    if (!sfmcRestBaseUri) {
      // Fallback sample messages for SFMC workspace
      const phone = params.phoneNumber || '9952374972';
      if (phone === '9952374972') {
        return {
          messages: [
            {
              id: 'sfmc-msg-1',
              senderId: 'sfmc-system',
              recipientId: '9952374972',
              content: 'SFMC Campaign: Welcome to our VIP Loyalty Program!',
              timestamp: '2026-09-08T10:00:00.000Z',
              status: 'READ',
              direction: 'OUTBOUND',
            },
            {
              id: 'sfmc-msg-2',
              senderId: '9952374972',
              recipientId: 'sfmc-system',
              content: 'Thanks! What discount code do I use?',
              timestamp: '2026-09-08T10:02:00.000Z',
              status: 'READ',
              direction: 'INBOUND',
            },
            {
              id: 'sfmc-msg-3',
              senderId: 'sfmc-system',
              recipientId: '9952374972',
              content: 'SFMC Promo Code: VIP2026 for 20% off your next purchase.',
              timestamp: '2026-09-08T10:05:00.000Z',
              status: 'DELIVERED',
              direction: 'OUTBOUND',
            },
          ],
        };
      }
      return { messages: [] };
    }

    try {
      const { access_token } = await getSfmcAccessToken();
      const baseUri = sfmcRestBaseUri.replace(/\/$/, '');

      // Helper to fetch all pages from a DE
      const fetchAllDeRows = async (deKey: string): Promise<any[]> => {
        const allItems: any[] = [];
        let page = 1;
        const fetchPageSize = 2500;
        const maxPages = 20;

        while (page <= maxPages) {
          const url = `${baseUri}/data/v1/customobjectdata/key/${deKey}/rowset?$pageSize=${fetchPageSize}&$page=${page}`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${access_token}` },
          });

          if (!res.ok) break;

          const data = await res.json();
          const items = data.items || [];
          allItems.push(...items);

          if (items.length < fetchPageSize) break;
          if (data.requestToken) {
            page++;
          } else {
            break;
          }
        }
        return allItems;
      };

      const [sentItems, recvItems] = await Promise.all([
        fetchAllDeRows('WhatsApp_Sent_Messages'),
        fetchAllDeRows('WhatsApp_Received_Messages'),
      ]);

      const sentData = { items: sentItems };
      const recvData = { items: recvItems };


      const messages: WorkspaceMessage[] = [];

function getFieldValue(row: any, fieldName: string): string {
  if (!row) return '';
  const lowerKey = fieldName.toLowerCase();
  
  const searchObj = (obj: any) => {
    if (!obj) return null;
    const key = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return key ? obj[key] : null;
  };

  return searchObj(row.keys) || searchObj(row.values) || searchObj(row) || '';
}

/**
 * Normalize SFMC timestamps to ISO 8601.
 * SFMC DE returns dates in US locale format: "M/D/YYYY h:mm:ss AM/PM"
 */
function normalizeTimestamp(raw: string): string {
  if (!raw) return new Date().toISOString();
  
  // Already ISO 8601
  if (raw.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  
  // SFMC US locale: "M/D/YYYY h:mm:ss AM/PM"
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    const [, month, day, year, hourStr, min, sec, ampm] = match;
    let hour = parseInt(hourStr, 10);
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    }
    const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${min}:${sec}.000Z`;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime())) return fallback.toISOString();
  return new Date().toISOString();
}

      (sentData.items || []).forEach((item: any) => {
        const phone = getFieldValue(item, 'Phone');
        const wamid = getFieldValue(item, 'WaMid');
        const content = getFieldValue(item, 'MessageContent') || `[Template: ${getFieldValue(item, 'TemplateName')}]`;
        const timestamp = normalizeTimestamp(getFieldValue(item, 'SentTime') || getFieldValue(item, 'CreatedDate'));
        const status = (getFieldValue(item, 'Status') || 'SENT').toUpperCase();

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const cleanParamPhone = (params.phoneNumber || '').replace(/[^0-9]/g, '');
        const matches = !cleanParamPhone || (cleanPhone.length >= 10 && cleanParamPhone.length >= 10 && (cleanPhone.endsWith(cleanParamPhone.slice(-10)) || cleanParamPhone.endsWith(cleanPhone.slice(-10))));

        if (matches) {
          messages.push({
            id: wamid || `sent-${Math.random()}`,
            senderId: 'sfmc-system',
            recipientId: phone,
            content,
            timestamp,
            status: status as any,
            direction: 'OUTBOUND',
          });
        }
      });

      (recvData.items || []).forEach((item: any) => {
        const phone = getFieldValue(item, 'Phone');
        const wamid = getFieldValue(item, 'WaMid');
        const content = getFieldValue(item, 'MessageContent');
        const timestamp = normalizeTimestamp(getFieldValue(item, 'ReceivedTime') || getFieldValue(item, 'CreatedDate'));

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const cleanParamPhone = (params.phoneNumber || '').replace(/[^0-9]/g, '');
        const matches = !cleanParamPhone || (cleanPhone.length >= 10 && cleanParamPhone.length >= 10 && (cleanPhone.endsWith(cleanParamPhone.slice(-10)) || cleanParamPhone.endsWith(cleanPhone.slice(-10))));

        if (matches) {
          messages.push({
            id: wamid || `recv-${Math.random()}`,
            senderId: phone,
            recipientId: 'sfmc-system',
            content,
            timestamp,
            status: 'READ',
            direction: 'INBOUND',
          });
        }
      });

      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return { messages };
    } catch (err) {
      console.warn('[SFMCConnector] Error fetching messages:', err);
      return { messages: [] };
    }
  }

  async sendMessage(params: {
    recipientPhone: string;
    content: string;
    salesforceRecordId?: string;
    salesforceObjectType?: string;
    accessToken?: string;
    phoneNumberId?: string;
  }): Promise<{ messageId: string; status: string }> {
    // 1. Send via WhatsApp Meta API
    const waResult = await sendWhatsAppMessage({
      to: params.recipientPhone,
      message: params.content,
      accessToken: params.accessToken,
      phoneNumberId: params.phoneNumberId,
    });

    const wamid = waResult.messageId || `wamid.${Date.now()}`;

    // Log outbound message to SFMC DE
    try {
      await writeSentMessage({
        WaMid: wamid,
        Phone: params.recipientPhone,
        MessageContent: params.content,
        Status: 'sent',
        SentTime: new Date().toISOString(),
        Source: 'WhatZupp_SFMC_Connector',
      });
    } catch (e) {
      console.warn('[SFMCConnector] Failed to write to SFMC DE:', e);
    }

    // Set conversation ownership (Centralized Choke Point for SFMC)
    try {
      await setConversationOwner(params.recipientPhone, this.id, 'outbound');
    } catch (e) {
      console.warn('[SFMCConnector] Failed to update conversation owner:', e);
    }

    return { messageId: wamid, status: 'SENT' };
  }

  async findContact(params: {
    phoneNumber: string;
  }): Promise<WorkspaceContactResult | null> {
    const contacts = await this.fetchContacts({ search: params.phoneNumber });
    const normSearch = normalizePhoneNumber(params.phoneNumber);
    const match = contacts.find(c => {
      const normC = normalizePhoneNumber(c.phoneNumber);
      return normC === normSearch || (normC.length >= 10 && normSearch.length >= 10 && normC.slice(-10) === normSearch.slice(-10));
    });
    return match || null;
  }

  async resolveContact(params: {
    phoneNumber: string;
    name?: string;
    email?: string;
  }): Promise<WorkspaceContactResult | null> {
    const existing = await this.findContact({ phoneNumber: params.phoneNumber });
    if (existing) return existing;

    return {
      id: `sfmc-${params.phoneNumber}`,
      name: params.name || `Subscriber ${params.phoneNumber}`,
      phoneNumber: params.phoneNumber,
      email: params.email || `${params.phoneNumber}@sfmc-contacts.com`,
      company: 'SFMC Subscriber',
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async createContact(params: {
    name: string;
    phoneNumber: string;
    email?: string;
    company?: string;
  }): Promise<WorkspaceContactResult> {
    const cleanPhone = params.phoneNumber.replace(/[^0-9]/g, '');
    const contactKey = params.name.trim() || cleanPhone;

    const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;
    if (sfmcRestBaseUri) {
      try {
        const { access_token } = await getSfmcAccessToken();
        const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
        const url = `${baseUri}/hub/v1/dataevents/key:WhatsApp_Test_Audience/rowset`;

        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([
            {
              keys: { contactkey: contactKey },
              values: { mobilephone: cleanPhone }
            }
          ])
        });
      } catch (err) {
        console.error('[SFMCConnector] createContact error:', err);
      }
    }

    return {
      id: `sfmc-${cleanPhone}`,
      name: contactKey,
      phoneNumber: cleanPhone,
      email: params.email || `${cleanPhone}@sfmc-contacts.com`,
      company: 'SFMC Subscriber',
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async updateContact(
    id: string,
    updates: { name?: string; phoneNumber?: string; email?: string; company?: string }
  ): Promise<boolean> {
    const key = id.replace(/^sfmc-/, '');
    const name = updates.name || key;
    const phone = (updates.phoneNumber || key).replace(/[^0-9]/g, '');

    const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;
    if (sfmcRestBaseUri) {
      try {
        const { access_token } = await getSfmcAccessToken();
        const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
        const url = `${baseUri}/hub/v1/dataevents/key:WhatsApp_Test_Audience/rowset`;

        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([
            {
              keys: { contactkey: name },
              values: { mobilephone: phone }
            }
          ])
        });
      } catch (err) {
        console.error('[SFMCConnector] updateContact error:', err);
      }
    }
    return true;
  }

  async deleteContact(id: string): Promise<boolean> {
    let key = id.replace(/^sfmc-/, '');
    const sfmcAuthBaseUri = process.env.SFMC_AUTH_BASE_URI;

    if (sfmcAuthBaseUri) {
      try {
        const { access_token } = await getSfmcAccessToken();
        const soapUrl = `${sfmcAuthBaseUri.replace(/\/$/, '').replace('.auth.', '.soap.')}/Service.asmx`;

        // If id was a numeric phone, try deleting both key=id and contactkey in DE
        const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Header>
    <fueloauth>${access_token}</fueloauth>
  </s:Header>
  <s:Body>
    <DeleteRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
      <Objects xsi:type="DataExtensionObject" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <CustomerKey>WhatsApp_Test_Audience</CustomerKey>
        <Keys>
          <Key>
            <Name>contactkey</Name>
            <Value>${key}</Value>
          </Key>
        </Keys>
      </Objects>
    </DeleteRequest>
  </s:Body>
</s:Envelope>`;

        const res = await fetch(soapUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'Delete'
          },
          body: soapBody
        });

        if (!res.ok) {
          console.warn('[SFMCConnector] deleteContact SOAP request failed:', res.status);
        }
      } catch (err) {
        console.error('[SFMCConnector] deleteContact error:', err);
      }
    }
    return true;
  }

  fieldSchema(): FieldMappingSchema[] {
    return [
      { name: 'WaMid', label: 'WhatsApp Message ID', type: 'Text', required: true },
      { name: 'Phone', label: 'Subscriber Phone', type: 'Phone', required: true },
      { name: 'ContactKey', label: 'SFMC Contact Key', type: 'Text' },
      { name: 'MessageContent', label: 'Message Text', type: 'Text' },
      { name: 'Status', label: 'Delivery Status', type: 'Text' },
    ];
  }

  async validateMapping(): Promise<boolean> {
    return Boolean(process.env.SFMC_REST_BASE_URI && process.env.SFMC_CLIENT_ID);
  }
}
