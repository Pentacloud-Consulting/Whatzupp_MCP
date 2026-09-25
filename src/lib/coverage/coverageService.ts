import { CoverageTransfer, Connector } from '../connectors/connectorInterface';
import { coverageValidator } from './coverageValidator';
import { coverageAuditService } from './coverageAuditService';
import { coverageCacheService } from './coverageCacheService';

export class CoverageService {
  constructor(private connector: Connector) {}

  private assertSupportsCoverage() {
    if (!this.connector.supportsCoverage) {
      throw new Error('FeatureNotSupportedError: This connector does not support Enterprise Coverage Management.');
    }
  }

  private async triggerCacheRefresh(tenantId: string) {
    if (this.connector.fetchCoverageTransfers) {
      await coverageCacheService.invalidateCoverage(
        tenantId,
        (t) => this.connector.fetchCoverageTransfers!({ tenantId: t })
      );
    }
  }

  async createCoverage(coverageData: Partial<CoverageTransfer>, whoId: string): Promise<CoverageTransfer | null> {
    this.assertSupportsCoverage();
    coverageValidator.validateCreateCoverage(coverageData);
    
    // In a real implementation, we would fetch existing coverages from the DB to check overlaps
    // const existingCoverages = await this.connector.fetchCoverageTransfers!({ tenantId: coverageData.tenantId! });
    // coverageValidator.validateOverlap(existingCoverages, coverageData);

    const isApprovalRequired = false; // Could be fetched from Tenant Config

    const newCoverage: CoverageTransfer = {
      ...coverageData,
      id: coverageData.id || `cov-${Date.now()}`,
      status: 'ACTIVE',
      effectiveStatus: isApprovalRequired ? 'PENDING' : 'ACTIVE',
      approvalStatus: isApprovalRequired ? 'PENDING' : 'APPROVED',
      coverageVersion: 1,
      isDeleted: false,
      createdBy: whoId,
      createdDate: new Date().toISOString(),
    } as CoverageTransfer;

    if (this.connector.createCoverageTransfer) {
      await this.connector.createCoverageTransfer(newCoverage);
      await coverageAuditService.logAuditEvent(
        newCoverage.tenantId,
        newCoverage.workspaceId,
        newCoverage.id!,
        'COVERAGE_CREATED',
        whoId
      );
      if (!isApprovalRequired) {
        await coverageAuditService.logAuditEvent(
          newCoverage.tenantId,
          newCoverage.workspaceId,
          newCoverage.id!,
          'COVERAGE_ACTIVATED',
          whoId
        );
      }
      await this.triggerCacheRefresh(newCoverage.tenantId);
      return newCoverage;
    } else {
      throw new Error('FeatureNotSupportedError: Connector does not support coverage transfers.');
    }
  }

  async approveCoverage(coverageId: string, version: number, whoId: string): Promise<boolean> {
    this.assertSupportsCoverage();
    // Fetch the real coverage to validate (Mocking fetch for now)
    // const coverage = await fetchFromDb(coverageId);
    // coverageValidator.validateApproveCoverage(coverage, version);
    
    const success = await this.connector.approveCoverageTransfer!(coverageId, whoId);
    if (success) {
      // Assuming single tenant environment for simplicity in this mock
      await this.triggerCacheRefresh('tenant-1');
    }
    return success;
  }

  async revokeCoverage(coverageId: string, whoId: string): Promise<boolean> {
     this.assertSupportsCoverage();
     const success = await this.connector.revokeCoverageTransfer!(coverageId, whoId);
     if (success) {
       await this.triggerCacheRefresh('tenant-1');
     }
     return success;
  }

  async extendCoverage(coverageId: string, version: number, newEndTime: string, reason: string, whoId: string): Promise<boolean> {
     this.assertSupportsCoverage();
     // const coverage = await fetchFromDb(coverageId);
     // coverageValidator.validateExtendCoverage(coverage, newEndTime, version);
     
     const success = await this.connector.extendCoverageTransfer!(coverageId, newEndTime, whoId, reason);
     if (success) {
       await this.triggerCacheRefresh('tenant-1');
     }
     return success;
  }
}
