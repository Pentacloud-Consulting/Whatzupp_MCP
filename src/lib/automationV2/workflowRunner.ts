// src/lib/automationV2/workflowRunner.ts
import { AutomationV2, AutomationNode, AutomationEdge } from './schema';
import { executeNode, ExecutionContext } from './nodeExecutor';

/**
 * Traverses the automation graph starting from a specific node for a given contact.
 * This function processes nodes recursively until the contact exits, goals, or pauses (wait node).
 */
export const runWorkflowEngine = async (
  journey: AutomationV2,
  startNodeId: string,
  context: ExecutionContext
): Promise<void> => {
  let currentNodeId: string | undefined = startNodeId;
  let safetyCounter = 0; // Prevent infinite loops during memory execution

  while (currentNodeId && safetyCounter < 100) {
    safetyCounter++;
    const node = journey.nodes.find(n => n.id === currentNodeId);
    if (!node) {
      console.warn(`[WorkflowRunner] Node ${currentNodeId} not found in Journey ${journey.id}`);
      break;
    }

    // 1. Execute the Node
    const result = await executeNode(node, context);

    // 2. Process Result Status
    if (result.status === 'SUSPENDED') {
      // Contact is placed in Waiting state. Break traversal.
      break;
    }

    if (result.status === 'EXITED' || result.status === 'GOAL_ACHIEVED' || result.status === 'FAILED') {
      // Terminal state reached. Break traversal.
      // In production, update EnrollmentState table.
      break;
    }

    // 3. Find the Next Node (Graph Traversal)
    // If it's a branching node (If/Else, Switch), it returns a nextEdgeHandle
    let outEdges = journey.edges.filter(e => e.source === currentNodeId);
    
    if (result.nextEdgeHandle) {
      // Filter out edges that don't match the required branch handle
      outEdges = outEdges.filter(e => e.sourceHandle === result.nextEdgeHandle);
    }

    if (outEdges.length === 0) {
      // End of line. No connected nodes. Implicit Exit.
      console.log(`[WorkflowRunner] Reached end of path for ${context.contactId} at node ${currentNodeId}`);
      break;
    }

    if (outEdges.length > 1) {
      // Parallel execution is typically not supported in strict journey builders without a specific parallel node.
      // For Sprint 4, we take the first matching edge.
      console.warn(`[WorkflowRunner] Multiple outbound edges found without specific handle. Taking first path.`);
    }

    // Traverse to next node
    currentNodeId = outEdges[0].target;
  }

  if (safetyCounter >= 100) {
    console.error(`[WorkflowRunner] Infinite loop safety triggered for ${context.contactId}`);
  }
};
