/**
 * Follow-Up Scheduler Store (Server-Side In-Memory + Persistent via localStorage relay)
 * 
 * Stores scheduled follow-up messages in-memory on the server and processes them
 * at their scheduled time. When a follow-up is due, it triggers the WhatsApp send-message
 * API and logs the activity to Salesforce Sales Cloud.
 * 
 * Architecture:
 * - Scheduled follow-ups are stored in a Map keyed by ID
 * - A processing function checks all pending jobs and fires those that are due
 * - After sending, status is updated to 'Sent' and logged to Salesforce
 */

export interface ScheduledFollowUp {
  id: string;
  tenantId: string;
  workspaceId: string;
  workspaceType: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  agentId: string;
  agentName: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm (24h)
  message: string;
  status: 'Scheduled' | 'Sent' | 'Failed';
  createdAt: string;
  sentAt?: string;
  whatsappMessageId?: string;
  salesforceActivityId?: string;
  error?: string;
}

// In-memory store for scheduled follow-ups (survives across API calls within same process)
const globalForScheduler = globalThis as unknown as {
  _scheduledFollowUps: Map<string, ScheduledFollowUp>;
};

const scheduledFollowUps = globalForScheduler._scheduledFollowUps || new Map<string, ScheduledFollowUp>();
if (process.env.NODE_ENV !== 'production') {
  globalForScheduler._scheduledFollowUps = scheduledFollowUps;
}

/**
 * Add a new follow-up to the scheduler
 */
export function addScheduledFollowUp(followUp: ScheduledFollowUp): void {
  scheduledFollowUps.set(followUp.id, followUp);
  console.log(`[FollowUpScheduler] Added: ${followUp.id} for ${followUp.contactName} at ${followUp.date} ${followUp.time} → "${followUp.message}"`);
}

/**
 * Get all scheduled follow-ups
 */
export function getAllFollowUps(): ScheduledFollowUp[] {
  return Array.from(scheduledFollowUps.values());
}

/**
 * Get follow-ups for a specific contact
 */
export function getFollowUpsForContact(contactId: string): ScheduledFollowUp[] {
  return Array.from(scheduledFollowUps.values()).filter(fu => fu.contactId === contactId);
}

/**
 * Update a follow-up's status
 */
export function updateFollowUpStatus(
  id: string,
  status: 'Sent' | 'Failed',
  extra?: { sentAt?: string; whatsappMessageId?: string; salesforceActivityId?: string; error?: string }
): void {
  const fu = scheduledFollowUps.get(id);
  if (fu) {
    fu.status = status;
    if (extra) {
      if (extra.sentAt) fu.sentAt = extra.sentAt;
      if (extra.whatsappMessageId) fu.whatsappMessageId = extra.whatsappMessageId;
      if (extra.salesforceActivityId) fu.salesforceActivityId = extra.salesforceActivityId;
      if (extra.error) fu.error = extra.error;
    }
    scheduledFollowUps.set(id, fu);
  }
}

/**
 * Get all pending follow-ups that are due (scheduled time <= now)
 */
export function getDueFollowUps(): ScheduledFollowUp[] {
  const now = new Date();
  return Array.from(scheduledFollowUps.values()).filter(fu => {
    if (fu.status !== 'Scheduled') return false;
    
    // Parse the scheduled date/time
    const scheduledTime = new Date(`${fu.date}T${fu.time}:00`);
    
    // Check if the scheduled time has passed
    return scheduledTime <= now;
  });
}

/**
 * Remove a follow-up by ID
 */
export function removeFollowUp(id: string): boolean {
  return scheduledFollowUps.delete(id);
}

/**
 * Edit a scheduled follow-up
 */
export function editFollowUp(
  id: string,
  updates: { date?: string; time?: string; message?: string }
): boolean {
  const fu = scheduledFollowUps.get(id);
  if (!fu) return false;
  
  if (updates.date) fu.date = updates.date;
  if (updates.time) fu.time = updates.time;
  if (updates.message) fu.message = updates.message;
  
  scheduledFollowUps.set(id, fu);
  return true;
}

/**
 * Get scheduler stats
 */
export function getSchedulerStats() {
  const all = Array.from(scheduledFollowUps.values());
  return {
    total: all.length,
    scheduled: all.filter(fu => fu.status === 'Scheduled').length,
    sent: all.filter(fu => fu.status === 'Sent').length,
    failed: all.filter(fu => fu.status === 'Failed').length,
  };
}
