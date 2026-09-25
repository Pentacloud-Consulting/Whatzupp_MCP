import { ConversationFlow } from './flowSchema';
import { v4 as uuidv4 } from 'uuid';

const globalAny: any = global;
if (!globalAny.flowStore) {
  const store = new Map<string, ConversationFlow>();
  
  const demoFlow: ConversationFlow = {
    id: 'flow-demo-1',
    name: 'Pentacloud Lead Qualification',
    description: 'Automatically qualify leads who message "Pentacloud"',
    tenantId: 'tenant-1',
    workspaceId: 'salescloud-ws-1',
    workspaceType: 'salescloud',
    status: 'active',
    keywords: [
      { keyword: 'Pentacloud', matchType: 'contains' },
      { keyword: 'salesforce', matchType: 'contains' },
    ],
    nodes: [
      {
        id: 'n1', type: 'TRIGGER_KEYWORD', label: 'Keyword: Pentacloud',
        data: {}, position: { x: 300, y: 50 }, nextNodeId: 'n2',
      },
      {
        id: 'n2', type: 'MESSAGE_TEXT', label: 'Welcome Message',
        data: { messageText: 'Thank you for contacting Pentacloud Consulting.\n\nWould you like to know more about our Salesforce Services?' },
        position: { x: 300, y: 180 }, nextNodeId: 'n3',
      },
      {
        id: 'n3', type: 'QUESTION_BUTTONS', label: 'Interest Check',
        data: {
          questionText: 'Are you interested in learning more?',
          buttons: [
            { id: 'btn-yes', label: 'Yes', nextNodeId: 'n4' },
            { id: 'btn-no', label: 'No', nextNodeId: 'n6' },
          ],
        },
        position: { x: 300, y: 320 },
      },
      {
        id: 'n4', type: 'QUESTION_BUTTONS', label: 'Service Selection',
        data: {
          questionText: 'Which service are you interested in?',
          buttons: [
            { id: 'btn-sf', label: 'Salesforce', nextNodeId: 'n5' },
            { id: 'btn-zoho', label: 'Zoho', nextNodeId: 'n5' },
            { id: 'btn-mc', label: 'Marketing Cloud', nextNodeId: 'n5' },
          ],
        },
        position: { x: 150, y: 480 },
      },
      {
        id: 'n5', type: 'ACTION_SALESFORCE', label: 'Create Lead',
        data: {
          salesforceAction: {
            actionType: 'CREATE_LEAD',
            fieldMappings: { LastName: '{{contact.name}}', Phone: '{{contact.phone}}', LeadSource: 'WhatsApp', Status: 'Open' },
          },
        },
        position: { x: 150, y: 630 }, nextNodeId: 'n7',
      },
      {
        id: 'n6', type: 'MESSAGE_TEXT', label: 'Goodbye Message',
        data: { messageText: 'Thank you. Feel free to contact us anytime!' },
        position: { x: 500, y: 480 }, nextNodeId: 'n8',
      },
      {
        id: 'n7', type: 'MESSAGE_TEXT', label: 'Confirmation',
        data: { messageText: 'Great! Our team will contact you shortly for a free consultation.' },
        position: { x: 150, y: 780 }, nextNodeId: 'n9',
      },
      { id: 'n8', type: 'END', label: 'End (No Interest)', data: {}, position: { x: 500, y: 630 } },
      { id: 'n9', type: 'END', label: 'End (Lead Created)', data: {}, position: { x: 150, y: 920 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'btn-yes', label: 'Yes' },
      { id: 'e4', source: 'n3', target: 'n6', sourceHandle: 'btn-no', label: 'No' },
      { id: 'e5', source: 'n4', target: 'n5', label: 'Any Selection' },
      { id: 'e6', source: 'n5', target: 'n7' },
      { id: 'e7', source: 'n6', target: 'n8' },
      { id: 'e8', source: 'n7', target: 'n9' },
    ],
    createdBy: 'Zuhaib',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
    version: 1,
  };
  
  store.set(demoFlow.id, demoFlow);
  globalAny.flowStore = store;
}

// Ensure the demo flow exists if it was hot-reloaded empty
if (!globalAny.flowStore.has('flow-demo-1')) {
  // Re-run the demo flow insertion
  const demoFlow: ConversationFlow = {
    id: 'flow-demo-1',
    name: 'Pentacloud Lead Qualification',
    description: 'Automatically qualify leads who message "Pentacloud"',
    tenantId: 'tenant-1',
    workspaceId: 'salescloud-ws-1',
    workspaceType: 'salescloud',
    status: 'active',
    keywords: [
      { keyword: 'Pentacloud', matchType: 'contains' },
      { keyword: 'salesforce', matchType: 'contains' },
    ],
    nodes: [
      {
        id: 'n1', type: 'TRIGGER_KEYWORD', label: 'Keyword: Pentacloud',
        data: {}, position: { x: 300, y: 50 }, nextNodeId: 'n2',
      },
      {
        id: 'n2', type: 'MESSAGE_TEXT', label: 'Welcome Message',
        data: { messageText: 'Thank you for contacting Pentacloud Consulting.\n\nWould you like to know more about our Salesforce Services?' },
        position: { x: 300, y: 180 }, nextNodeId: 'n3',
      },
      {
        id: 'n3', type: 'QUESTION_BUTTONS', label: 'Interest Check',
        data: {
          questionText: 'Are you interested in learning more?',
          buttons: [
            { id: 'btn-yes', label: 'Yes', nextNodeId: 'n4' },
            { id: 'btn-no', label: 'No', nextNodeId: 'n6' },
          ],
        },
        position: { x: 300, y: 320 },
      },
      {
        id: 'n4', type: 'QUESTION_BUTTONS', label: 'Service Selection',
        data: {
          questionText: 'Which service are you interested in?',
          buttons: [
            { id: 'btn-sf', label: 'Salesforce', nextNodeId: 'n5' },
            { id: 'btn-zoho', label: 'Zoho', nextNodeId: 'n5' },
            { id: 'btn-mc', label: 'Marketing Cloud', nextNodeId: 'n5' },
          ],
        },
        position: { x: 150, y: 480 },
      },
      {
        id: 'n5', type: 'ACTION_SALESFORCE', label: 'Create Lead',
        data: {
          salesforceAction: {
            actionType: 'CREATE_LEAD',
            fieldMappings: { LastName: '{{contact.name}}', Phone: '{{contact.phone}}', LeadSource: 'WhatsApp', Status: 'Open' },
          },
        },
        position: { x: 150, y: 630 }, nextNodeId: 'n7',
      },
      {
        id: 'n6', type: 'MESSAGE_TEXT', label: 'Goodbye Message',
        data: { messageText: 'Thank you. Feel free to contact us anytime!' },
        position: { x: 500, y: 480 }, nextNodeId: 'n8',
      },
      {
        id: 'n7', type: 'MESSAGE_TEXT', label: 'Confirmation',
        data: { messageText: 'Great! Our team will contact you shortly for a free consultation.' },
        position: { x: 150, y: 780 }, nextNodeId: 'n9',
      },
      { id: 'n8', type: 'END', label: 'End (No Interest)', data: {}, position: { x: 500, y: 630 } },
      { id: 'n9', type: 'END', label: 'End (Lead Created)', data: {}, position: { x: 150, y: 920 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'btn-yes', label: 'Yes' },
      { id: 'e4', source: 'n3', target: 'n6', sourceHandle: 'btn-no', label: 'No' },
      { id: 'e5', source: 'n4', target: 'n5', label: 'Any Selection' },
      { id: 'e6', source: 'n5', target: 'n7' },
      { id: 'e7', source: 'n6', target: 'n8' },
      { id: 'e8', source: 'n7', target: 'n9' },
    ],
    createdBy: 'Zuhaib',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
    version: 1,
  };
  globalAny.flowStore.set(demoFlow.id, demoFlow);
}

export const flowStore = globalAny.flowStore;
