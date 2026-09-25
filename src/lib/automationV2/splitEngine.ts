// src/lib/automationV2/splitEngine.ts
import * as crypto from 'crypto';

export interface SplitBranch {
  id: string;
  percentage: number;
}

export interface RandomSplitData {
  branches: SplitBranch[];
}

/**
 * Generates a deterministic integer (0-99) for a contact + node combination.
 * Ensures the same contact always goes down the same branch if they re-enter the journey.
 */
const getDeterministicHash = (contactId: string, nodeId: string): number => {
  const hash = crypto.createHash('md5').update(`${contactId}-${nodeId}`).digest('hex');
  // Take last 8 chars, parse as hex, modulo 100
  const num = parseInt(hash.substring(hash.length - 8), 16);
  return num % 100;
};

/**
 * Resolves which A/B testing branch a contact should traverse.
 */
export const resolveRandomSplit = (
  contactId: string, 
  nodeId: string, 
  nodeData: RandomSplitData
): string => {
  // Validate percentages sum to 100, if not fallback
  const total = nodeData.branches.reduce((acc, b) => acc + b.percentage, 0);
  if (total !== 100) return nodeData.branches[0]?.id; // Graceful fallback

  const score = getDeterministicHash(contactId, nodeId); // 0-99

  let cumulative = 0;
  for (const branch of nodeData.branches) {
    cumulative += branch.percentage;
    if (score < cumulative) {
      return branch.id;
    }
  }

  // Fallback
  return nodeData.branches[nodeData.branches.length - 1].id;
};
