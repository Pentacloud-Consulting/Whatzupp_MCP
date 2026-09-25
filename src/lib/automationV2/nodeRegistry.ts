import { NodeType } from './schema';

export interface NodeDefinition {
  type: NodeType;
  label: string;
  category: 'Triggers' | 'Messaging' | 'Logic' | 'CRM' | 'AI' | 'Integrations';
  description: string;
  icon: string; // We will map this to a Lucide icon in the UI
  defaultData: Record<string, any>;
}

export const NODE_REGISTRY: NodeDefinition[] = [
  // --- TRIGGERS ---
  { type: 'TRIGGER_CONTACT_CREATED', label: 'Contact Created', category: 'Triggers', description: 'Triggers when a new contact is added', icon: 'UserPlus', defaultData: {} },
  { type: 'TRIGGER_MESSAGE_RECEIVED', label: 'Message Received', category: 'Triggers', description: 'Triggers when contact sends a message', icon: 'MessageSquare', defaultData: { keywords: [] } },
  { type: 'TRIGGER_MANUAL', label: 'Manual Trigger', category: 'Triggers', description: 'Triggered manually by an agent', icon: 'Hand', defaultData: {} },
  { type: 'TRIGGER_LEAD_CREATED', label: 'Lead Created', category: 'Triggers', description: 'Triggers on new CRM lead', icon: 'UserCircle', defaultData: {} },
  
  // --- MESSAGING ---
  { type: 'ACTION_SEND_TEMPLATE', label: 'Send Template', category: 'Messaging', description: 'Sends a pre-approved WhatsApp template', icon: 'FileText', defaultData: { templateId: '', language: 'en' } },
  { type: 'ACTION_SEND_TEXT', label: 'Send Text', category: 'Messaging', description: 'Sends a plain text WhatsApp message', icon: 'Type', defaultData: { message: '' } },
  { type: 'ACTION_SEND_MEDIA', label: 'Send Media', category: 'Messaging', description: 'Sends an image, video, or PDF document', icon: 'Image', defaultData: { mediaUrl: '', mediaType: 'image' } },
  
  // --- LOGIC ---
  { type: 'LOGIC_IF_ELSE', label: 'If / Else', category: 'Logic', description: 'Splits flow based on a true/false condition', icon: 'GitBranch', defaultData: { conditions: [] } },
  { type: 'LOGIC_SWITCH', label: 'Switch Path', category: 'Logic', description: 'Splits flow into multiple distinct paths', icon: 'ListTree', defaultData: { branches: [] } },
  { type: 'LOGIC_WAIT_UNTIL', label: 'Wait Node', category: 'Logic', description: 'Pauses execution for a duration or until event', icon: 'Clock', defaultData: { waitType: 'duration', minutes: 0, hours: 0, days: 0 } },
  { type: 'FLOW_GOAL', label: 'Goal Reached', category: 'Logic', description: 'Marks successful completion and exits', icon: 'Target', defaultData: { goalName: '' } },
  { type: 'FLOW_EXIT', label: 'Exit Journey', category: 'Logic', description: 'Immediately stops the journey for the contact', icon: 'XCircle', defaultData: {} },

  // --- CRM ---
  { type: 'ACTION_CREATE_LEAD', label: 'Create Lead', category: 'CRM', description: 'Creates a Lead in the connected CRM', icon: 'Briefcase', defaultData: { status: 'New' } },
  { type: 'ACTION_UPDATE_LEAD', label: 'Update Lead', category: 'CRM', description: 'Updates existing Lead attributes', icon: 'Edit3', defaultData: {} },
  { type: 'ACTION_ASSIGN_AGENT', label: 'Assign Agent', category: 'CRM', description: 'Assigns the contact to a specific agent', icon: 'UserCheck', defaultData: { agentId: '' } },
  
  // --- AI ---
  { type: 'AI_LEAD_SCORE', label: 'AI Lead Score', category: 'AI', description: 'Predicts lead conversion probability (0-100)', icon: 'Brain', defaultData: {} },
  { type: 'AI_SENTIMENT', label: 'Sentiment Analysis', category: 'AI', description: 'Analyzes if last reply was Positive/Negative', icon: 'Smile', defaultData: {} },
  { type: 'AI_INTENT', label: 'Intent Detection', category: 'AI', description: 'Classifies intent (Support, Sales, Refund)', icon: 'Search', defaultData: {} },
];

export const getNodesByCategory = () => {
  const categories: Record<string, NodeDefinition[]> = {};
  NODE_REGISTRY.forEach(node => {
    if (!categories[node.category]) categories[node.category] = [];
    categories[node.category].push(node);
  });
  return categories;
};
