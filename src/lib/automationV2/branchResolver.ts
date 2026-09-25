import { evaluateFilterGroup, FilterGroup } from './filterEvaluator';

export interface IfElseData {
  conditions: FilterGroup;
}

export interface SwitchBranch {
  id: string;
  value: string;
}

export interface SwitchData {
  field: string;
  branches: SwitchBranch[];
}

/**
 * Resolves which edge a contact should traverse out of an If/Else node.
 */
export const resolveIfElse = (
  contactData: Record<string, any>, 
  nodeData: IfElseData
): 'true' | 'false' => {
  const result = evaluateFilterGroup(nodeData.conditions, contactData);
  return result ? 'true' : 'false';
};

/**
 * Resolves which edge a contact should traverse out of a Switch node.
 */
export const resolveSwitch = (
  contactData: Record<string, any>, 
  nodeData: SwitchData
): string => {
  const actualValue = contactData[nodeData.field];
  
  if (actualValue === undefined || actualValue === null) {
    return 'default';
  }

  const match = nodeData.branches.find(b => 
    String(b.value).toLowerCase() === String(actualValue).toLowerCase()
  );

  return match ? match.id : 'default';
};
