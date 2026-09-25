export type Operator = 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN' | 'IS_SET' | 'IS_NOT_SET';

export interface FilterCondition {
  field: string;
  operator: Operator;
  value?: any;
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  conditions: (FilterCondition | FilterGroup)[];
}

export const evaluateCondition = (condition: FilterCondition, contactData: Record<string, any>): boolean => {
  const actualValue = contactData[condition.field];

  switch (condition.operator) {
    case 'EQUALS': return actualValue === condition.value;
    case 'NOT_EQUALS': return actualValue !== condition.value;
    case 'CONTAINS': return String(actualValue || '').toLowerCase().includes(String(condition.value).toLowerCase());
    case 'GREATER_THAN': return Number(actualValue) > Number(condition.value);
    case 'LESS_THAN': return Number(actualValue) < Number(condition.value);
    case 'IN': return Array.isArray(condition.value) && condition.value.includes(actualValue);
    case 'NOT_IN': return Array.isArray(condition.value) && !condition.value.includes(actualValue);
    case 'IS_SET': return actualValue !== undefined && actualValue !== null && actualValue !== '';
    case 'IS_NOT_SET': return actualValue === undefined || actualValue === null || actualValue === '';
    default: return false;
  }
};

export const evaluateFilterGroup = (group: FilterGroup, contactData: Record<string, any>): boolean => {
  if (!group.conditions || group.conditions.length === 0) return true; // Empty filters allow everyone

  const results = group.conditions.map(c => {
    if ('logic' in c) {
      return evaluateFilterGroup(c as FilterGroup, contactData);
    }
    return evaluateCondition(c as FilterCondition, contactData);
  });

  if (group.logic === 'AND') {
    return results.every(r => r === true);
  } else {
    return results.some(r => r === true);
  }
};
