import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { prisma, hasDatabaseUrl } from '@/lib/db';
import { createSessionToken, SessionPayload } from '@/lib/auth';
import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';

const SSO_SECRET = process.env.SSO_SECRET || 'pentacloud-whatzupp-super-secret-key-2026';

export async function POST(request: Request) {
  try {
    const { jwt, context } = await request.json();

    if (!jwt) {
      return NextResponse.json({ error: 'Missing JWT' }, { status: 400 });
    }

    // 1. Verify JWT Signature from Salesforce
    const secret = new TextEncoder().encode(SSO_SECRET);
    let payload: any;
    try {
      const { payload: decodedPayload } = await jose.jwtVerify(jwt, secret, {
        algorithms: ['HS256'],
        issuer: 'salesforce',
      });
      payload = decodedPayload;
    } catch (err: any) {
      console.error('SSO JWT Verification failed:', err);
      return NextResponse.json({ error: 'Invalid or expired SSO token' }, { status: 401 });
    }

    const { email, tenantId, workspacePermissions, name, sub } = payload;

    if (!email) {
      return NextResponse.json({ error: 'JWT missing email claim' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. User Mapping & Validation (Resilient Multi-Tier)
    let userRecord: any = null;

    // Tier A: Check Prisma Database (if accessible)
    if (hasDatabaseUrl()) {
      try {
        userRecord = await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: {
            tenant: true,
            workspacePermissions: true,
          },
        });

        if (userRecord && userRecord.status !== 'active') {
          return NextResponse.json({ error: 'User account is inactive or suspended.' }, { status: 403 });
        }
      } catch (dbErr: any) {
        console.warn('Prisma DB lookup note in SSO (fallback active):', dbErr.message);
      }
    }

    // Tier B: Check Salesforce WhatZupp_User__c (if available)
    if (!userRecord) {
      try {
        const scConnector = new SalesCloudConnector();
        const sfUser = await scConnector.findUserByEmail(cleanEmail);
        if (sfUser) {
          if (sfUser.status === 'SUSPENDED' || sfUser.status === 'DISABLED') {
            return NextResponse.json({ error: 'User account is inactive or suspended.' }, { status: 403 });
          }
          userRecord = {
            id: sfUser.id,
            email: sfUser.email,
            fullName: sfUser.fullName,
            tenantId: sfUser.tenantId || tenantId || 'pentacloud-tenant-id',
            role: sfUser.role || 'TENANT_ADMIN',
            workspacePermissions: sfUser.workspacePermissions || [{ workspaceType: 'SALES_CLOUD' }],
          };
        }
      } catch (sfErr: any) {
        console.warn('Salesforce WhatZupp_User__c lookup note in SSO:', sfErr?.message);
      }
    }

    // Tier C: Fallback to verified claims directly from Salesforce JWT
    const effectiveUserId = userRecord?.id || sub || `sf_${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`;
    const effectiveFullName = userRecord?.fullName || name || cleanEmail.split('@')[0];
    const effectiveTenantId = userRecord?.tenantId || tenantId || 'pentacloud-tenant-id';
    const effectiveRole = userRecord?.role || 'TENANT_ADMIN';
    const effectivePermissions = userRecord?.workspacePermissions
      ? userRecord.workspacePermissions.map((p: any) => p.workspaceType || p)
      : (Array.isArray(workspacePermissions) && workspacePermissions.length > 0 ? workspacePermissions : ['SALES_CLOUD']);

    const sessionPayload: SessionPayload = {
      userId: effectiveUserId,
      email: cleanEmail,
      fullName: effectiveFullName,
      tenantId: effectiveTenantId,
      tenantCode: 'SALES_CLOUD',
      tenantName: 'Salesforce Enterprise',
      role: effectiveRole as any,
      workspacePermissions: effectivePermissions,
      sso: true,
      ssoPermissions: Array.isArray(workspacePermissions) ? workspacePermissions : ['SALES_CLOUD'],
    };

    // 3. Issue Session Token with correct JWT_SECRET
    const sessionToken = await createSessionToken(sessionPayload);

    // 4. Set Session Cookie (Cross-site iframe compliant for Salesforce Lightning)
    const cookieStore = await cookies();
    try {
      cookieStore.set('wz_session', sessionToken, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Required for cross-domain iframes
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (cookieErr) {
      console.warn('Could not set cookie in SSO route:', cookieErr);
    }

    // 5. Return success with user details and token for client-side persistence
    return NextResponse.json({
      success: true,
      user: sessionPayload,
      token: sessionToken,
      context: context,
    });
  } catch (error: any) {
    console.error('SSO POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
