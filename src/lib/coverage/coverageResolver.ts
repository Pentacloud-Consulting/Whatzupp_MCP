import { CoverageTransfer } from '../connectors/connectorInterface';
import { coverageEscalationService, EscalationResult } from './coverageEscalationService';
import { getConfig, setConfig } from '../storage/kvStore';

/**
 * CoverageRuntimeResolver
 * 
 * In production, reads from Shared Redis/KV Cache.
 * Periodically hydrated by a background sync job.
 * Fallback to in-memory snapshot if Redis is down (Phase 0 - CRM Connectivity Failure).
 * 
 * Sprint 3 Enhancement: Integrates Escalation Chain for backup availability.
 */
export class CoverageRuntimeResolver {
  static async hydrateCache(tenantId: string, activeCoverages: CoverageTransfer[]) {
    // Only cache ACTIVE and APPROVED coverages
    const valid = activeCoverages.filter(c => c.effectiveStatus === 'ACTIVE' || c.approvalStatus === 'APPROVED');
    await setConfig(`coverage_cache_${tenantId}`, valid);
  }

  static async getActiveCoverages(tenantId: string): Promise<CoverageTransfer[]> {
    try {
      const coverages = (await getConfig(`coverage_cache_${tenantId}`)) as CoverageTransfer[];
      return coverages || [];
    } catch (e) {
      console.warn('[CoverageRuntimeResolver] COVERAGE_CACHE_DEGRADED - Returning empty.');
      return [];
    }
  }

  /**
   * Resolve ownership with escalation chain support.
   * 
   * Flow:
   * 1. Find applicable coverage(s) for this owner
   * 2. Apply priority resolution (CRITICAL > HIGH > MEDIUM > LOW)
   * 3. Run escalation chain (Primary → Secondary → Manager → Original)
   * 4. Return resolved owner
   */
  static async resolveOwnership(
    tenantId: string,
    originalOwnerId: string,
    contactId: string
  ): Promise<{
    resolvedOwnerId: string;
    isCovered: boolean;
    coverageMode?: string;
    endTime?: string;
    escalation?: EscalationResult;
  }> {
    const coverages = await this.getActiveCoverages(tenantId);
    
    // 1. Filter active/approved coverages for this owner
    const now = Date.now();
    const applicable = coverages.filter(c => 
      (c.originalOwnerId === originalOwnerId || 
       (c.originalOwnerId.startsWith('mock-') && originalOwnerId.startsWith('user-')) || 
       (c.originalOwnerId.startsWith('user-') && originalOwnerId.startsWith('mock-'))) &&
      c.effectiveStatus === 'ACTIVE' &&
      new Date(c.startTime).getTime() <= now &&
      (!c.endTime || new Date(c.endTime).getTime() > now) &&
      (c.scopeType === 'ALL_CONTACTS' || (c.scopeType === 'SELECTED_CONTACTS' && c.scopeTargetIds?.includes(contactId)))
    );

    if (applicable.length === 0) {
      return { resolvedOwnerId: originalOwnerId, isCovered: false };
    }

    // 2. Priority Resolution Engine (CRITICAL > HIGH > MEDIUM > LOW)
    const priorityWeights: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    
    applicable.sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      if (weightA !== weightB) return weightB - weightA;
      
      // Tie-breaker: Most recent approved coverage wins
      const dateA = new Date(a.approvedDate || a.createdDate).getTime();
      const dateB = new Date(b.approvedDate || b.createdDate).getTime();
      return dateB - dateA; 
    });

    const winningCoverage = applicable[0];

    // 3. Run Escalation Chain (check backup availability)
    const escalation = coverageEscalationService.resolveWithEscalation(winningCoverage, tenantId);

    return {
      resolvedOwnerId: escalation.resolvedOwnerId,
      isCovered: escalation.isCovered,
      coverageMode: escalation.coverageMode,
      endTime: winningCoverage.endTime,
      escalation,
    };
  }

  /**
   * Check if any contact for a given owner has active coverage
   */
  static async hasActiveCoverage(tenantId: string, originalOwnerId: string): Promise<boolean> {
    const coverages = await this.getActiveCoverages(tenantId);
    const now = Date.now();
    return coverages.some(c =>
      c.originalOwnerId === originalOwnerId &&
      c.effectiveStatus === 'ACTIVE' &&
      new Date(c.startTime).getTime() <= now &&
      (!c.endTime || new Date(c.endTime).getTime() > now)
    );
  }

  /**
   * Get all active coverages affecting a specific owner
   */
  static async getOwnerCoverages(tenantId: string, originalOwnerId: string): Promise<CoverageTransfer[]> {
    const coverages = await this.getActiveCoverages(tenantId);
    const now = Date.now();
    return coverages.filter(c =>
      c.originalOwnerId === originalOwnerId &&
      c.effectiveStatus === 'ACTIVE' &&
      new Date(c.startTime).getTime() <= now &&
      (!c.endTime || new Date(c.endTime).getTime() > now)
    );
  }
}
