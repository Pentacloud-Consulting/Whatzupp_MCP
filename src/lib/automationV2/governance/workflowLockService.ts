// src/lib/automationV2/governance/workflowLockService.ts

export interface WorkflowLock {
  journeyId: string;
  lockedByUserId: string;
  lockedAt: number; // Unix timestamp
}

// In-memory mock for Sprint 6 (Production uses Redis with TTL)
const lockStore = new Map<string, WorkflowLock>();
const LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Attempts to acquire an exclusive edit lock for a journey.
 */
export const acquireLock = (journeyId: string, userId: string): { success: boolean; error?: string } => {
  const existingLock = lockStore.get(journeyId);
  const now = Date.now();

  if (existingLock) {
    if (existingLock.lockedByUserId === userId) {
      // Renew lock
      existingLock.lockedAt = now;
      return { success: true };
    }

    if (now - existingLock.lockedAt < LOCK_TIMEOUT_MS) {
      return { success: false, error: `Journey is currently being edited by another user.` };
    }
  }

  lockStore.set(journeyId, { journeyId, lockedByUserId: userId, lockedAt: now });
  return { success: true };
};

/**
 * Releases an existing lock.
 */
export const releaseLock = (journeyId: string, userId: string): void => {
  const existingLock = lockStore.get(journeyId);
  if (existingLock && existingLock.lockedByUserId === userId) {
    lockStore.delete(journeyId);
  }
};

/**
 * Admins can forcibly break a lock.
 */
export const forceUnlock = (journeyId: string, adminId: string): void => {
  lockStore.delete(journeyId);
  console.log(`[LockService] Admin ${adminId} forcefully unlocked journey ${journeyId}`);
};
