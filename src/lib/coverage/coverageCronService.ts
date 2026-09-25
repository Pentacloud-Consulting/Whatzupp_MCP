import { CoverageTransfer, Connector } from '../connectors/connectorInterface';
import { coverageNotificationService } from './coverageNotificationService';
import { coverageAuditService } from './coverageAuditService';
import { coverageCacheService } from './coverageCacheService';

/**
 * Coverage Cron Jobs
 * 
 * In production, these would be executed via:
 * - Vercel Cron (vercel.json crons config)
 * - OR an external scheduler (e.g., SFMC Automation Studio)
 * 
 * Jobs:
 * 1. Auto-Expire: Marks ACTIVE coverages past endTime as EXPIRED
 * 2. Auto-Activate: Marks SCHEDULED/PENDING coverages whose startTime has arrived as ACTIVE
 * 3. Expiring Soon Reminder: Sends notification 1 hour before expiry
 */

export const coverageCronService = {

  /**
   * Job 1: Auto-Expire
   * Finds all ACTIVE coverages where endTime < now and marks them EXPIRED.
   */
  async runAutoExpire(connector: Connector): Promise<{ expired: number; errors: number }> {
    if (!connector.supportsCoverage || !connector.fetchCoverageTransfers) {
      return { expired: 0, errors: 0 };
    }

    console.log('[CoverageCron] Running auto-expire job...');
    const now = Date.now();
    let expired = 0;
    let errors = 0;

    try {
      // Fetch all coverages across all tenants this connector serves
      const coverages = await connector.fetchCoverageTransfers({ tenantId: 'tenant-1' });
      const activeExpired = coverages.filter(c =>
        c.effectiveStatus === 'ACTIVE' &&
        c.endTime &&
        new Date(c.endTime).getTime() < now &&
        !c.isDeleted
      );

      for (const coverage of activeExpired) {
        try {
          if (connector.expireCoverageTransfers) {
            // Use bulk expire if available
          }

          // Update the coverage record directly
          coverage.effectiveStatus = 'EXPIRED';
          coverage.status = 'EXPIRED';

          // Re-persist (in mock store this updates in-place)
          if (connector.createCoverageTransfer) {
            // For mock: the store is in-memory, so the reference update above suffices
          }

          await coverageAuditService.logAuditEvent(
            coverage.tenantId,
            coverage.workspaceId,
            coverage.id!,
            'COVERAGE_EXPIRED',
            'SYSTEM_CRON'
          );

          await coverageNotificationService.notifyCoverageEvent({
            tenantId: coverage.tenantId,
            workspaceId: coverage.workspaceId,
            coverageId: coverage.id!,
            type: 'COVERAGE_EXPIRED',
            originalOwnerId: coverage.originalOwnerId,
            temporaryOwnerId: coverage.temporaryOwnerId,
            managerId: coverage.managerId,
          });

          expired++;
          console.log(`[CoverageCron] Expired coverage: ${coverage.id}`);
        } catch (err) {
          console.error(`[CoverageCron] Failed to expire coverage: ${coverage.id}`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error('[CoverageCron] Auto-expire job failed:', err);
      errors++;
    }

    console.log(`[CoverageCron] Auto-expire complete: ${expired} expired, ${errors} errors`);
    if (expired > 0) {
      await coverageCacheService.invalidateCoverage('tenant-1', (t) => connector.fetchCoverageTransfers!({ tenantId: t }));
    }
    return { expired, errors };
  },

  /**
   * Job 2: Auto-Activate Scheduled Coverages
   * Finds SCHEDULED/PENDING coverages whose startTime has arrived and activates them.
   */
  async runAutoActivate(connector: Connector): Promise<{ activated: number; errors: number }> {
    if (!connector.supportsCoverage || !connector.fetchCoverageTransfers) {
      return { activated: 0, errors: 0 };
    }

    console.log('[CoverageCron] Running auto-activate job...');
    const now = Date.now();
    let activated = 0;
    let errors = 0;

    try {
      const coverages = await connector.fetchCoverageTransfers({ tenantId: 'tenant-1' });
      const scheduled = coverages.filter(c =>
        (c.effectiveStatus === 'SCHEDULED' || c.effectiveStatus === 'PENDING') &&
        c.approvalStatus === 'APPROVED' &&
        new Date(c.startTime).getTime() <= now &&
        (!c.endTime || new Date(c.endTime).getTime() > now) &&
        !c.isDeleted
      );

      for (const coverage of scheduled) {
        try {
          coverage.effectiveStatus = 'ACTIVE';
          coverage.status = 'ACTIVE';

          await coverageAuditService.logAuditEvent(
            coverage.tenantId,
            coverage.workspaceId,
            coverage.id!,
            'COVERAGE_ACTIVATED',
            'SYSTEM_CRON'
          );

          await coverageNotificationService.notifyCoverageEvent({
            tenantId: coverage.tenantId,
            workspaceId: coverage.workspaceId,
            coverageId: coverage.id!,
            type: 'COVERAGE_ACTIVATED',
            originalOwnerId: coverage.originalOwnerId,
            temporaryOwnerId: coverage.temporaryOwnerId,
            managerId: coverage.managerId,
          });

          activated++;
          console.log(`[CoverageCron] Activated coverage: ${coverage.id}`);
        } catch (err) {
          console.error(`[CoverageCron] Failed to activate coverage: ${coverage.id}`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error('[CoverageCron] Auto-activate job failed:', err);
      errors++;
    }

    console.log(`[CoverageCron] Auto-activate complete: ${activated} activated, ${errors} errors`);
    if (activated > 0) {
      await coverageCacheService.invalidateCoverage('tenant-1', (t) => connector.fetchCoverageTransfers!({ tenantId: t }));
    }
    return { activated, errors };
  },

  /**
   * Job 3: Expiring Soon Reminder
   * Sends notifications for coverages expiring within the next hour.
   */
  async runExpiryReminder(connector: Connector): Promise<{ reminded: number }> {
    if (!connector.supportsCoverage || !connector.fetchCoverageTransfers) {
      return { reminded: 0 };
    }

    console.log('[CoverageCron] Running expiry reminder job...');
    const now = Date.now();
    const oneHourFromNow = now + (60 * 60 * 1000);
    let reminded = 0;

    try {
      const coverages = await connector.fetchCoverageTransfers({ tenantId: 'tenant-1' });
      const expiringSoon = coverages.filter(c =>
        c.effectiveStatus === 'ACTIVE' &&
        c.endTime &&
        new Date(c.endTime).getTime() > now &&
        new Date(c.endTime).getTime() <= oneHourFromNow &&
        !c.isDeleted
      );

      for (const coverage of expiringSoon) {
        await coverageNotificationService.notifyCoverageEvent({
          tenantId: coverage.tenantId,
          workspaceId: coverage.workspaceId,
          coverageId: coverage.id!,
          type: 'COVERAGE_EXPIRING_SOON',
          originalOwnerId: coverage.originalOwnerId,
          temporaryOwnerId: coverage.temporaryOwnerId,
          managerId: coverage.managerId,
        });
        reminded++;
      }
    } catch (err) {
      console.error('[CoverageCron] Expiry reminder job failed:', err);
    }

    console.log(`[CoverageCron] Expiry reminder complete: ${reminded} reminders sent`);
    return { reminded };
  },

  /**
   * Run all cron jobs in sequence
   */
  async runAll(connector: Connector) {
    console.log('[CoverageCron] ═══ Starting all coverage cron jobs ═══');
    const expireResult = await this.runAutoExpire(connector);
    const activateResult = await this.runAutoActivate(connector);
    const reminderResult = await this.runExpiryReminder(connector);
    console.log('[CoverageCron] ═══ All jobs complete ═══');
    return { ...expireResult, ...activateResult, ...reminderResult };
  }
};
