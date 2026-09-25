// src/lib/automationV2/goalListener.ts

export type GoalEvent = 'CUSTOMER_REPLIED' | 'DEAL_WON' | 'PAYMENT_RECEIVED' | 'TAG_APPLIED' | 'LEAD_CONVERTED';

export interface GoalPayload {
  tenantId: string;
  workspaceId: string;
  contactId: string;
  event: GoalEvent;
  metadata?: Record<string, any>;
}

/**
 * Triggers when an external system (Webhook, Salesforce Sync, WhatsApp reply) fires a goal event.
 * Scans all ACTIVE and WAITING journey enrollments for this contact that have a matching Goal Node.
 */
export const processGoalEvent = async (payload: GoalPayload): Promise<void> => {
  console.log(`[GoalListener] Received Goal Event: ${payload.event} for Contact: ${payload.contactId}`);

  // Workflow:
  // 1. Fetch all ACTIVE/WAITING enrollments for payload.contactId
  // 2. Load the journey definition for those enrollments
  // 3. Scan the journey nodes for `FLOW_GOAL` or `LOGIC_WAIT_UNTIL (event)`
  // 4. If a Goal matches the payload.event:
  //    - Mark enrollment as GOAL_ACHIEVED
  //    - Update Analytics (Goal Achieved +1)
  // 5. If a Wait matches the payload.event:
  //    - Resume execution from the Wait Node
};

/**
 * Instantly marks a contact's journey as GOAL_ACHIEVED and prevents further node execution.
 */
export const achieveGoal = async (
  tenantId: string, 
  workspaceId: string, 
  journeyId: string, 
  contactId: string,
  goalName: string
): Promise<void> => {
  // Update Enrollment Status to 'GOAL_ACHIEVED'
  // Increment Journey Analytics metrics
  console.log(`[GoalListener] Contact ${contactId} achieved goal: ${goalName} in Journey ${journeyId}`);
};
