import { CoverageTransfer } from '../connectors/connectorInterface';

// ─── Coverage Analytics Model ───
export interface CoverageMetrics {
  tenantId: string;
  workspaceId: string;
  totalCreated: number;
  totalActive: number;
  totalExpired: number;
  totalRevoked: number;
  totalExtensions: number;
  averageDurationHours: number;
  mostCoveredAgentId: string | null;
  mostCoveredAgentCount: number;
  mostActiveBackupId: string | null;
  mostActiveBackupCount: number;
  coverageSuccessRate: number; // % of coverages that completed without degradation
  escalationCount: number;
  emergencyCoverageCount: number;
  plannedCoverageCount: number;
  generatedAt: string;
}

export const coverageAnalyticsService = {

  /**
   * Calculate comprehensive metrics from coverage transfers
   */
  calculateMetrics(tenantId: string, workspaceId: string, coverages: CoverageTransfer[]): CoverageMetrics {
    const wsCoverages = coverages.filter(c =>
      c.tenantId === tenantId &&
      (!workspaceId || c.workspaceId === workspaceId) &&
      !c.isDeleted
    );

    const totalCreated = wsCoverages.length;
    const totalActive = wsCoverages.filter(c => c.effectiveStatus === 'ACTIVE').length;
    const totalExpired = wsCoverages.filter(c => c.effectiveStatus === 'EXPIRED').length;
    const totalRevoked = wsCoverages.filter(c => c.effectiveStatus === 'REVOKED').length;
    const totalExtensions = wsCoverages.filter(c => c.extendedBy).length;

    // Average Duration
    let totalDurationMs = 0;
    let durationCount = 0;
    wsCoverages.forEach(c => {
      if (c.startTime && c.endTime) {
        const start = new Date(c.startTime).getTime();
        const end = new Date(c.endTime).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalDurationMs += (end - start);
          durationCount++;
        }
      }
    });
    const averageDurationHours = durationCount > 0
      ? Math.round((totalDurationMs / durationCount / (1000 * 60 * 60)) * 10) / 10
      : 0;

    // Most Covered Agent (originalOwnerId frequency)
    const ownerCounts = new Map<string, number>();
    wsCoverages.forEach(c => {
      ownerCounts.set(c.originalOwnerId, (ownerCounts.get(c.originalOwnerId) || 0) + 1);
    });
    let mostCoveredAgentId: string | null = null;
    let mostCoveredAgentCount = 0;
    ownerCounts.forEach((count, id) => {
      if (count > mostCoveredAgentCount) {
        mostCoveredAgentId = id;
        mostCoveredAgentCount = count;
      }
    });

    // Most Active Backup (temporaryOwnerId frequency)
    const backupCounts = new Map<string, number>();
    wsCoverages.forEach(c => {
      backupCounts.set(c.temporaryOwnerId, (backupCounts.get(c.temporaryOwnerId) || 0) + 1);
    });
    let mostActiveBackupId: string | null = null;
    let mostActiveBackupCount = 0;
    backupCounts.forEach((count, id) => {
      if (count > mostActiveBackupCount) {
        mostActiveBackupId = id;
        mostActiveBackupCount = count;
      }
    });

    // Coverage Success Rate (completed without revocation)
    const completedCoverages = wsCoverages.filter(c => c.effectiveStatus === 'EXPIRED' || c.effectiveStatus === 'REVOKED');
    const successfulCoverages = completedCoverages.filter(c => c.effectiveStatus === 'EXPIRED'); // Expired naturally = success
    const coverageSuccessRate = completedCoverages.length > 0
      ? Math.round((successfulCoverages.length / completedCoverages.length) * 100)
      : 100;

    const emergencyCoverageCount = wsCoverages.filter(c => c.coverageType === 'EMERGENCY').length;
    const plannedCoverageCount = wsCoverages.filter(c => c.coverageType === 'PLANNED').length;

    return {
      tenantId,
      workspaceId,
      totalCreated,
      totalActive,
      totalExpired,
      totalRevoked,
      totalExtensions,
      averageDurationHours,
      mostCoveredAgentId,
      mostCoveredAgentCount,
      mostActiveBackupId,
      mostActiveBackupCount,
      coverageSuccessRate,
      escalationCount: 0, // Populated from escalation events
      emergencyCoverageCount,
      plannedCoverageCount,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Get coverage utilization by hour of day (for heatmap)
   */
  getCoverageHeatmap(coverages: CoverageTransfer[]): Record<number, number> {
    const heatmap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) heatmap[h] = 0;

    coverages.forEach(c => {
      if (c.startTime) {
        const hour = new Date(c.startTime).getHours();
        heatmap[hour] = (heatmap[hour] || 0) + 1;
      }
    });

    return heatmap;
  },

  /**
   * Get top agents by coverage count
   */
  getTopAgents(coverages: CoverageTransfer[], limit = 5): Array<{ userId: string; role: 'owner' | 'backup'; count: number }> {
    const agentMap = new Map<string, { owner: number; backup: number }>();

    coverages.forEach(c => {
      const ownerEntry = agentMap.get(c.originalOwnerId) || { owner: 0, backup: 0 };
      ownerEntry.owner++;
      agentMap.set(c.originalOwnerId, ownerEntry);

      const backupEntry = agentMap.get(c.temporaryOwnerId) || { owner: 0, backup: 0 };
      backupEntry.backup++;
      agentMap.set(c.temporaryOwnerId, backupEntry);
    });

    const results: Array<{ userId: string; role: 'owner' | 'backup'; count: number }> = [];
    agentMap.forEach((counts, userId) => {
      if (counts.owner > 0) results.push({ userId, role: 'owner', count: counts.owner });
      if (counts.backup > 0) results.push({ userId, role: 'backup', count: counts.backup });
    });

    return results.sort((a, b) => b.count - a.count).slice(0, limit);
  }
};
