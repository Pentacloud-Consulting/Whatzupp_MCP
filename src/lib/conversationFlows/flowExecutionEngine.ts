// src/lib/conversationFlows/flowExecutionEngine.ts
// The core execution engine for Conversation Flows.
// Processes inbound messages, matches keywords, traverses flow nodes,
// and sends WhatsApp responses via the existing WhatsApp Cloud API.
//
// State is persisted ONLY in Salesforce (Sales Cloud) or SFMC (Data Extensions).
// No local database, MongoDB, or Prisma usage.

import { ConversationFlow, FlowNode, FlowInstance } from './flowSchema';
import { salesCloudFlowStateStore, sfmcFlowStateStore } from './flowStateStore';
import { v4 as uuidv4 } from 'uuid';

// ─── Keyword Matching ───────────────────────────────────────────
export const matchKeyword = (
  messageText: string,
  flows: ConversationFlow[]
): ConversationFlow | null => {
  const normalized = messageText.trim().toLowerCase();

  for (const flow of flows) {
    if (flow.status !== 'active') continue;

    for (const kw of flow.keywords) {
      const kwNorm = kw.keyword.trim().toLowerCase();
      if (kw.matchType === 'exact' && normalized === kwNorm) return flow;
      if (kw.matchType === 'contains' && normalized.includes(kwNorm)) return flow;
    }
  }

  return null;
};

// ─── Find the trigger node (entry point) ────────────────────────
export const findTriggerNode = (flow: ConversationFlow): FlowNode | null => {
  return flow.nodes.find(n => n.type === 'TRIGGER_KEYWORD') || null;
};

// ─── Find the next node after a given node ──────────────────────
export const findNextNode = (flow: ConversationFlow, currentNodeId: string, responseValue?: string): FlowNode | null => {
  const currentNode = flow.nodes.find(n => n.id === currentNodeId);
  if (!currentNode) return null;

  // For branching nodes (QUESTION_BUTTONS, CONDITION_RESPONSE), find matching branch
  if (currentNode.type === 'QUESTION_BUTTONS' || currentNode.type === 'QUESTION_QUICK_REPLY') {
    if (responseValue && currentNode.data.buttons) {
      const matchedBtn = currentNode.data.buttons.find(
        b => b.label.toLowerCase() === responseValue.toLowerCase()
      );
      if (matchedBtn) {
        return flow.nodes.find(n => n.id === matchedBtn.nextNodeId) || null;
      }
    }
    // Default: fall through to nextNodeId or first button
    if (currentNode.nextNodeId) return flow.nodes.find(n => n.id === currentNode.nextNodeId) || null;
    return null;
  }

  if (currentNode.type === 'QUESTION_LIST') {
    if (responseValue && currentNode.data.listSections) {
      for (const section of currentNode.data.listSections) {
        const match = section.options.find(
          o => o.title.toLowerCase() === responseValue.toLowerCase()
        );
        if (match) return flow.nodes.find(n => n.id === match.nextNodeId) || null;
      }
    }
    return null;
  }

  if (currentNode.type === 'CONDITION_RESPONSE') {
    if (responseValue && currentNode.data.conditionBranches) {
      const match = currentNode.data.conditionBranches.find(
        b => b.value.toLowerCase() === responseValue.toLowerCase()
      );
      if (match) return flow.nodes.find(n => n.id === match.nextNodeId) || null;
    }
    // Default branch
    if (currentNode.data.defaultNextNodeId) {
      return flow.nodes.find(n => n.id === currentNode.data.defaultNextNodeId) || null;
    }
    return null;
  }

  // For linear nodes, use edge or nextNodeId
  if (currentNode.nextNodeId) {
    return flow.nodes.find(n => n.id === currentNode.nextNodeId) || null;
  }

  // Fallback: find via edges
  const outEdge = flow.edges.find(e => e.source === currentNodeId);
  if (outEdge) return flow.nodes.find(n => n.id === outEdge.target) || null;

  return null;
};

