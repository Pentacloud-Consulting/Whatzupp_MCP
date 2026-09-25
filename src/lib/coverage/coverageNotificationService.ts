import { v4 as uuidv4 } from 'uuid';

// ─── Notification Types ───
export type CoverageNotificationType =
  | 'COVERAGE_CREATED'
  | 'COVERAGE_APPROVED'
  | 'COVERAGE_ACTIVATED'
  | 'COVERAGE_EXPIRING_SOON'  // 1 hour before
  | 'COVERAGE_EXPIRED'
  | 'COVERAGE_REVOKED'
  | 'COVERAGE_EXTENDED'
  | 'ESCALATION_TRIGGERED'
  | 'COVERAGE_DEGRADED';

export interface CoverageNotification {
  id: string;
  tenantId: string;
  workspaceId: string;
  coverageId: string;
  type: CoverageNotificationType;
  recipientUserId: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

// ─── In-Memory Notification Store (Replace with DB/Redis in Sprint 4) ───
const notificationStore: CoverageNotification[] = [];

export const coverageNotificationService = {

  /**
   * Send a notification to a specific user
   */
  async notify(params: {
    tenantId: string;
    workspaceId: string;
    coverageId: string;
    type: CoverageNotificationType;
    recipientUserId: string;
    title: string;
    message: string;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    metadata?: Record<string, any>;
  }): Promise<CoverageNotification> {
    const notification: CoverageNotification = {
      id: uuidv4(),
      tenantId: params.tenantId,
      workspaceId: params.workspaceId,
      coverageId: params.coverageId,
      type: params.type,
      recipientUserId: params.recipientUserId,
      title: params.title,
      message: params.message,
      severity: params.severity || 'INFO',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: params.metadata,
    };

    notificationStore.push(notification);
    console.log(`[CoverageNotification] [${params.type}] → ${params.recipientUserId}: ${params.title}`);

    return notification;
  },

  /**
   * Notify all relevant parties about a coverage event
   */
  async notifyCoverageEvent(params: {
    tenantId: string;
    workspaceId: string;
    coverageId: string;
    type: CoverageNotificationType;
    originalOwnerId: string;
    temporaryOwnerId: string;
    managerId?: string;
    coverageLabel?: string;
  }) {
    const { tenantId, workspaceId, coverageId, type, originalOwnerId, temporaryOwnerId, managerId, coverageLabel } = params;
    const label = coverageLabel || coverageId;

    const templates: Record<CoverageNotificationType, { title: string; message: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; targets: string[] }> = {
      COVERAGE_CREATED: {
        title: 'New Coverage Transfer',
        message: `Coverage "${label}" has been created. ${originalOwnerId} → ${temporaryOwnerId}.`,
        severity: 'INFO',
        targets: [originalOwnerId, temporaryOwnerId, ...(managerId ? [managerId] : [])],
      },
      COVERAGE_APPROVED: {
        title: 'Coverage Approved',
        message: `Coverage "${label}" has been approved and is now active.`,
        severity: 'INFO',
        targets: [originalOwnerId, temporaryOwnerId],
      },
      COVERAGE_ACTIVATED: {
        title: 'Coverage Activated',
        message: `Coverage "${label}" is now active. ${temporaryOwnerId} is handling ${originalOwnerId}'s workload.`,
        severity: 'INFO',
        targets: [originalOwnerId, temporaryOwnerId],
      },
      COVERAGE_EXPIRING_SOON: {
        title: '⚠️ Coverage Expiring Soon',
        message: `Coverage "${label}" expires within 1 hour. Extend or prepare for handback.`,
        severity: 'WARNING',
        targets: [originalOwnerId, temporaryOwnerId, ...(managerId ? [managerId] : [])],
      },
      COVERAGE_EXPIRED: {
        title: 'Coverage Expired',
        message: `Coverage "${label}" has expired. ${originalOwnerId} is now the active owner.`,
        severity: 'INFO',
        targets: [originalOwnerId, temporaryOwnerId],
      },
      COVERAGE_REVOKED: {
        title: 'Coverage Revoked',
        message: `Coverage "${label}" has been revoked. All routing has been restored.`,
        severity: 'WARNING',
        targets: [originalOwnerId, temporaryOwnerId, ...(managerId ? [managerId] : [])],
      },
      COVERAGE_EXTENDED: {
        title: 'Coverage Extended',
        message: `Coverage "${label}" has been extended.`,
        severity: 'INFO',
        targets: [originalOwnerId, temporaryOwnerId],
      },
      ESCALATION_TRIGGERED: {
        title: '🚨 Escalation Triggered',
        message: `Primary backup for coverage "${label}" is unavailable. Escalation chain activated.`,
        severity: 'CRITICAL',
        targets: [...(managerId ? [managerId] : []), temporaryOwnerId],
      },
      COVERAGE_DEGRADED: {
        title: '🔴 Coverage Degraded',
        message: `All backup users for coverage "${label}" are unavailable. Messages routing to original owner.`,
        severity: 'CRITICAL',
        targets: [originalOwnerId, ...(managerId ? [managerId] : [])],
      },
    };

    const template = templates[type];
    if (!template) return;

    const uniqueTargets = [...new Set(template.targets)];
    for (const recipientUserId of uniqueTargets) {
      await this.notify({
        tenantId,
        workspaceId,
        coverageId,
        type,
        recipientUserId,
        title: template.title,
        message: template.message,
        severity: template.severity,
      });
    }
  },

  /**
   * Get unread notifications for a user
   */
  getUnreadNotifications(tenantId: string, userId: string): CoverageNotification[] {
    return notificationStore.filter(
      n => n.tenantId === tenantId && n.recipientUserId === userId && !n.read
    );
  },

  /**
   * Get all notifications for a user (paginated)
   */
  getNotifications(tenantId: string, userId: string, limit = 50): CoverageNotification[] {
    return notificationStore
      .filter(n => n.tenantId === tenantId && n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const n = notificationStore.find(n => n.id === notificationId);
    if (n) { n.read = true; return true; }
    return false;
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(tenantId: string, userId: string): number {
    let count = 0;
    notificationStore.forEach(n => {
      if (n.tenantId === tenantId && n.recipientUserId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  },

  /**
   * Get notification count for a user
   */
  getUnreadCount(tenantId: string, userId: string): number {
    return notificationStore.filter(
      n => n.tenantId === tenantId && n.recipientUserId === userId && !n.read
    ).length;
  }
};
