// src/lib/conversationFlows/flowNodeRegistry.ts
// Defines the drag-and-drop Node Library for the Flow Builder canvas sidebar.

export interface FlowNodeDefinition {
  type: string;
  label: string;
  description: string;
  category: 'Triggers' | 'Messages' | 'Questions' | 'Logic' | 'Actions' | 'Flow Control';
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
}

export const FLOW_NODE_REGISTRY: FlowNodeDefinition[] = [
  // ─── TRIGGERS ───
  {
    type: 'TRIGGER_KEYWORD',
    label: 'Keyword Trigger',
    description: 'Start flow when keyword is detected',
    category: 'Triggers',
    icon: 'Zap',
    color: 'purple',
  },

  // ─── MESSAGES ───
  {
    type: 'MESSAGE_TEXT',
    label: 'Send Text',
    description: 'Send a plain text message',
    category: 'Messages',
    icon: 'MessageSquare',
    color: 'blue',
  },
  {
    type: 'MESSAGE_TEMPLATE',
    label: 'Send Template',
    description: 'Send a pre-approved WhatsApp template',
    category: 'Messages',
    icon: 'LayoutTemplate',
    color: 'blue',
  },
  {
    type: 'MESSAGE_MEDIA',
    label: 'Send Media',
    description: 'Send image, video, or document',
    category: 'Messages',
    icon: 'Image',
    color: 'blue',
  },

  // ─── QUESTIONS ───
  {
    type: 'QUESTION_BUTTONS',
    label: 'Button Question',
    description: 'Ask with interactive reply buttons',
    category: 'Questions',
    icon: 'ToggleLeft',
    color: 'teal',
  },
  {
    type: 'QUESTION_QUICK_REPLY',
    label: 'Quick Reply',
    description: 'Ask with quick reply buttons',
    category: 'Questions',
    icon: 'Reply',
    color: 'teal',
  },
  {
    type: 'QUESTION_LIST',
    label: 'List Selection',
    description: 'Ask with a scrollable list menu',
    category: 'Questions',
    icon: 'List',
    color: 'teal',
  },

  // ─── LOGIC ───
  {
    type: 'CONDITION_RESPONSE',
    label: 'Response Condition',
    description: 'Branch based on customer response',
    category: 'Logic',
    icon: 'GitBranch',
    color: 'amber',
  },

  // ─── ACTIONS ───
  {
    type: 'ACTION_SALESFORCE',
    label: 'Salesforce Action',
    description: 'Create/Update Lead, Task, or Opportunity',
    category: 'Actions',
    icon: 'Cloud',
    color: 'rose',
  },

  // ─── FLOW CONTROL ───
  {
    type: 'DELAY',
    label: 'Delay',
    description: 'Wait before next step',
    category: 'Flow Control',
    icon: 'Clock',
    color: 'slate',
  },
  {
    type: 'END',
    label: 'End Flow',
    description: 'Terminate the conversation flow',
    category: 'Flow Control',
    icon: 'CircleStop',
    color: 'red',
  },
];
