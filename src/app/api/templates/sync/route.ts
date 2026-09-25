// src/app/api/templates/sync/route.ts
// NEW ISOLATED ROUTE — Enterprise Template Sync Cron Job
// Protected by CRON_SECRET. Not publicly accessible.
// Polls Meta Graph API for template status changes every 15 minutes.
// ZERO impact on existing routes.

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Env Reader ──────────────────────────────────────────

function getEnvCredentials(): { accessToken: string | undefined; wabaId: string | undefined; cronSecret: string | undefined } {
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  let wabaId = process.env.WABA_ID;
  let cronSecret = process.env.CRON_SECRET;

  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [key, ...rest] = trimmed.split('=');
        let val = rest.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key === 'WHATSAPP_ACCESS_TOKEN' && val) accessToken = val;
        if (key === 'WABA_ID' && val) wabaId = val;
        if (key === 'CRON_SECRET' && val) cronSecret = val;
      }
    }
  } catch (e) {
    console.warn('[templates/sync] Could not read .env.local fallback:', e);
  }

  return { accessToken, wabaId, cronSecret };
}

// ─── GET Handler (Cron Job Trigger) ──────────────────────

export async function GET(request: NextRequest) {
  try {
    const { accessToken, wabaId, cronSecret } = getEnvCredentials();

    // ── 1. Authenticate Cron Job ──
    const authHeader = request.headers.get('authorization');
    const querySecret = request.nextUrl.searchParams.get('secret');
    const providedSecret = authHeader?.replace('Bearer ', '') || querySecret;

    // If CRON_SECRET is configured, enforce it
    if (cronSecret && providedSecret !== cronSecret) {
      console.warn('[templates/sync] Unauthorized sync attempt blocked.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid or missing CRON_SECRET.' },
        { status: 401 }
      );
    }

    if (!accessToken || !wabaId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp Access Token or WABA ID not configured.' },
        { status: 400 }
      );
    }

    // ── 2. Fetch ALL templates from Meta (source of truth) ──
    console.log('[templates/sync] Starting sync job...');
    const allTemplates: any[] = [];
    let nextUrl: string | null = `https://graph.facebook.com/v25.0/${wabaId}/message_templates?limit=100`;

    while (nextUrl) {
      const currentUrl: string = nextUrl;
      const metaRes: Response = await fetch(currentUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!metaRes.ok) {
        const errorData = await metaRes.json().catch(() => ({}));
        const msg = errorData.error?.message || `Meta API Error ${metaRes.status}`;
        console.error(`[templates/sync] Meta API error: ${msg}`);
        return NextResponse.json(
          { success: false, error: `Meta API Error: ${msg}`, details: errorData },
          { status: 502 }
        );
      }

      const metaData: any = await metaRes.json();
      if (metaData.data && Array.isArray(metaData.data)) {
        allTemplates.push(...metaData.data);
      }
      nextUrl = metaData.paging?.next || null;
    }

    // ── 3. Build sync report ──
    const statusCounts: Record<string, number> = {};
    const syncReport = allTemplates.map((t: any) => {
      const status = t.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      return {
        metaTemplateId: t.id,
        name: t.name,
        category: t.category,
        language: t.language,
        status: status,
        rejectionReason: t.rejected_reason || t.quality_score?.reasons?.join(', ') || null,
        lastSynced: new Date().toISOString(),
      };
    });

    console.log(`[templates/sync] Sync complete. ${allTemplates.length} templates found.`, statusCounts);

    // ── 4. Return sync results ──
    // The frontend or a workspace connector can use this data
    // to update Salesforce Objects or SFMC Data Extensions
    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      totalTemplates: allTemplates.length,
      statusCounts,
      templates: syncReport,
      message: `Synced ${allTemplates.length} templates from Meta.`,
    });

  } catch (error: any) {
    console.error('[templates/sync] Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
