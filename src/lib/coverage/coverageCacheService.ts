import { CoverageTransfer } from '../connectors/connectorInterface';
import { CoverageRuntimeResolver } from './coverageResolver';

export const coverageCacheService = {
  /**
   * Refreshes the coverage cache for a specific tenant by pulling the latest active coverages.
   * In a real implementation, this reads from Redis.
   */
  async refreshCoverage(tenantId: string, coverages: CoverageTransfer[]) {
    console.log(`[CoverageCacheService] Refreshing cache for tenant: ${tenantId}`);
    await CoverageRuntimeResolver.hydrateCache(tenantId, coverages);
  },

  /**
   * Invalidates a specific coverage or forces a full tenant reload.
   */
  async invalidateCoverage(tenantId: string, fetchFn?: (tenantId: string) => Promise<CoverageTransfer[]>, coverageId?: string) {
    console.log(`[CoverageCacheService] Invalidating cache for tenant: ${tenantId}, coverageId: ${coverageId || 'ALL'}`);
    if (fetchFn) {
      try {
        const coverages = await fetchFn(tenantId);
        await this.refreshCoverage(tenantId, coverages);
      } catch (e) {
        console.error(`[CoverageCacheService] Failed to fetch coverages for tenant: ${tenantId}`, e);
      }
    }
  },

  /**
   * Warms the cache by preloading active coverages for given tenants.
   */
  async warmCoverage(tenantIds: string[], fetchFn: (tenantId: string) => Promise<CoverageTransfer[]>) {
    console.log(`[CoverageCacheService] Warming cache for ${tenantIds.length} tenants...`);
    for (const tenantId of tenantIds) {
      try {
        const coverages = await fetchFn(tenantId);
        await this.refreshCoverage(tenantId, coverages);
      } catch (e) {
        console.error(`[CoverageCacheService] Failed to warm cache for tenant: ${tenantId}`, e);
      }
    }
  }
};