// ─── Build WhatsApp message payload from a node ─────────────────
export const buildNodePayload = (node: FlowNode): any => {
  switch (node.type) {
    case 'MESSAGE_TEXT':
      return { type: 'text', text: { body: node.data.messageText || '' } };

    case 'MESSAGE_TEMPLATE':
      return {
        type: 'template',
        template: {
          name: node.data.templateName,
          language: { code: node.data.templateLanguage || 'en' },
        },
      };

    case 'MESSAGE_MEDIA':
      return {
        type: node.data.mediaType || 'image',
        [node.data.mediaType || 'image']: {
          link: node.data.mediaUrl,
          caption: node.data.caption,
        },
      };

    case 'QUESTION_BUTTONS':
      return {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: node.data.questionText || '' },
          action: {
            buttons: (node.data.buttons || []).map((b, i) => ({
              type: 'reply',
              reply: { id: b.id, title: b.label },
            })),
          },
        },
      };

    case 'QUESTION_QUICK_REPLY':
      return {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: node.data.questionText || '' },
          action: {
            buttons: (node.data.buttons || []).map(b => ({
              type: 'reply',
              reply: { id: b.id, title: b.label },
            })),
          },
        },
      };

    case 'QUESTION_LIST':
      return {
        type: 'interactive',
        interactive: {
          type: 'list',
          header: node.data.listHeaderText ? { type: 'text', text: node.data.listHeaderText } : undefined,
          body: { text: node.data.listBodyText || '' },
          action: {
            button: node.data.listButtonLabel || 'Select',
            sections: (node.data.listSections || []).map(s => ({
              title: s.title,
              rows: s.options.map(o => ({
                id: o.id,
                title: o.title,
                description: o.description,
              })),
            })),
          },
        },
      };

    default:
      return null;
  }
};

// ─── Create a new flow instance ─────────────────────────────────
export const createFlowInstance = (
  flow: ConversationFlow,
  phone: string,
  startNodeId: string
): FlowInstance => {
  return {
    id: `fi-${uuidv4()}`,
    flowId: flow.id,
    phone,
    currentNodeId: startNodeId,
    status: 'active',
    responses: {},
    startedAt: new Date().toISOString(),
    lastResponseAt: new Date().toISOString(),
    tenantId: flow.tenantId,
    workspaceId: flow.workspaceId,
    workspaceType: flow.workspaceType,
  };
};

// ─── Execute nodes sequentially until a wait point ──────────────
export const executeFlowNodes = async (
  flow: ConversationFlow,
  instance: FlowInstance,
  sendMessage: (phone: string, payload: any) => Promise<void>,
  executeSalesforceAction?: (config: any, phone: string) => Promise<void>
): Promise<FlowInstance> => {
  let currentNode: FlowNode | undefined = flow.nodes.find(n => n.id === instance.currentNodeId);
  let safety = 0;

  while (currentNode && safety < 50) {
    safety++;

    switch (currentNode.type) {
      case 'TRIGGER_KEYWORD': {
        // Skip trigger, move to next
        const next = findNextNode(flow, currentNode.id);
        if (next) { currentNode = next; instance.currentNodeId = next.id; }
        else currentNode = undefined;
        break;
      }

      case 'MESSAGE_TEXT':
      case 'MESSAGE_TEMPLATE':
      case 'MESSAGE_MEDIA': {
        const payload = buildNodePayload(currentNode);
        if (payload) await sendMessage(instance.phone, payload);
        const next = findNextNode(flow, currentNode.id);
        if (next) { currentNode = next; instance.currentNodeId = next.id; }
        else { instance.status = 'completed'; currentNode = undefined; }
        break;
      }

      case 'QUESTION_BUTTONS':
      case 'QUESTION_QUICK_REPLY':
      case 'QUESTION_LIST': {
        const payload = buildNodePayload(currentNode);
        if (payload) await sendMessage(instance.phone, payload);
        // WAIT for customer response — pause execution here
        instance.currentNodeId = currentNode.id;
        return instance; // Return to caller; will resume when response arrives
      }

      case 'CONDITION_RESPONSE': {
        const lastResponse = instance.responses[currentNode.id] || '';
        const next = findNextNode(flow, currentNode.id, lastResponse);
        if (next) { currentNode = next; instance.currentNodeId = next.id; }
        else { instance.status = 'completed'; currentNode = undefined; }
        break;
      }

      case 'ACTION_SALESFORCE': {
        if (executeSalesforceAction && currentNode.data.salesforceAction) {
          await executeSalesforceAction(currentNode.data.salesforceAction, instance.phone);
        }
        const next = findNextNode(flow, currentNode.id);
        if (next) { currentNode = next; instance.currentNodeId = next.id; }
        else { instance.status = 'completed'; currentNode = undefined; }
        break;
      }

      case 'DELAY': {
        // Mark instance as waiting, schedule resume
        instance.currentNodeId = currentNode.id;
        // In production, a cron job picks this up after the delay expires
        return instance;
      }

      case 'END': {
        instance.status = 'completed';
        currentNode = undefined;
        break;
      }

      default: {
        const next = findNextNode(flow, currentNode.id);
        if (next) { currentNode = next; instance.currentNodeId = next.id; }
        else currentNode = undefined;
      }
    }
  }

  return instance;
};
