import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

const SSO_SECRET = process.env.SSO_SECRET || 'pentacloud-whatzupp-super-secret-key-2026';

export async function POST(request: Request) {
  try {
    const { jwt, context } = await request.json();

    if (!jwt) {
      return NextResponse.json({ error: 'Missing JWT' }, { status: 400 });
    }

    // 1. Verify JWT Signature
    const secret = new TextEncoder().encode(SSO_SECRET);
    let payload;
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

    const { email, tenantId, workspacePermissions } = payload as any;

    if (!email) {
      return NextResponse.json({ error: 'JWT missing email claim' }, { status: 400 });
    }

    // 2. Salesforce User Mapping & Validation
    // User must exist in the WhatZupp database. We do not auto-create.
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tenant: true,
        workspacePermissions: true,
      }
    });

    if (!user) {
      console.error(`SSO Failed: User ${email} not found in WhatZupp registry.`);
      return NextResponse.json({ error: 'User not found in WhatZupp registry. Contact administrator.' }, { status: 403 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'User account is inactive or suspended.' }, { status: 403 });
    }

    // 3. (Optional) Validate Tenant ID if provided by Salesforce, ensuring it matches
    if (tenantId && user.tenantId && user.tenantId !== tenantId) {
       // Depending on strictness, we might reject or allow if it's a known mapping.
       // For now, we allow the lookup by email to be the primary authority.
    }

    // 4. Issue Next.js Session
    // We create a secure session cookie that the middleware and /api/auth/me will recognize.
    const sessionToken = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      sso: true,
      ssoPermissions: workspacePermissions,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('whatsapp_session', sessionToken, {
      httpOnly: true,
      secure: true, // Must be true for SameSite=None
      sameSite: 'none', // Required for cross-domain iframes
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // 5. Determine default workspace from permissions if not explicitly requested
    // The client handles redirect, so we just return success
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      context: context // pass back context (e.g. { phone: "123" }) to the frontend
    });

  } catch (error) {
    console.error('SSO POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
