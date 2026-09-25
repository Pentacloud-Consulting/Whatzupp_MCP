// src/lib/automationV2/governance/automationPermissionService.ts
import { UserRole } from './approvalService';

export type AutomationAction = 
  | 'VIEW' 
  | 'CREATE' 
  | 'EDIT' 
  | 'APPROVE' 
  | 'PUBLISH' 
  | 'DELETE' 
  | 'CLONE' 
  | 'ROLLBACK';

/**
 * Validates if a user role has permission to perform an action on automations.
 */
export const hasPermission = (role: UserRole, action: AutomationAction): boolean => {
  switch (role) {
    case 'SUPER_ADMIN':
      return true; // Omnipotent

    case 'ADMIN':
      return true; // Can do everything in their tenant

    case 'MANAGER':
      // Can't publish directly (must approve first), but can do everything else
      if (action === 'PUBLISH') return false;
      return true;

    case 'AGENT':
      // Agents can view and create/edit drafts, but cannot approve, publish, delete, or rollback
      if (['APPROVE', 'PUBLISH', 'DELETE', 'ROLLBACK'].includes(action)) {
        return false;
      }
      return true;

    default:
      return false;
  }
};

/**
 * Enterprise Guard: Throws an error if permission is denied.
 */
export const enforcePermission = (
  tenantId: string, 
  workspaceId: string, 
  role: UserRole, 
  action: AutomationAction
): void => {
  if (!tenantId || !workspaceId) {
    throw new Error('Fatal Security Exception: Missing Tenant or Workspace Isolation Context.');
  }

  if (!hasPermission(role, action)) {
    throw new Error(`Permission Denied: Role ${role} cannot perform ${action} on automations.`);
  }
};
