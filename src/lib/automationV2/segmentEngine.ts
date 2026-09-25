// src/lib/automationV2/segmentEngine.ts
import { FilterGroup, evaluateFilterGroup } from './filterEvaluator';

export interface DynamicSegment {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description: string;
  filters: FilterGroup;
  createdAt: string;
  updatedAt: string;
}

/**
 * Checks if a contact belongs to a specific segment.
 */
export const contactMatchesSegment = (contactData: Record<string, any>, segment: DynamicSegment): boolean => {
  return evaluateFilterGroup(segment.filters, contactData);
};

/**
 * Filters a raw list of contacts down to those matching the segment's dynamic rules.
 */
export const evaluateSegmentAudience = (contacts: any[], segment: DynamicSegment): any[] => {
  return contacts.filter(c => contactMatchesSegment(c, segment));
};

/**
 * Mocks fetch for available segments (Sprint 3)
 */
export const fetchSegmentsForWorkspace = async (tenantId: string, workspaceId: string): Promise<DynamicSegment[]> => {
  // In production, query Prisma database
  return [
    {
      id: 'seg-vip',
      tenantId,
      workspaceId,
      name: 'VIP Customers',
      description: 'Contacts marked as VIP or High Value',
      filters: {
        logic: 'OR',
        conditions: [
          { field: 'label', operator: 'EQUALS', value: 'VIP' },
          { field: 'dealValue', operator: 'GREATER_THAN', value: 10000 }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};
