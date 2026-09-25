import { CoverageTransfer } from '../connectors/connectorInterface';
import { CoverageValidationError } from './coverageValidator';

export type CoverageStatus = CoverageTransfer['effectiveStatus'];

export const coverageStateMachine = {
  assertTransition(currentStatus: CoverageStatus, targetStatus: CoverageStatus) {
    const validTransitions: Record<CoverageStatus, CoverageStatus[]> = {
      'PENDING': ['ACTIVE', 'REVOKED'], // PENDING -> APPROVED implies ACTIVE if start time matches
      'SCHEDULED': ['ACTIVE', 'REVOKED'],
      'ACTIVE': ['EXPIRED', 'REVOKED', 'ACTIVE'], // ACTIVE -> ACTIVE implies EXTENDED
      'EXPIRED': [],
      'REVOKED': []
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new CoverageValidationError(`Invalid coverage state transition from ${currentStatus} to ${targetStatus}`);
    }
  }
};
