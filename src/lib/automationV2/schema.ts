// src/lib/automationV2/schema.ts

export type AutomationStatus = 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
export type AutomationVersion = number;

export interface AutomationV2 {
  id: string;
  name: string;
  description?: string;
  
  // Multi-Workspace Isolation (Critical)
  tenantId: string;
  workspaceId: string;
  workspaceType: 'salescloud' | 'sfmc' | 'hubspot' | 'zoho';
  
  // Governance
  status: AutomationStatus;
  version: AutomationVersion;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Enrollment Rules
  enrollmentRules: {
    mode: 'ALLOW_ONCE' | 'ALLOW_MULTIPLE' | 'RE_ENTER_AFTER_DAYS' | 'RE_ENTER_ON_CONDITION';
    reEnterDays?: number;
  };
  
  // Canvas Data
  nodes: AutomationNode[];
  edges: AutomationEdge[];
}

export type NodeType = 
  // Triggers
  | 'TRIGGER_CONTACT_CREATED' | 'TRIGGER_MESSAGE_RECEIVED' | 'TRIGGER_MANUAL'
  | 'TRIGGER_LEAD_CREATED' | 'TRIGGER_OPPORTUNITY_WON'
  // Logic
  | 'LOGIC_IF_ELSE' | 'LOGIC_SWITCH' | 'LOGIC_WAIT_UNTIL' | 'LOGIC_RANDOM_SPLIT'
  // Flow
  | 'FLOW_GOAL' | 'FLOW_EXIT'
  // Messaging
  | 'ACTION_SEND_TEMPLATE' | 'ACTION_SEND_TEXT' | 'ACTION_SEND_MEDIA'
  // CRM
  | 'ACTION_CREATE_LEAD' | 'ACTION_UPDATE_LEAD' | 'ACTION_ASSIGN_AGENT'
  // AI
  | 'AI_LEAD_SCORE' | 'AI_SENTIMENT' | 'AI_INTENT'
  // Integrations
  | 'ACTION_WEBHOOK';

export interface AutomationNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>; // Flexible config payload for the right-side panel
}

export interface AutomationEdge {
  id: string;
  source: string; // Source Node ID
  target: string; // Target Node ID
  sourceHandle?: string; // For switch/branching outputs
  targetHandle?: string;
}

export interface EnrollmentState {
  id: string;
  journeyId: string;
  contactId: string;
  tenantId: string;
  workspaceId: string;
  currentNodeId: string;
  status: 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'EXITED' | 'GOAL_ACHIEVED';
  enrolledAt: string;
  lastStepAt: string;
  variables: Record<string, any>;
}
