// src/lib/automationV2/triggerDispatcher.ts
import { runWorkflowEngine } from './workflowRunner';
import { canEnrollContact, EnrollmentRule } from './enrollmentEngine';

export interface SystemEventPayload {
  tenantId: string;
  workspaceId: string;
  eventId: string; // e.g. 'wa.message.received'
  contactId: string;
  eventData: Record<string, any>;
}

/**
 * Intercepts global system events, finds matching active journeys, 
 * evaluates enrollment rules, and fires the execution engine.
 */
export const dispatchTriggerEvent = async (payload: SystemEventPayload) => {
  console.log(`[TriggerDispatcher] Received event ${payload.eventId} for contact ${payload.contactId}`);

  // 1. Fetch all ACTIVE V2 Journeys for this workspace
  // 2. Filter journeys containing a Trigger Node matching `payload.eventId`
  // 3. For each matching journey:
  //    a. Fetch past enrollments for this contact
  //    b. Evaluate Audience Filters & Suppressions
  //    c. Evaluate Enrollment Rules
  //    d. If all pass -> runWorkflowEngine(journey, triggerNodeId, context)
  
  // Mock Execution
  /*
  const context = {
    tenantId: payload.tenantId,
    workspaceId: payload.workspaceId,
    journeyId: matchedJourney.id,
    contactId: payload.contactId,
    contactData: payload.eventData
  };
  await runWorkflowEngine(matchedJourney, matchedTriggerNode.id, context);
  */
};
