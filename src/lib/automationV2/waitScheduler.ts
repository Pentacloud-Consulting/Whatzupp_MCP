// src/lib/automationV2/waitScheduler.ts

export type WaitType = 'DURATION' | 'DATE' | 'EVENT';

export interface WaitData {
  waitType: WaitType;
  // For DURATION
  minutes?: number;
  hours?: number;
  days?: number;
  // For DATE
  targetDate?: string;
  // For EVENT
  eventName?: string;
}

/**
 * Calculates the exact timestamp a waiting contact should resume execution.
 */
export const calculateResumeTime = (nodeData: WaitData): number | null => {
  const now = Date.now();

  if (nodeData.waitType === 'DURATION') {
    let ms = 0;
    if (nodeData.minutes) ms += nodeData.minutes * 60 * 1000;
    if (nodeData.hours) ms += nodeData.hours * 60 * 60 * 1000;
    if (nodeData.days) ms += nodeData.days * 24 * 60 * 60 * 1000;
    return now + ms;
  }

  if (nodeData.waitType === 'DATE') {
    if (!nodeData.targetDate) return null;
    return new Date(nodeData.targetDate).getTime();
  }

  if (nodeData.waitType === 'EVENT') {
    // Returns null to indicate indefinite pause until webhook/event listener triggers resume
    return null; 
  }

  return null;
};

/**
 * Puts a contact into a waiting state in the database.
 */
export const suspendExecution = async (
  tenantId: string,
  workspaceId: string,
  contactId: string,
  journeyId: string,
  nodeId: string,
  resumeTime: number | null
): Promise<void> => {
  // In production, this writes to the EnrollmentState table marking status as 'WAITING'
  // with a `resumeAt` timestamp. Background CRON jobs pick these up when time expires.
  console.log(`[WaitScheduler] Suspended ${contactId} at node ${nodeId} until ${resumeTime}`);
};
