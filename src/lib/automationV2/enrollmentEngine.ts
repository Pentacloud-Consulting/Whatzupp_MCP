// src/lib/automationV2/enrollmentEngine.ts

export enum EnrollmentMode {
  ONCE = 'ONCE',
  MULTIPLE = 'MULTIPLE',
  REENTER_AFTER_DAYS = 'REENTER_AFTER_DAYS',
  REENTER_ON_CONDITION_CHANGE = 'REENTER_ON_CONDITION_CHANGE'
}

export interface EnrollmentRule {
  mode: EnrollmentMode;
  reEnterDays?: number;
}

export interface PastEnrollment {
  journeyId: string;
  contactId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXITED' | 'FAILED';
  enrolledAt: string;
  completedAt?: string;
}

/**
 * Validates if a contact is legally allowed to enroll in a journey based on its configured rules.
 */
export const canEnrollContact = (
  contactId: string, 
  rule: EnrollmentRule, 
  pastEnrollments: PastEnrollment[]
): boolean => {
  const previous = pastEnrollments.filter(e => e.contactId === contactId);

  // If never enrolled, always allow
  if (previous.length === 0) return true;

  // If they are currently active in this journey, usually we block re-entry to prevent parallel ghosting
  const isActive = previous.some(e => e.status === 'ACTIVE');
  if (isActive) return false;

  switch (rule.mode) {
    case EnrollmentMode.ONCE:
      return false; // Already enrolled at least once
      
    case EnrollmentMode.MULTIPLE:
      return true; // Finished, can run again immediately
      
    case EnrollmentMode.REENTER_AFTER_DAYS:
      if (!rule.reEnterDays) return false;
      // Get the most recent completion date
      const completedDates = previous.map(e => e.completedAt ? new Date(e.completedAt).getTime() : 0);
      const lastCompletion = Math.max(...completedDates);
      
      if (lastCompletion === 0) return false; // Incomplete, shouldn't re-enter yet

      const daysSince = (Date.now() - lastCompletion) / (1000 * 60 * 60 * 24);
      return daysSince >= rule.reEnterDays;

    case EnrollmentMode.REENTER_ON_CONDITION_CHANGE:
      // This is evaluated outside this basic function (e.g., webhook sees a field change)
      // For standard sync entry, we block.
      return false;
      
    default:
      return false;
  }
};
