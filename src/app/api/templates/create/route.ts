// src/app/api/templates/create/route.ts
// NEW ISOLATED ROUTE — Enterprise Template Creation
// Handles: Draft saving, Meta validation, Meta submission
// ZERO impact on existing /api/templates GET route

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Types ───────────────────────────────────────────────
interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE' | 'OTP';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  text?: string;
  example?: { header_text?: string[]; body_text?: string[][] };
  buttons?: TemplateButton[];
}

interface CreateTemplateRequest {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: TemplateComponent[];
  // Workspace isolation
  workspaceId: string;
  workspaceType: string;
  // Audit
  createdBy: string;
  // If true, save as DRAFT only (no Meta call)
  isDraft?: boolean;
}

// ─── Validation Helpers ──────────────────────────────────

function validateTemplateName(name: string): string | null {
  if (!name || name.trim().length === 0) return 'Template name is required.';
  if (name.length > 512) return 'Template name must be 512 characters or less.';
  if (!/^[a-z0-9_]+$/.test(name)) return 'Template name must be lowercase letters, numbers, and underscores only.';
  return null;
}

function validateComponents(components: TemplateComponent[]): string | null {
  if (!components || components.length === 0) return 'At least one component (BODY) is required.';

  const bodyComponent = components.find(c => c.type === 'BODY');
  if (!bodyComponent || !bodyComponent.text) return 'A BODY component with text is required.';
  if (bodyComponent.text.length > 1024) return 'Body text must be 1024 characters or less.';

  const headerComponent = components.find(c => c.type === 'HEADER');
  if (headerComponent) {
    if (headerComponent.format === 'TEXT' && headerComponent.text && headerComponent.text.length > 60) {
      return 'Header text must be 60 characters or less.';
    }
  }

  const footerComponent = components.find(c => c.type === 'FOOTER');
  if (footerComponent && footerComponent.text && footerComponent.text.length > 60) {
    return 'Footer text must be 60 characters or less.';
  }

  const buttonsComponent = components.find(c => c.type === 'BUTTONS');
  if (buttonsComponent && buttonsComponent.buttons) {
    if (buttonsComponent.buttons.length > 10) return 'Maximum 10 buttons allowed.';
    const quickReplies = buttonsComponent.buttons.filter(b => b.type === 'QUICK_REPLY');
    if (quickReplies.length > 3) return 'Maximum 3 Quick Reply buttons allowed.';
    for (const btn of buttonsComponent.buttons) {
      if (!btn.text || btn.text.length > 25) return `Button text "${btn.text || ''}" must be 1-25 characters.`;
    }
  }

  // Validate variable count in body
  const bodyVars = (bodyComponent.text.match(/\{\{\d+\}\}/g) || []);
  if (bodyVars.length > 10) return 'Maximum 10 variables allowed in body text.';

  // Meta Rule: Variables cannot be at the start or end of the string
  const trimmedBody = bodyComponent.text.trim();
  if (trimmedBody.match(/^\{\{\d+\}\}/)) return 'Variables cannot be at the very start of the body text. Please add some text before it.';
  if (trimmedBody.match(/\{\{\d+\}\}$/)) return 'Variables cannot be at the very end of the body text. Please add some text or punctuation after it.';

  return null;
}

function countVariables(text: string): number {
  return (text.match(/\{\{\d+\}\}/g) || []).length;
}

// ─── Env Reader (reuse pattern from existing route) ──────

function getEnvCredentials(): { accessToken: string | undefined; wabaId: string | undefined } {
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  let wabaId = process.env.WABA_ID;

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
      }
    }
  } catch (e) {
    console.warn('[templates/create] Could not read .env.local fallback:', e);
  }

  return { accessToken, wabaId };
}

// ─── Build Meta API Payload ──────────────────────────────

