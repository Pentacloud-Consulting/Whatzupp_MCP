// src/lib/interactiveLeadFlowService.ts
// Handles the interactive WhatsApp Click-to-WhatsApp Lead Generation Journey
// 1. Welcome + Interactive Buttons [Yes, I'm interested | Just exploring]
// 2. Service Selection [Salesforce, Zoho, Digital Marketing, Website/App Dev, Other IT]
// 3. Name Capture
// 4. Company Name Capture
// 5. Requirement Capture
// 6. Final Thank You Confirmation
// Designed for serverless resilience with Vercel KV / persistent storage + stateless recovery

import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { emitRealtimeMessage } from '@/lib/realtime';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';
import { getConfig, setConfig } from '@/lib/storage/kvStore';
import { normalizePhoneNumber } from '@/utils/phone';

export type LeadFlowStep =
  | 'STEP_INTEREST'
  | 'STEP_SERVICE'
  | 'STEP_NAME'
  | 'STEP_COMPANY'
  | 'STEP_REQUIREMENT';

export interface LeadFlowState {
  phone: string;
  step: LeadFlowStep;
  service?: string;
  name?: string;
  company?: string;
  leadId?: string;
  updatedAt: number;
}

// In-memory session store fallback
const flowSessions = new Map<string, LeadFlowState>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export async function getFlowSession(phone: string): Promise<LeadFlowState | null> {
  const cleanPhone = normalizePhoneNumber(phone);

  // 1. Try persistent storage first (handles Vercel Serverless cold starts)
  try {
    const data = (await getConfig(`lead_flow_${cleanPhone}`)) as LeadFlowState | null;
    if (data && typeof data === 'object' && data.step) {
      if (Date.now() - (data.updatedAt || 0) < SESSION_TTL_MS) {
        return data;
      }
    }
  } catch (e) {
    console.warn('[leadFlowService] kvStore get error:', e);
  }

  // 2. Fallback to in-memory
  const session = flowSessions.get(cleanPhone);
  if (!session) return null;

  if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
    flowSessions.delete(cleanPhone);
    return null;
  }
  return session;
}

export async function setFlowSession(phone: string, state: LeadFlowState): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  state.updatedAt = Date.now();
  flowSessions.set(cleanPhone, state);

  try {
    await setConfig(`lead_flow_${cleanPhone}`, state);
  } catch (e) {
    console.warn('[leadFlowService] kvStore set error:', e);
  }
}

export async function clearFlowSession(phone: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  flowSessions.delete(cleanPhone);
  try {
    await setConfig(`lead_flow_${cleanPhone}`, null);
  } catch (e) {
    console.warn('[leadFlowService] kvStore clear error:', e);
  }
}

/**
 * Sends a raw Meta WhatsApp Graph API payload and logs it to Salesforce
 */
async function sendWhatsAppAndLogToSalesforce(params: {
  to: string;
  payload: any;
  displayText: string;
  leadId?: string;
}): Promise<{ success: boolean; messageId: string }> {
  const { to, payload, displayText, leadId } = params;
  const cleanPhone = normalizePhoneNumber(to);
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN || '';
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '';

  let messageId = `wamid.flow.${Date.now()}.${Math.floor(Math.random() * 1000)}`;

  if (token && phoneId) {
    try {
      payload.messaging_product = 'whatsapp';
      payload.recipient_type = 'individual';
      payload.to = cleanPhone.replace(/\D/g, '');

      const response = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.messages?.[0]?.id) {
          messageId = resData.messages[0].id;
          console.log(`[leadFlowService] WhatsApp message sent successfully (${messageId})`);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[leadFlowService] Meta API error:', JSON.stringify(errData));
      }
    } catch (sendErr) {
      console.error('[leadFlowService] Network error sending to Meta:', sendErr);
    }
  } else {
    console.warn('[leadFlowService] Meta credentials missing. Using simulated wamid.');
  }

  // 1. Save outbound message to Salesforce WhatsApp_Message__c
  try {
    const scConnector = new SalesCloudConnector();
    await scConnector.saveOutboundMessage({
      messageId,
      recipientPhone: cleanPhone,
      content: displayText,
      leadId,
      status: 'SENT',
    });
  } catch (sfErr) {
    console.warn('[leadFlowService] Failed to save outbound message to Salesforce:', sfErr);
  }

  // 2. Emit real-time SSE event to LWC chat
  try {
    emitRealtimeMessage(cleanPhone, {
      id: messageId,
      content: displayText,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: 'DELIVERED',
      recipientId: cleanPhone,
    }, 'salescloud-ws-1');
  } catch (sseErr) {
    console.warn('[leadFlowService] SSE emit failed:', sseErr);
  }

  return { success: true, messageId };
}

