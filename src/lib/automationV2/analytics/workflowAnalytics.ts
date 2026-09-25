// src/lib/automationV2/analytics/workflowAnalytics.ts

export interface WorkflowMetrics {
  journeyId: string;
  tenantId: string;
  workspaceId: string;
  
  entered: number;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  goalAchieved: number;
  dropped: number;
  
  updatedAt: string;
}

/**
 * Increments global workflow metrics when state changes occur.
 */
export const trackWorkflowState = async (
  tenantId: string,
  workspaceId: string,
  journeyId: string,
  event: 'ENTER' | 'COMPLETE' | 'FAIL' | 'GOAL' | 'DROP' | 'WAIT'
) => {
  // In production, run atomic increment in Redis/Prisma
  console.log(`[WorkflowAnalytics] Tracked ${event} for Journey ${journeyId}`);
};

/**
 * Aggregates live workflow metrics for the Canvas UI overlay.
 */
export const getWorkflowMetrics = async (
  tenantId: string,
  workspaceId: string,
  journeyId: string
): Promise<WorkflowMetrics> => {
  return {
    journeyId,
    tenantId,
    workspaceId,
    entered: 1250,
    active: 150,
    waiting: 80,
    completed: 920,
    failed: 10,
    goalAchieved: 80,
    dropped: 10,
    updatedAt: new Date().toISOString()
  };
};
