// src/lib/automationV2/triggerRegistry.ts

export type TriggerCategory = 'WHATSAPP' | 'CRM' | 'CONTACT' | 'SYSTEM';

export interface TriggerDefinition {
  eventId: string;
  category: TriggerCategory;
  label: string;
}

export const TRIGGER_REGISTRY: Record<string, TriggerDefinition> = {
  // --- WHATSAPP TRIGGERS ---
  'wa.message.received': { eventId: 'wa.message.received', category: 'WHATSAPP', label: 'Message Received' },
  'wa.message.sent': { eventId: 'wa.message.sent', category: 'WHATSAPP', label: 'Message Sent' },
  'wa.template.delivered': { eventId: 'wa.template.delivered', category: 'WHATSAPP', label: 'Template Delivered' },
  'wa.template.read': { eventId: 'wa.template.read', category: 'WHATSAPP', label: 'Template Read' },
  'wa.button.clicked': { eventId: 'wa.button.clicked', category: 'WHATSAPP', label: 'Button Clicked' },
  'wa.quick_reply.clicked': { eventId: 'wa.quick_reply.clicked', category: 'WHATSAPP', label: 'Quick Reply Clicked' },
  'wa.customer.replied': { eventId: 'wa.customer.replied', category: 'WHATSAPP', label: 'Customer Replied' },
  
  // --- CRM TRIGGERS ---
  'crm.lead.created': { eventId: 'crm.lead.created', category: 'CRM', label: 'Lead Created' },
  'crm.lead.updated': { eventId: 'crm.lead.updated', category: 'CRM', label: 'Lead Updated' },
  'crm.opportunity.won': { eventId: 'crm.opportunity.won', category: 'CRM', label: 'Opportunity Won' },
  'crm.opportunity.lost': { eventId: 'crm.opportunity.lost', category: 'CRM', label: 'Opportunity Lost' },
  'crm.owner.changed': { eventId: 'crm.owner.changed', category: 'CRM', label: 'Owner Changed' },
  
  // --- CONTACT TRIGGERS ---
  'contact.created': { eventId: 'contact.created', category: 'CONTACT', label: 'Contact Created' },
  'contact.updated': { eventId: 'contact.updated', category: 'CONTACT', label: 'Contact Updated' },
  'contact.label.added': { eventId: 'contact.label.added', category: 'CONTACT', label: 'Label Added' },
  'contact.list.joined': { eventId: 'contact.list.joined', category: 'CONTACT', label: 'List Joined' },
  
  // --- SYSTEM TRIGGERS ---
  'sys.scheduled_date': { eventId: 'sys.scheduled_date', category: 'SYSTEM', label: 'Scheduled Date' },
  'sys.birthday': { eventId: 'sys.birthday', category: 'SYSTEM', label: 'Birthday' },
  'sys.no_reply_days': { eventId: 'sys.no_reply_days', category: 'SYSTEM', label: 'No Reply X Days' },
  'sys.coverage.started': { eventId: 'sys.coverage.started', category: 'SYSTEM', label: 'Coverage Started' }
};