/**
 * Creates or retrieves a Lead in Salesforce for this phone number
 */
async function ensureLead(phone: string, referralHeadline?: string): Promise<string | undefined> {
  const cleanPhone = normalizePhoneNumber(phone);
  const scConnector = new SalesCloudConnector();

  try {
    const contact = await scConnector.findContact({ phoneNumber: cleanPhone });
    if (contact && contact.salesforceObjectType === 'Lead' && contact.salesforceRecordId) {
      return contact.salesforceRecordId;
    }

    const source = referralHeadline ? `Instagram Ad: ${referralHeadline.slice(0, 40)}` : 'WhatsApp Lead';
    const newLead = await scConnector.createLead({
      name: 'WhatsApp Prospect',
      phoneNumber: cleanPhone,
      company: 'Pending Details',
      labels: 'Inbound WhatsApp Lead',
    });

    if (newLead && newLead.salesforceRecordId) {
      try {
        const { access_token, instance_url } = await getSalesCloudAccessToken();
        if (!access_token.startsWith('mock-')) {
          await fetch(`${instance_url}/services/data/v59.0/sobjects/Lead/${newLead.salesforceRecordId}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              LeadSource: 'WhatsApp / Ad',
              Status: 'New',
            }),
          });
        }
      } catch (patchErr) {
        console.warn('[leadFlowService] Failed to patch LeadSource on new lead:', patchErr);
      }
      return newLead.salesforceRecordId;
    }
  } catch (err) {
    console.error('[leadFlowService] ensureLead failed:', err);
  }
  return undefined;
}

/**
 * Updates Salesforce Lead record fields safely
 */
async function updateSalesforceLead(leadId: string, fields: Record<string, any>): Promise<void> {
  try {
    const { access_token, instance_url } = await getSalesCloudAccessToken();
    if (!access_token.startsWith('mock-')) {
      const res = await fetch(`${instance_url}/services/data/v59.0/sobjects/Lead/${leadId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[leadFlowService] updateSalesforceLead failed (${res.status}): ${errText}`);
      } else {
        console.log(`[leadFlowService] Successfully updated Salesforce Lead ${leadId} with:`, Object.keys(fields));
      }
    }
  } catch (err) {
    console.error('[leadFlowService] Error updating Salesforce Lead:', err);
  }
}

/**
 * Step 1: Send Welcome Message with Interactive Buttons
 */
export async function sendStep1Welcome(phone: string, referralHeadline?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const leadId = await ensureLead(cleanPhone, referralHeadline);

  const welcomeText =
    "Hello! 👋 Welcome to Pentacloud Consulting.\n\n" +
    "Thank you for reaching out to us. We help businesses with Salesforce, Zoho, Digital Marketing, and Technology solutions.\n\n" +
    "May I know if you're currently looking for any business solution or service from our team?";

  const payload = {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: welcomeText,
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'btn_yes_interested',
              title: "Yes, I'm interested",
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'btn_just_exploring',
              title: 'Just exploring',
            },
          },
        ],
      },
    },
  };

  const displayText = `${welcomeText}\n[Buttons: Yes, I'm interested | Just exploring]`;
  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText, leadId });

  await setFlowSession(cleanPhone, {
    phone: cleanPhone,
    step: 'STEP_INTEREST',
    leadId,
    updatedAt: Date.now(),
  });
}

/**
 * Step 2: Send Services List / Buttons
 */
export async function sendStep2Services(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText = "Certainly! We'd be happy to assist you. 😊\nMay I know which service you're looking for?";

  const payload = {
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Pentacloud Services',
      },
      body: {
        text: promptText,
      },
      footer: {
        text: 'Tap below to choose',
      },
      action: {
        button: 'Select a Service',
        sections: [
          {
            title: 'Our Key Offerings',
            rows: [
              { id: 'srv_salesforce', title: 'Salesforce Services', description: 'CRM implementation & customization' },
              { id: 'srv_zoho', title: 'Zoho Solutions', description: 'Zoho CRM, Creator & One suite' },
              { id: 'srv_marketing', title: 'Digital Marketing', description: 'Meta & Google Ads, SEO, Lead Gen' },
              { id: 'srv_webapp', title: 'Website / App Dev', description: 'Custom Web & Mobile applications' },
              { id: 'srv_other', title: 'Other IT Services', description: 'Consulting & Cloud integrations' },
            ],
          },
        ],
      },
    },
  };

  const displayText = `${promptText}\n[Options: Salesforce Services | Zoho Solutions | Digital Marketing | Website / App Dev | Other IT Services]`;
  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText, leadId });

  const session = await getFlowSession(cleanPhone);
  await setFlowSession(cleanPhone, {
    phone: cleanPhone,
    step: 'STEP_SERVICE',
    leadId: leadId || session?.leadId,
    updatedAt: Date.now(),
  });
}

/**
 * Step 3: Ask Customer Name
 */
export async function sendStep3AskName(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText = 'Thank you for sharing that. May I know your name, please?';

  const payload = {
    type: 'text',
    text: { preview_url: false, body: promptText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: promptText, leadId });

  const session = await getFlowSession(cleanPhone);
  if (session) {
    session.step = 'STEP_NAME';
    await setFlowSession(cleanPhone, session);
  }
}

/**
 * Step 4: Ask Company Name
 */
export async function sendStep4AskCompany(phone: string, customerName: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText = `Thank you, ${customerName}. 😊\nMay I also know the name of your company or business?`;

  const payload = {
    type: 'text',
    text: { preview_url: false, body: promptText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: promptText, leadId });

  const session = await getFlowSession(cleanPhone);
  if (session) {
    session.step = 'STEP_COMPANY';
    session.name = customerName;
    await setFlowSession(cleanPhone, session);
  }
}

/**
 * Step 5: Ask Requirement
 */
export async function sendStep5AskRequirement(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText =
    "Could you briefly tell us what you're looking to achieve or what kind of support you need? This will help us connect you with the right team.";

  const payload = {
    type: 'text',
    text: { preview_url: false, body: promptText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: promptText, leadId });

  const session = await getFlowSession(cleanPhone);
  if (session) {
    session.step = 'STEP_REQUIREMENT';
    await setFlowSession(cleanPhone, session);
  }
}

/**
 * Step 6: Send Final Thank You Confirmation
 */
export async function sendStep6Confirmation(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const confirmText =
    "Thank you so much for sharing these details with us. 🙏\n\n" +
    "We've noted your enquiry, and our team at Pentacloud Consulting will review your requirements and get in touch with you shortly.\n\n" +
    "We appreciate your interest in Pentacloud and look forward to speaking with you!";

  const payload = {
    type: 'text',
    text: { preview_url: false, body: confirmText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: confirmText, leadId });

  await clearFlowSession(cleanPhone);
}

/**
 * Handle "Just Exploring" Response
 */
export async function handleJustExploring(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const replyText =
    "No problem at all! Feel free to explore our solutions on our website: https://pentacloud.com or message us here anytime you'd like to connect. Have a wonderful day! 😊";

  const payload = {
    type: 'text',
    text: { preview_url: false, body: replyText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: replyText, leadId });

  if (leadId) {
    await updateSalesforceLead(leadId, {
      Status: 'Open - Not Contacted',
      Description: 'Inbound lead contacted via WhatsApp, selected "Just Exploring".',
    });
  }

  await clearFlowSession(cleanPhone);
}

/**
 * Main Handler called by Webhook on incoming messages
 * Returns TRUE if the message was handled by this Lead Flow, FALSE otherwise.
 */
export async function handleLeadFlowMessage(params: {
  phone: string;
  contentText: string;
  interactiveReplyId?: string;
  referralHeadline?: string;
  leadId?: string;
}): Promise<boolean> {
  const { phone, contentText, interactiveReplyId, referralHeadline } = params;
  const cleanPhone = normalizePhoneNumber(phone);
  const text = contentText.trim();
  const lowerText = text.toLowerCase();

  let session = await getFlowSession(cleanPhone);
  const currentLeadId = session?.leadId || params.leadId;

  console.log(`[leadFlowService] Inbound: phone=${cleanPhone}, text="${text}", replyId="${interactiveReplyId}", step=${session?.step}`);

  // ─── 1. STATELESS RECOVERY (Essential for Vercel / Serverless cold starts) ───
  // If the user tapped or typed "Yes, I'm interested"
  const isYesInterested =
    interactiveReplyId === 'btn_yes_interested' ||
    lowerText === "yes, i'm interested" ||
    lowerText === 'yes' ||
    (lowerText.includes('interested') && !lowerText.includes('hi') && !lowerText.includes('hello'));

  if (isYesInterested) {
    console.log(`[leadFlowService] Handling 'Yes, I'm interested' for ${cleanPhone}`);
    await sendStep2Services(cleanPhone, currentLeadId);
    return true;
  }

  // If the user tapped or typed "Just exploring"
  const isExploring =
    interactiveReplyId === 'btn_just_exploring' ||
    lowerText === 'just exploring' ||
    lowerText === 'exploring';

  if (isExploring) {
    console.log(`[leadFlowService] Handling 'Just exploring' for ${cleanPhone}`);
    await handleJustExploring(cleanPhone, currentLeadId);
    return true;
  }

  // If user selected a service from the interactive list or typed it
  const isServiceSelection =
    interactiveReplyId?.startsWith('srv_') ||
    (session?.step === 'STEP_SERVICE' && text.length > 0) ||
    lowerText.includes('salesforce') ||
    lowerText.includes('zoho') ||
    lowerText.includes('digital marketing') ||
    lowerText.includes('website / app') ||
    lowerText.includes('other it');

  if (isServiceSelection && session?.step !== 'STEP_NAME' && session?.step !== 'STEP_COMPANY' && session?.step !== 'STEP_REQUIREMENT') {
    let selectedService = 'Salesforce Services';
    if (interactiveReplyId === 'srv_zoho' || lowerText.includes('zoho')) {
      selectedService = 'Zoho Solutions';
    } else if (interactiveReplyId === 'srv_marketing' || lowerText.includes('marketing')) {
      selectedService = 'Digital Marketing';
    } else if (interactiveReplyId === 'srv_webapp' || lowerText.includes('web') || lowerText.includes('app')) {
      selectedService = 'Website / App Development';
    } else if (interactiveReplyId === 'srv_other' || lowerText.includes('other')) {
      selectedService = 'Other IT Services';
    } else {
      selectedService = text.slice(0, 50);
    }

    console.log(`[leadFlowService] Service chosen "${selectedService}" for ${cleanPhone}`);

    if (!session) {
      session = {
        phone: cleanPhone,
        step: 'STEP_SERVICE',
        leadId: currentLeadId,
        updatedAt: Date.now(),
      };
    }
    session.service = selectedService;
    session.step = 'STEP_NAME';
    await setFlowSession(cleanPhone, session);

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        Description: `Selected Service: ${selectedService}`,
      });
    }

    await sendStep3AskName(cleanPhone, currentLeadId);
    return true;
  }

  // ─── 2. CHECK IF START KEYWORD (Start of Flow) ───
  const isStartKeyword =
    /^(hi|hello|hey|start|menu|get\s*started)\b/i.test(lowerText) ||
    lowerText.includes('saw your ad') ||
    lowerText.includes('welcome to pentacloud') ||
    !!referralHeadline;

  if (isStartKeyword) {
    console.log(`[leadFlowService] Starting new Lead Flow for ${cleanPhone} (Trigger: "${text}")`);
    await sendStep1Welcome(cleanPhone, referralHeadline);
    return true;
  }

  // If no session exists and not a flow trigger, do not intercept
  if (!session) {
    return false;
  }

  // ─── 3. ACTIVE SESSION STATE MACHINE ───
  if (lowerText === 'restart' || lowerText === 'reset') {
    await sendStep1Welcome(cleanPhone, referralHeadline);
    return true;
  }

  // --- STEP 3: Handle Name Capture ---
  if (session.step === 'STEP_NAME') {
    const rawName = text.trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0] || 'Prospect';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Contact';

    session.name = rawName;
    session.step = 'STEP_COMPANY';
    await setFlowSession(cleanPhone, session);

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        FirstName: firstName,
        LastName: lastName,
      });
    }

    await sendStep4AskCompany(cleanPhone, firstName, currentLeadId);
    return true;
  }

  // --- STEP 4: Handle Company Name Capture ---
  if (session.step === 'STEP_COMPANY') {
    const company = text.trim() || 'Pentacloud Prospect';

    session.company = company;
    session.step = 'STEP_REQUIREMENT';
    await setFlowSession(cleanPhone, session);

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        Company: company,
      });
    }

    await sendStep5AskRequirement(cleanPhone, currentLeadId);
    return true;
  }

  // --- STEP 5: Handle Requirement Capture ---
  if (session.step === 'STEP_REQUIREMENT') {
    const requirement = text.trim();

    const fullDescription =
      `Service Interested: ${session.service || 'General'}\n` +
      `Requirement: ${requirement}\n` +
      `Captured via Pentacloud Interactive WhatsApp Flow.`;

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        Description: fullDescription,
        Status: 'Working - Contacted',
      });
    }

    await sendStep6Confirmation(cleanPhone, currentLeadId);
    return true;
  }

  return false;
}
