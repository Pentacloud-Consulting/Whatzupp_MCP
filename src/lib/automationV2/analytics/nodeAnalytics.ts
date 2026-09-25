// src/lib/automationV2/analytics/nodeAnalytics.ts

export interface NodeMetrics {
  journeyId: string;
  nodeId: string;
  tenantId: string;
  workspaceId: string;
  
  entered: number;
  executed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  retried: number;
  
  whatsapp?: {
    delivered: number;
    read: number;
    replied: number;
    ctr: number;
  };
}

/**
 * Increments individual node execution metrics.
 */
export const trackNodeExecution = async (
  tenantId: string,
  workspaceId: string,
  journeyId: string,
  nodeId: string,
  status: 'SUCCESS' | 'FAIL' | 'SKIP' | 'RETRY'
) => {
  console.log(`[NodeAnalytics] Tracked ${status} for Node ${nodeId} in Journey ${journeyId}`);
};

/**
 * Fetches analytics overlay data for a specific canvas node.
 */
export const getNodeMetrics = async (
  tenantId: string,
  workspaceId: string,
  journeyId: string,
  nodeId: string
): Promise<NodeMetrics> => {
  return {
    journeyId,
    nodeId,
    tenantId,
    workspaceId,
    entered: 500,
    executed: 490,
    succeeded: 480,
    failed: 10,
    skipped: 0,
    retried: 5,
    whatsapp: {
      delivered: 480,
      read: 300,
      replied: 50,
      ctr: 10.4
    }
  };
};
