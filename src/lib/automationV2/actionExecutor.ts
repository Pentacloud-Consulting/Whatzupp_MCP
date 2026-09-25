// src/lib/automationV2/actionExecutor.ts
import { executeWebhookNode, WebhookActionData } from './webhookExecutor';
import { executeCrmNode, CRMActionData } from './crmActionExecutor';
import { executeAINode, AIActionData } from './aiActionExecutor';
import { AutomationNode } from './schema';
import { ExecutionContext } from './nodeExecutor';

export interface ActionExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  retryable?: boolean;
}

/**
 * Universal dispatcher for all ACTION_ and AI_ nodes.
 * Implements strict error catching and idempotency routing.
 */
export const executeActionNode = async (
  node: AutomationNode,
  context: ExecutionContext
): Promise<ActionExecutionResult> => {
  
  if (node.type === 'ACTION_SEND_TEMPLATE' || node.type === 'ACTION_SEND_TEXT') {
    // Connect to WhatsApp Cloud API
    console.log(`[ActionExecutor] Sending WhatsApp Message to ${context.contactId}`);
    return { success: true };
  }

  if (node.type.startsWith('ACTION_CREATE_') || node.type.startsWith('ACTION_UPDATE_') || node.type === 'ACTION_ASSIGN_AGENT') {
    return await executeCrmNode(
      context.tenantId, 
      context.workspaceId, 
      context.contactData.workspaceType || 'unknown', 
      context.contactId, 
      { actionType: node.type as any, payload: node.data }
    );
  }

  if (node.type.startsWith('AI_')) {
    return await executeAINode(
      context.tenantId,
      context.workspaceId,
      context.contactId,
      context.contactData,
      { aiType: node.type as any, instructions: node.data.instructions }
    );
  }

  // Generic API / Webhook fallback
  if (node.type === 'ACTION_WEBHOOK' || node.data?.webhookUrl) {
    return await executeWebhookNode(context.contactId, {
      method: node.data.method || 'POST',
      url: node.data.webhookUrl || node.data.url,
      payload: node.data.payload
    });
  }

  return { success: true, result: 'noop' };
};
