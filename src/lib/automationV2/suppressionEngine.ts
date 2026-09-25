// src/lib/automationV2/suppressionEngine.ts

export type SuppressionReason = 'UNSUBSCRIBED' | 'BLACKLISTED' | 'DND' | 'OPT_OUT' | 'BLOCKED';

export interface SuppressionRule {
  tenantId: string;
  workspaceId: string;
  contactId: string;
  reason: SuppressionReason;
  createdAt: string;
}

/**
 * Checks if a contact is globally suppressed for a given workspace.
 * In a real implementation, this would query a global suppression database table or Redis cache.
 */
export const isContactSuppressed = async (
  tenantId: string, 
  workspaceId: string, 
  contactId: string
): Promise<{ suppressed: boolean; reason?: SuppressionReason }> => {
  // Sprint 3 mock logic (to be replaced by DB call)
  const mockSuppressedCache: Record<string, SuppressionReason> = {
    'contact-blacklist-123': 'BLACKLISTED',
    'contact-dnd-456': 'DND'
  };

  if (mockSuppressedCache[contactId]) {
    return { suppressed: true, reason: mockSuppressedCache[contactId] };
  }

  return { suppressed: false };
};

/**
 * Filter a batch of contacts, removing those that hit global suppression rules.
 */
export const filterSuppressedContacts = async (
  tenantId: string,
  workspaceId: string,
  contacts: any[]
): Promise<{ allowed: any[]; suppressed: any[] }> => {
  const allowed = [];
  const suppressed = [];

  for (const contact of contacts) {
    const check = await isContactSuppressed(tenantId, workspaceId, contact.id);
    if (check.suppressed) {
      suppressed.push({ ...contact, suppressionReason: check.reason });
    } else {
      allowed.push(contact);
    }
  }

  return { allowed, suppressed };
};
