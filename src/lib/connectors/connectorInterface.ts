export interface WorkspaceMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string; // ISO String
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  direction: 'INBOUND' | 'OUTBOUND';
  mediaUrl?: string;
  salesforceRecordId?: string;
}

export interface MessagePage {
  messages: WorkspaceMessage[];
  nextCursor?: string;
}

export interface WorkspaceContactResult {
  id: string;
  name: string;
  phoneNumber: string;
  salesforceObjectType?: 'Lead' | 'Contact' | 'Account' | 'Opportunity';
  salesforceRecordId?: string;
  email?: string;
  company?: string;
  lastSyncedAt: string;
  labels?: string; // comma-separated label names stored in Salesforce WhatZupp_Labels__c
  ownerUserId?: string;
  primaryAssigneeId?: string;
  createdByUserId?: string;
  teamId?: string;
}

export interface ContactAssignment {
  id?: string;
  tenantId: string;
  workspaceId: string;
  contactId: string;
  ownerUserId?: string;
  primaryAssigneeId?: string;
  createdByUserId: string;
  teamId?: string;
  assignedAt: string;
  assignedBy?: string;
  status: string;
  workspaceType: string;
}

export interface AssignmentAudit {
  id?: string;
  tenantId: string;
  workspaceId: string;
  contactId: string;
  action: 'Assigned' | 'Reassigned' | 'Unassigned' | 'Created' | 'Deleted' | 'Transferred';
  whoId: string;
  timestamp: string;
  fromUserId?: string;
  toUserId?: string;
}

export interface CoverageTransfer {
  id?: string;
  tenantId: string;
  workspaceId: string;
  workspaceType: string;
  coverageSource: string;
  originalOwnerId: string;
  originalUserRole?: string;
  temporaryOwnerId: string;
  temporaryUserRole?: string;
  scopeType: 'ALL_CONTACTS' | 'SELECTED_CONTACTS' | 'LABEL_BASED' | 'TEAM_BASED';
  scopeTargetIds?: string[];
  teamSnapshot?: string;
  coverageType: 'PLANNED' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  coverageMode: 'FULL_TRANSFER' | 'SHARED_ACCESS' | 'VIEW_ONLY' | 'READ_ONLY';
  coverageImpact: 'CHATS_ONLY' | 'CONTACTS_AND_CHATS' | 'FULL_WORKSPACE';
  startTime: string; // ISO String
  endTime?: string; // ISO String
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  effectiveStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SCHEDULED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedDate?: string;
  extendedBy?: string;
  extendedDate?: string;
  extensionReason?: string;
  reason?: string;
  coverageNotes?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdDate: string;
  revokedBy?: string;
  revokedDate?: string;
  coverageVersion: number;
  isDeleted: boolean;
  deletedBy?: string;
  deletedDate?: string;
  primaryBackupId?: string;
  secondaryBackupId?: string;
  managerId?: string;
  routingLockId?: string;
}

export interface CoverageAudit {
  id?: string;
  tenantId: string;
  workspaceId: string;
  coverageId: string;
  action: string;
  whoId: string;
  timestamp: string;
}

export interface FieldMappingSchema {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

export interface Connector {
  id: string; // e.g., 'sfmc-ws-1', 'salescloud-ws-1'
  workspaceType: 'sfmc' | 'salescloud';

  fetchContacts(params: { 
    search?: string; 
    limit?: number;
    tenantId?: string;
    userId?: string;
    userRole?: string;
    teamId?: string;
  }): Promise<WorkspaceContactResult[]>;

  fetchContactAssignments?(params: { tenantId: string }): Promise<ContactAssignment[]>;
  upsertContactAssignment?(assignment: ContactAssignment): Promise<boolean>;
  logAssignmentAudit?(audit: AssignmentAudit): Promise<boolean>;

  fetchMessages(params: {
    recordId?: string;
    phoneNumber?: string;
    cursor?: string;
    pageSize?: number;
  }): Promise<MessagePage>;

  // Coverage Management
  supportsCoverage?: boolean;
  fetchCoverageTransfers?(params: { tenantId: string; workspaceId?: string }): Promise<CoverageTransfer[]>;
  createCoverageTransfer?(coverage: CoverageTransfer): Promise<boolean>;
  revokeCoverageTransfer?(id: string, revokedBy: string): Promise<boolean>;
  approveCoverageTransfer?(id: string, approvedBy: string): Promise<boolean>;
  extendCoverageTransfer?(id: string, newEndTime: string, extendedBy: string, reason?: string): Promise<boolean>;
  expireCoverageTransfers?(): Promise<number>;

  sendMessage(params: {
    recipientPhone: string;
    content: string;
    salesforceRecordId?: string;
    salesforceObjectType?: string;
    accessToken?: string;
    phoneNumberId?: string;
    mediaId?: string;
    mediaType?: string;
    mimeType?: string;
    filename?: string;
  }): Promise<{ messageId: string; status: string }>;

  findContact(params: {
    phoneNumber: string;
  }): Promise<WorkspaceContactResult | null>;

  resolveContact(params: {
    phoneNumber: string;
    name?: string;
    email?: string;
  }): Promise<WorkspaceContactResult | null>;

  createContact(params: {
    name: string;
    phoneNumber: string;
    email?: string;
    company?: string;
    labels?: string;
  }): Promise<WorkspaceContactResult>;

  updateContact(
    id: string,
    updates: { name?: string; phoneNumber?: string; email?: string; company?: string; labels?: string }
  ): Promise<boolean>;

  deleteContact(id: string): Promise<boolean>;

  fieldSchema(): FieldMappingSchema[];
  validateMapping(): Promise<boolean>;
}