function buildMetaPayload(req: CreateTemplateRequest) {
  const metaComponents: any[] = [];

  for (const comp of req.components) {
    if (comp.type === 'HEADER') {
      const headerComp: any = { type: 'HEADER' };
      if (comp.format === 'TEXT') {
        headerComp.format = 'TEXT';
        headerComp.text = comp.text;
        const varCount = countVariables(comp.text || '');
        if (varCount > 0) {
          headerComp.example = { header_text: comp.example?.header_text || Array(varCount).fill('Sample') };
        }
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format || '')) {
        headerComp.format = comp.format;
        // Media URL will be passed via example field
        if (comp.example) headerComp.example = comp.example;
      } else if (comp.format === 'LOCATION') {
        headerComp.format = 'LOCATION';
      }
      metaComponents.push(headerComp);
    }

    if (comp.type === 'BODY') {
      const bodyComp: any = { type: 'BODY', text: comp.text };
      const varCount = countVariables(comp.text || '');
      if (varCount > 0) {
        bodyComp.example = {
          body_text: comp.example?.body_text || [Array(varCount).fill('Sample')]
        };
      }
      metaComponents.push(bodyComp);
    }

    if (comp.type === 'FOOTER') {
      metaComponents.push({ type: 'FOOTER', text: comp.text });
    }

    if (comp.type === 'BUTTONS' && comp.buttons) {
      const metaButtons = comp.buttons.map(btn => {
        const metaBtn: any = { type: btn.type, text: btn.text };
        if (btn.type === 'URL' && btn.url) metaBtn.url = btn.url;
        if (btn.type === 'PHONE_NUMBER' && btn.phone_number) metaBtn.phone_number = btn.phone_number;
        if (btn.type === 'COPY_CODE' && btn.example) metaBtn.example = btn.example;
        return metaBtn;
      });
      metaComponents.push({ type: 'BUTTONS', buttons: metaButtons });
    }
  }

  return {
    name: req.name,
    category: req.category,
    language: req.language,
    components: metaComponents,
  };
}

// ─── POST Handler ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateRequest = await request.json();

    // ── 1. Validate tenant/workspace context ──
    if (!body.workspaceId || !body.workspaceType) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID and Workspace Type are required for tenant isolation.' },
        { status: 400 }
      );
    }
    if (!body.createdBy) {
      return NextResponse.json(
        { success: false, error: 'Created By (user identifier) is required for audit trail.' },
        { status: 400 }
      );
    }

    // ── 2. Validate template name ──
    const nameError = validateTemplateName(body.name);
    if (nameError) {
      return NextResponse.json({ success: false, error: nameError }, { status: 400 });
    }

    // ── 3. Validate components ──
    const compError = validateComponents(body.components);
    if (compError) {
      return NextResponse.json({ success: false, error: compError }, { status: 400 });
    }

    // ── 4. If DRAFT — return success without Meta call ──
    if (body.isDraft) {
      console.log(`[templates/create] Saving DRAFT: "${body.name}" for workspace ${body.workspaceId}`);
      return NextResponse.json({
        success: true,
        status: 'DRAFT',
        template: {
          name: body.name,
          category: body.category,
          language: body.language,
          status: 'DRAFT',
          workspaceId: body.workspaceId,
          workspaceType: body.workspaceType,
          createdBy: body.createdBy,
          createdDate: new Date().toISOString(),
          components: body.components,
        },
        message: 'Template saved as draft. It has NOT been submitted to Meta.',
      });
    }

    // ── 5. Get Meta credentials (server-side only) ──
    const { accessToken, wabaId } = getEnvCredentials();
    if (!accessToken || !wabaId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp Access Token or WABA ID not configured. Check Settings.' },
        { status: 400 }
      );
    }

    // ── 6. Build Meta payload and submit ──
    const metaPayload = buildMetaPayload(body);
    console.log(`[templates/create] Submitting to Meta: "${body.name}" (${body.category}/${body.language})`);

    const metaResponse = await fetch(
      `https://graph.facebook.com/v25.0/${wabaId}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      const errorMsg = metaData.error?.message || metaData.error?.error_user_msg || `Meta API Error ${metaResponse.status}`;
      const rejectionReason = metaData.error?.error_user_msg || metaData.error?.message || 'Unknown rejection reason';
      console.error(`[templates/create] Meta rejected payload:`, JSON.stringify(metaPayload));
      console.error(`[templates/create] Meta rejected error details:`, JSON.stringify(metaData));
      return NextResponse.json({
        success: false,
        error: `Meta API Error: ${errorMsg}`,
        rejectionReason,
        details: metaData,
      }, { status: 502 });
    }

    // ── 7. Return success with Meta Template ID ──
    console.log(`[templates/create] SUCCESS — Meta Template ID: ${metaData.id}, Status: ${metaData.status}`);

    return NextResponse.json({
      success: true,
      status: metaData.status || 'PENDING',
      template: {
        metaTemplateId: metaData.id,
        name: body.name,
        category: metaData.category || body.category,
        language: body.language,
        status: metaData.status || 'PENDING',
        workspaceId: body.workspaceId,
        workspaceType: body.workspaceType,
        createdBy: body.createdBy,
        createdDate: new Date().toISOString(),
        submittedBy: body.createdBy,
        submittedDate: new Date().toISOString(),
      },
      message: 'Template submitted to Meta successfully. Status will update via sync.',
    });

  } catch (error: any) {
    console.error('[templates/create] Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
