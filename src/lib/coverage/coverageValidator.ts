import { CoverageTransfer } from '../connectors/connectorInterface';

export class CoverageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoverageValidationError';
  }
}

export const coverageValidator = {
  validateCreateCoverage(coverage: Partial<CoverageTransfer>) {
    if (!coverage.tenantId) throw new CoverageValidationError('Tenant ID is required.');
    if (!coverage.workspaceId) throw new CoverageValidationError('Workspace ID is required.');
    if (!coverage.originalOwnerId) throw new CoverageValidationError('Original Owner ID is required.');
    if (!coverage.temporaryOwnerId) throw new CoverageValidationError('Temporary Owner ID is required.');
    if (!coverage.startTime) throw new CoverageValidationError('Start Time is required.');
    
    // Date Range Validation
    const start = new Date(coverage.startTime);
    if (isNaN(start.getTime())) throw new CoverageValidationError('Invalid Start Time format.');
    if (coverage.endTime) {
      const end = new Date(coverage.endTime);
      if (isNaN(end.getTime())) throw new CoverageValidationError('Invalid End Time format.');
      if (end <= start) throw new CoverageValidationError('End Time must be after Start Time.');
    }

    if (!coverage.scopeType) throw new CoverageValidationError('Scope Type is required.');
  },

  validateApproveCoverage(coverage: CoverageTransfer, version: number) {
    if (!coverage) throw new CoverageValidationError('Coverage not found.');
    if (coverage.approvalStatus !== 'PENDING') throw new CoverageValidationError('Coverage is not pending approval.');
    if (coverage.coverageVersion !== version) throw new CoverageValidationError('Version mismatch. Coverage has been modified.');
  },

  validateExtendCoverage(coverage: CoverageTransfer, newEndTime: string, version: number) {
    if (!coverage) throw new CoverageValidationError('Coverage not found.');
    if (coverage.status !== 'ACTIVE') throw new CoverageValidationError('Can only extend ACTIVE coverage.');
    if (coverage.coverageVersion !== version) throw new CoverageValidationError('Version mismatch. Coverage has been modified.');
    
    const currentEnd = coverage.endTime ? new Date(coverage.endTime) : null;
    const nextEnd = new Date(newEndTime);
    
    if (isNaN(nextEnd.getTime())) throw new CoverageValidationError('Invalid New End Time format.');
    if (currentEnd && nextEnd <= currentEnd) throw new CoverageValidationError('New End Time must be later than the current End Time.');
  },
  
  validateOverlap(existingCoverages: CoverageTransfer[], newCoverage: Partial<CoverageTransfer>) {
    // Basic overlap check
    const start = new Date(newCoverage.startTime!).getTime();
    const end = newCoverage.endTime ? new Date(newCoverage.endTime).getTime() : Infinity;

    for (const active of existingCoverages) {
      if (active.status !== 'ACTIVE' && active.effectiveStatus !== 'SCHEDULED') continue;
      if (active.originalOwnerId !== newCoverage.originalOwnerId) continue;
      
      const aStart = new Date(active.startTime).getTime();
      const aEnd = active.endTime ? new Date(active.endTime).getTime() : Infinity;

      // Check if times overlap
      if (start < aEnd && end > aStart) {
        throw new CoverageValidationError('Overlapping coverage detected for this owner.');
      }
    }
  }
};
