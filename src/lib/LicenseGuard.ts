// src/lib/LicenseGuard.ts
import { prisma, hasDatabaseUrl } from '@/lib/db';
import { SessionPayload } from '@/lib/auth';

export interface LicenseCheckResult {
  allowed: boolean;
  error?: string;
  tenant?: any;
}

export async function checkUserLimit(session: SessionPayload): Promise<LicenseCheckResult> {
  if (!session.tenantId) {
    return { allowed: false, error: 'No active tenant session.' };
  }
  
  if (!hasDatabaseUrl() || session.tenantId.startsWith('t-')) {
    // If no DB is configured or using local mock tenant, allow mock usage
    return { allowed: true };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId, isDeleted: false },
    });

    if (!tenant) {
      return { allowed: false, error: 'Tenant not found.' };
    }

    if (tenant.status !== 'ACTIVE') {
      return { allowed: false, error: `Tenant account is ${tenant.status}. Please contact WhatZupp Admin.` };
    }

    const currentUsersCount = await prisma.user.count({
      where: { 
        tenantId: tenant.id,
        isDeleted: false
      }
    });

    if (currentUsersCount >= tenant.userLimit) {
      return { 
        allowed: false, 
        error: `User limit reached (${currentUsersCount}/${tenant.userLimit}). Contact WhatZupp Admin for additional licenses.` 
      };
    }

    return { allowed: true, tenant };
  } catch (err: any) {
    console.error('LicenseGuard error:', err);
    return { allowed: false, error: 'Failed to verify license limits.' };
  }
}
