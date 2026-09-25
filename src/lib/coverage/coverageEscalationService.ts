import { CoverageTransfer } from '../connectors/connectorInterface';
import { userAvailabilityService } from './userAvailabilityService';

/**
 * Coverage Escalation Chain
 * 
 * Routing Priority:
 *   1. Primary Backup (temporaryOwnerId)
 *   2. Secondary Backup (secondaryBackupId) — if primary is unavailable
 *   3. Manager Fallback (managerId) — if both backups are unavailable
 *   4. Original Owner — ultimate fallback (coverage degraded)
 * 
 * Availability check is done via userAvailabilityService.
 */

export type EscalationResult = {
  resolvedOwnerId: string;
  escalationLevel: 'PRIMARY' | 'SECONDARY' | 'MANAGER' | 'ORIGINAL_FALLBACK';
  isCovered: boolean;
  coverageMode?: string;
  escalationPath: string[];
  reason: string;
};

export const coverageEscalationService = {

  /**
   * Resolve the effective owner using the escalation chain.
   * Checks availability at each level before falling through.
   */
  resolveWithEscalation(
    coverage: CoverageTransfer,
    tenantId: string
  ): EscalationResult {
    const escalationPath: string[] = [];

    // ─── Level 1: Primary Backup ───
    const primaryId = coverage.temporaryOwnerId;
    escalationPath.push(primaryId);

    if (userAvailabilityService.isAvailable(tenantId, primaryId)) {
      return {
        resolvedOwnerId: primaryId,
        escalationLevel: 'PRIMARY',
        isCovered: true,
        coverageMode: coverage.coverageMode,
        escalationPath,
        reason: `Primary backup ${primaryId} is available.`,
      };
    }

    console.warn(`[Escalation] Primary backup ${primaryId} UNAVAILABLE. Escalating...`);

    // ─── Level 2: Secondary Backup ───
    const secondaryId = coverage.secondaryBackupId;
    if (secondaryId) {
      escalationPath.push(secondaryId);
      if (userAvailabilityService.isAvailable(tenantId, secondaryId)) {
        return {
          resolvedOwnerId: secondaryId,
          escalationLevel: 'SECONDARY',
          isCovered: true,
          coverageMode: coverage.coverageMode,
          escalationPath,
          reason: `Primary backup ${primaryId} unavailable. Secondary backup ${secondaryId} is available.`,
        };
      }
      console.warn(`[Escalation] Secondary backup ${secondaryId} UNAVAILABLE. Escalating to manager...`);
    }

    // ─── Level 3: Manager Fallback ───
    const managerId = coverage.managerId;
    if (managerId) {
      escalationPath.push(managerId);
      if (userAvailabilityService.isAvailable(tenantId, managerId)) {
        return {
          resolvedOwnerId: managerId,
          escalationLevel: 'MANAGER',
          isCovered: true,
          coverageMode: 'FULL_TRANSFER', // Manager always gets full access
          escalationPath,
          reason: `All backups unavailable. Manager ${managerId} is handling.`,
        };
      }
      console.warn(`[Escalation] Manager ${managerId} also UNAVAILABLE. Falling back to original owner.`);
    }

    // ─── Level 4: Original Owner Fallback (Coverage Degraded) ───
    escalationPath.push(coverage.originalOwnerId);
    return {
      resolvedOwnerId: coverage.originalOwnerId,
      escalationLevel: 'ORIGINAL_FALLBACK',
      isCovered: false,
      escalationPath,
      reason: `All escalation targets unavailable. Returning to original owner ${coverage.originalOwnerId}. Coverage is DEGRADED.`,
    };
  },

  /**
   * Check if any escalation target is available for a coverage
   */
  hasAvailableBackup(coverage: CoverageTransfer, tenantId: string): boolean {
    const targets = [
      coverage.temporaryOwnerId,
      coverage.secondaryBackupId,
      coverage.managerId,
    ].filter(Boolean) as string[];

    return targets.some(id => userAvailabilityService.isAvailable(tenantId, id));
  },

  /**
   * Get the full escalation chain for display purposes
   */
  getEscalationChain(coverage: CoverageTransfer, tenantId: string): Array<{
    userId: string;
    role: string;
    available: boolean;
    status: string;
  }> {
    const chain: Array<{ userId: string; role: string; available: boolean; status: string }> = [];

    chain.push({
      userId: coverage.temporaryOwnerId,
      role: 'Primary Backup',
      available: userAvailabilityService.isAvailable(tenantId, coverage.temporaryOwnerId),
      status: userAvailabilityService.getAvailability(tenantId, coverage.temporaryOwnerId).status,
    });

    if (coverage.secondaryBackupId) {
      chain.push({
        userId: coverage.secondaryBackupId,
        role: 'Secondary Backup',
        available: userAvailabilityService.isAvailable(tenantId, coverage.secondaryBackupId),
        status: userAvailabilityService.getAvailability(tenantId, coverage.secondaryBackupId).status,
      });
    }

    if (coverage.managerId) {
      chain.push({
        userId: coverage.managerId,
        role: 'Manager Fallback',
        available: userAvailabilityService.isAvailable(tenantId, coverage.managerId),
        status: userAvailabilityService.getAvailability(tenantId, coverage.managerId).status,
      });
    }

    return chain;
  }
};
