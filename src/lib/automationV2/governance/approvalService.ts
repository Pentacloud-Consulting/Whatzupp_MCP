// src/lib/automationV2/governance/approvalService.ts
import { AutomationV2 } from '../schema';
import { logGovernanceAction } from './governanceEngine';

export type UserRole = 'AGENT' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';

export const submitForApproval = async (
  tenantId: string,
  workspaceId: string,
  journey: AutomationV2,
  userId: string,
  userRole: UserRole
): Promise<void> => {
  if (journey.status !== 'draft') {
    throw new Error('Only Drafts can be submitted for approval.');
  }
  
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    // Auto-approve
    journey.status = 'approved';
    await logGovernanceAction({ tenantId, workspaceId, userId, journeyId: journey.id, action: 'APPROVED', details: 'Auto-approved by Admin' });
  } else {
    journey.status = 'pending_approval';
    await logGovernanceAction({ tenantId, workspaceId, userId, journeyId: journey.id, action: 'SUBMITTED', details: 'Pending Manager Review' });
  }
};

export const approveWorkflow = async (
  tenantId: string,
  workspaceId: string,
  journey: AutomationV2,
  managerId: string,
  managerRole: UserRole
): Promise<void> => {
  if (managerRole === 'AGENT') throw new Error('Agents cannot approve workflows.');
  if (journey.status !== 'pending_approval') throw new Error('Journey is not pending approval.');

  journey.status = 'approved';
  await logGovernanceAction({ tenantId, workspaceId, userId: managerId, journeyId: journey.id, action: 'APPROVED', details: '' });
};

export const rejectWorkflow = async (
  tenantId: string,
  workspaceId: string,
  journey: AutomationV2,
  managerId: string,
  reason: string
): Promise<void> => {
  journey.status = 'draft';
  await logGovernanceAction({ tenantId, workspaceId, userId: managerId, journeyId: journey.id, action: 'REJECTED', details: reason });
};
