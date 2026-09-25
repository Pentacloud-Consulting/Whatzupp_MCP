import { AutomationV2, AutomationNode, AutomationEdge } from './schema';

export interface ValidationIssue {
  nodeId?: string;
  type: 'error' | 'warning';
  message: string;
}

export function validateJourney(journey: AutomationV2): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Must have at least one trigger
  const triggers = journey.nodes.filter(n => n.type.startsWith('TRIGGER_'));
  if (triggers.length === 0) {
    issues.push({ type: 'error', message: 'Journey must have at least one Trigger node.' });
  }

  // 2. All paths must eventually reach an END, GOAL, or EXIT node
  // This is a complex graph traversal, simplified here for Sprint 2
  const ends = journey.nodes.filter(n => n.type === 'FLOW_GOAL' || n.type === 'FLOW_EXIT' || journey.edges.filter(e => e.source === n.id).length === 0);
  if (ends.length === 0) {
    issues.push({ type: 'error', message: 'Journey has no end state.' });
  }

  // 3. Check for unconnected nodes (islands)
  const connectedNodeIds = new Set<string>();
  journey.edges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  journey.nodes.forEach(node => {
    if (!node.type.startsWith('TRIGGER_') && !connectedNodeIds.has(node.id)) {
      issues.push({ nodeId: node.id, type: 'warning', message: 'Node is disconnected from the flow.' });
    }

    // 4. Node specific validations
    if (node.type === 'ACTION_SEND_TEMPLATE' && (!node.data?.templateId)) {
      issues.push({ nodeId: node.id, type: 'error', message: 'Send Template node requires a template selection.' });
    }

    if (node.type === 'LOGIC_WAIT_UNTIL' && !node.data?.waitType) {
      issues.push({ nodeId: node.id, type: 'error', message: 'Wait node requires a duration or condition.' });
    }
  });

  // 5. Detect Circular Loops
  // Simple DFS cycle detection
  const adjacencyList: Record<string, string[]> = {};
  journey.nodes.forEach(n => adjacencyList[n.id] = []);
  journey.edges.forEach(e => adjacencyList[e.source]?.push(e.target));

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const detectCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const children = adjacencyList[nodeId] || [];
    for (const child of children) {
      if (detectCycle(child)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of journey.nodes) {
    if (detectCycle(node.id)) {
      issues.push({ type: 'error', message: 'Circular loop detected. Infinite loops are not allowed.' });
      break; 
    }
  }

  return issues;
}
