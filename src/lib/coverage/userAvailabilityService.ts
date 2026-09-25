import { v4 as uuidv4 } from 'uuid';

// ─── User Availability Status Model ───
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'VACATION' | 'OUT_OF_OFFICE' | 'DO_NOT_DISTURB';

export interface UserAvailability {
  userId: string;
  tenantId: string;
  status: AvailabilityStatus;
  statusMessage?: string;
  vacationStart?: string;
  vacationEnd?: string;
  autoReplyEnabled?: boolean;
  autoReplyMessage?: string;
  lastUpdated: string;
  updatedBy: string;
}

// ─── In-Memory Store (Replace with Redis/KV in Sprint 4) ───
const availabilityStore = new Map<string, UserAvailability>();

export const userAvailabilityService = {

  /**
   * Get a user's current availability status
   */
  getAvailability(tenantId: string, userId: string): UserAvailability {
    const key = `${tenantId}:${userId}`;
    return availabilityStore.get(key) || {
      userId,
      tenantId,
      status: 'AVAILABLE',
      lastUpdated: new Date().toISOString(),
      updatedBy: 'SYSTEM',
    };
  },

  /**
   * Update a user's availability status
   */
  setAvailability(
    tenantId: string,
    userId: string,
    status: AvailabilityStatus,
    options?: {
      statusMessage?: string;
      vacationStart?: string;
      vacationEnd?: string;
      autoReplyEnabled?: boolean;
      autoReplyMessage?: string;
      updatedBy?: string;
    }
  ): UserAvailability {
    const key = `${tenantId}:${userId}`;
    const record: UserAvailability = {
      userId,
      tenantId,
      status,
      statusMessage: options?.statusMessage,
      vacationStart: options?.vacationStart,
      vacationEnd: options?.vacationEnd,
      autoReplyEnabled: options?.autoReplyEnabled || false,
      autoReplyMessage: options?.autoReplyMessage,
      lastUpdated: new Date().toISOString(),
      updatedBy: options?.updatedBy || userId,
    };
    availabilityStore.set(key, record);
    console.log(`[UserAvailability] ${userId} → ${status} (tenant: ${tenantId})`);
    return record;
  },

  /**
   * Check if a user is available to receive messages/assignments
   */
  isAvailable(tenantId: string, userId: string): boolean {
    const avail = this.getAvailability(tenantId, userId);
    if (avail.status === 'VACATION' || avail.status === 'OUT_OF_OFFICE') {
      // If vacation has an end date and it's passed, auto-return to AVAILABLE
      if (avail.vacationEnd && new Date(avail.vacationEnd).getTime() < Date.now()) {
        this.setAvailability(tenantId, userId, 'AVAILABLE', { updatedBy: 'SYSTEM' });
        return true;
      }
      return false;
    }
    return avail.status === 'AVAILABLE' || avail.status === 'BUSY';
  },

  /**
   * Get all users with a specific status for a tenant
   */
  getUsersByStatus(tenantId: string, status: AvailabilityStatus): UserAvailability[] {
    const results: UserAvailability[] = [];
    availabilityStore.forEach((val) => {
      if (val.tenantId === tenantId && val.status === status) {
        results.push(val);
      }
    });
    return results;
  },

  /**
   * Bulk set availability (e.g., team goes on holiday)
   */
  bulkSetAvailability(tenantId: string, userIds: string[], status: AvailabilityStatus, updatedBy: string): number {
    let count = 0;
    for (const userId of userIds) {
      this.setAvailability(tenantId, userId, status, { updatedBy });
      count++;
    }
    return count;
  }
};
