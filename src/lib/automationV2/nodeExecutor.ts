// src/lib/automationV2/nodeExecutor.ts
import { AutomationNode, AutomationV2 } from './schema';
import { resolveIfElse, resolveSwitch, IfElseData, SwitchData } from './branchResolver';
import { resolveRandomSplit, RandomSplitData } from './splitEngine';
import { calculateResumeTime, suspendExecution, WaitData } from './waitScheduler';
import { achieveGoal } from './goalListener';
import { executeActionNode } from './actionExecutor';

export interface ExecutionContext {
  tenantId: string;
  workspaceId: string;
  journeyId: string;
  contactId: string;
  contactData: Record<string, any>;
}

export interface ExecutionResult {
  status: 'CONTINUE' | 'SUSPENDED' | 'EXITED' | 'GOAL_ACHIEVED' | 'FAILED';
  nextEdgeHandle?: string; // which path to take (true/false, branch ID)
  error?: string;
}

/**
 * Executes a single node and returns the outcome to the WorkflowRunner.
 */
export const executeNode = async (
  node: AutomationNode,
  context: ExecutionContext
): Promise<ExecutionResult> => {
  try {
    switch (node.type) {
      
      // --- LOGIC NODES ---
      case 'LOGIC_IF_ELSE':
        const branch = resolveIfElse(context.contactData, node.data as IfElseData);
        return { status: 'CONTINUE', nextEdgeHandle: branch };

      case 'LOGIC_SWITCH':
        const switchBranch = resolveSwitch(context.contactData, node.data as SwitchData);
        return { status: 'CONTINUE', nextEdgeHandle: switchBranch };

      case 'LOGIC_RANDOM_SPLIT':
        const splitBranch = resolveRandomSplit(context.contactId, node.id, node.data as RandomSplitData);
        return { status: 'CONTINUE', nextEdgeHandle: splitBranch };

      case 'LOGIC_WAIT_UNTIL':
        const resumeTime = calculateResumeTime(node.data as WaitData);
        await suspendExecution(context.tenantId, context.workspaceId, context.contactId, context.journeyId, node.id, resumeTime);
        return { status: 'SUSPENDED' };

      // --- FLOW NODES ---
      case 'FLOW_GOAL':
        await achieveGoal(context.tenantId, context.workspaceId, context.journeyId, context.contactId, node.data.goalName);
        return { status: 'GOAL_ACHIEVED' };

      case 'FLOW_EXIT':
        console.log(`[NodeExecutor] Contact ${context.contactId} exited journey ${context.journeyId}`);
        return { status: 'EXITED' };

      // --- ACTION & AI NODES ---
      case 'ACTION_SEND_TEMPLATE':
      case 'ACTION_SEND_TEXT':
      case 'ACTION_CREATE_LEAD':
      case 'ACTION_UPDATE_LEAD':
      case 'ACTION_ASSIGN_AGENT':
      case 'AI_LEAD_SCORE':
      case 'AI_SENTIMENT':
      case 'AI_INTENT':
        const actionResult = await executeActionNode(node, context);
        if (!actionResult.success) {
          // In production: push to Retry / Dead Letter Queue based on actionResult.retryable
          return { status: 'FAILED', error: actionResult.error };
        }
        return { status: 'CONTINUE' };

      default:
        // Triggers and unknown nodes just pass through
        return { status: 'CONTINUE' };
    }
  } catch (error: any) {
    console.error(`[NodeExecutor] Node ${node.id} failed:`, error);
    return { status: 'FAILED', error: error.message };
  }
};
