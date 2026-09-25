// src/lib/conversationFlows/flowSchema.ts
// Schema definitions for the Conversation Flows module.
// This module is completely isolated from all other WhatZupp modules.

export type FlowNodeType =
  | 'TRIGGER_KEYWORD'
  | 'MESSAGE_TEXT'
  | 'MESSAGE_TEMPLATE'
  | 'MESSAGE_MEDIA'
  | 'QUESTION_BUTTONS'
  | 'QUESTION_QUICK_REPLY'
  | 'QUESTION_LIST'
  | 'CONDITION_RESPONSE'
  | 'ACTION_SALESFORCE'
  | 'DELAY'
  | 'END';

export type FlowStatus = 'draft' | 'active' | 'paused' | 'archived';

export type KeywordMatchType = 'exact' | 'contains';

export interface FlowKeyword {
  keyword: string;
  matchType: KeywordMatchType;
}

export interface FlowButtonOption {
  id: string;
  label: string;       // Button text displayed to customer
  nextNodeId: string;   // Which node to go to when this button is clicked
}

export interface FlowListOption {
  id: string;
  title: string;
  description?: string;
  nextNodeId: string;
}

export type SalesforceActionType =
  | 'CREATE_LEAD'
  | 'UPDATE_LEAD'
  | 'UPDATE_CONTACT'
  | 'CREATE_TASK'
  | 'UPDATE_OPPORTUNITY';

export interface SalesforceActionConfig {
  actionType: SalesforceActionType;
  fieldMappings: Record<string, string>; // SF field -> value or {{variable}}
}

export interface FlowNodeData {
  // MESSAGE_TEXT
  messageText?: string;

  // MESSAGE_TEMPLATE
  templateId?: string;
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: Record<string, string>;

  // MESSAGE_MEDIA
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'audio';
  caption?: string;

  // QUESTION_BUTTONS / QUESTION_QUICK_REPLY
  questionText?: string;
  buttons?: FlowButtonOption[];

  // QUESTION_LIST
  listHeaderText?: string;
  listBodyText?: string;
  listButtonLabel?: string;
  listSections?: { title: string; options: FlowListOption[] }[];

  // CONDITION_RESPONSE
  conditionField?: string; // 'lastResponse'
  conditionBranches?: { value: string; nextNodeId: string }[];
  defaultNextNodeId?: string;

  // ACTION_SALESFORCE
  salesforceAction?: SalesforceActionConfig;

  // DELAY
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  data: FlowNodeData;
  position: { x: number; y: number };
  nextNodeId?: string; // For linear nodes (non-branching)
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface ConversationFlow {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  workspaceId: string;
  workspaceType: 'salescloud' | 'sfmc';
  status: FlowStatus;
  keywords: FlowKeyword[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  analytics?: FlowAnalytics;
}

export interface FlowAnalytics {
  flowId: string;
  started: number;
  completed: number;
  dropOff: number;
  keywordHits: number;
  buttonClicks: number;
  leadsCreated: number;
  responseRate: number;
}

// Execution state — stored in Salesforce Custom Object or SFMC Data Extension
export interface FlowInstance {
  id: string;
  flowId: string;
  phone: string;
  currentNodeId: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  responses: Record<string, string>; // nodeId -> customer response
  startedAt: string;
  lastResponseAt: string;
  tenantId: string;
  workspaceId: string;
  workspaceType: 'salescloud' | 'sfmc';
}
