// src/lib/automationV2/governance/workflowVersionService.ts
import { AutomationV2, AutomationStatus } from '../schema';
import { logGovernanceAction } from './governanceEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new DRAFT version from an existing PUBLISHED or ARCHIVED journey.
 */
export const cloneWorkflow = async (
  tenantId: string,
  workspaceId: string,
  sourceJourney: AutomationV2,
  userId: string
): Promise<AutomationV2> => {
  const cloned: AutomationV2 = {
    ...sourceJourney,
    id: `journey-${uuidv4()}`,
    name: `${sourceJourney.name} (Clone)`,
    status: 'draft',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId
  };

  await logGovernanceAction({
    tenantId, workspaceId, userId, journeyId: cloned.id, action: 'CREATED', details: `Cloned from ${sourceJourney.id}`
  });

  return cloned;
};

/**
 * Publishes a draft, freezing it as an immutable version.
 */
export const publishWorkflowVersion = async (
  tenantId: string,
  workspaceId: string,
  journey: AutomationV2,
  userId: string
): Promise<AutomationV2> => {
  if (journey.status !== 'approved' && journey.status !== 'draft') {
    throw new Error('Only Draft or Approved journeys can be published.');
  }

  const published: AutomationV2 = {
    ...journey,
    status: 'published',
    version: journey.version + 1,
    updatedAt: new Date().toISOString()
  };

  // Archive previous active version if exists
  await logGovernanceAction({
    tenantId, workspaceId, userId, journeyId: journey.id, action: 'PUBLISHED', details: `Version ${published.version}`
  });

  return published;
};

/**
 * Restores a previously archived version as a new Draft.
 */
export const rollbackWorkflow = async (
  tenantId: string,
  workspaceId: string,
  journeyId: string,
  targetVersion: number,
  userId: string
): Promise<AutomationV2> => {
  // Mock fetch old version
  const oldVersion = {} as AutomationV2; 

  const restored = await cloneWorkflow(tenantId, workspaceId, oldVersion, userId);
  
  await logGovernanceAction({
    tenantId, workspaceId, userId, journeyId, action: 'RESTORED', details: `Rolled back to v${targetVersion}`
  });

  return restored;
};
