// src/lib/interactiveLeadFlowService.ts
// Handles the interactive WhatsApp Click-to-WhatsApp Lead Generation Journey
// State is persisted directly on the Salesforce Lead record (WhatZupp_Labels__c)
// 1. Welcome + Interactive Buttons [Yes, I'm interested | Just exploring]
// 2. Service Selection [Salesforce, Zoho, Digital Marketing, Website/App Dev, Other IT]
// 3. Name Capture
// 4. Company Name Capture
// 5. Requirement Capture
// 6. Final Thank You Confirmation

import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { emitRealtimeMessage } from '@/lib/realtime';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';
import { normalizePhoneNumber } from '@/utils/phone';

export type LeadFlowStep =
  | 'STEP_INTEREST'
  | 'STEP_SERVICE'
  | 'STEP_NAME'
  | 'STEP_COMPANY'
  | 'STEP_REQUIREMENT'
  | 'COMPLETED';

interface SalesforceLeadState {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  step?: LeadFlowStep;
  description?: string;
}

/**
 * Queries Salesforce for the existing Lead and extracts the flow state
 */
async function getLeadFromSalesforce(phone: string): Promise<SalesforceLeadState | null> {
  const cleanPhone = normalizePhoneNumber(phone);
  const safePhone = cleanPhone.replace(/'/g, "\\'");
  const last10 = cleanPhone.slice(-10);

  try {
    const scConnector = new SalesCloudConnector();
    const soql = `SELECT Id, FirstName, LastName, Company, Description, WhatZupp_Labels__c, Status FROM Lead WHERE (Phone = '${safePhone}' OR MobilePhone = '${safePhone}' OR Phone LIKE '%${last10}' OR MobilePhone LIKE '%${last10}') ORDER BY CreatedDate DESC LIMIT 1`;
    const records = await scConnector.execSoql(soql);

    if (records && records.length > 0) {
      const r = records[0];
      let step: LeadFlowStep | undefined = undefined;
      const labels = r.WhatZupp_Labels__c || '';

      if (labels.includes('LEAD_FLOW:STEP_INTEREST')) step = 'STEP_INTEREST';
      else if (labels.includes('LEAD_FLOW:STEP_SERVICE')) step = 'STEP_SERVICE';
      else if (labels.includes('LEAD_FLOW:STEP_NAME')) step = 'STEP_NAME';
      else if (labels.includes('LEAD_FLOW:STEP_COMPANY')) step = 'STEP_COMPANY';
      else if (labels.includes('LEAD_FLOW:STEP_REQUIREMENT')) step = 'STEP_REQUIREMENT';
      else if (labels.includes('LEAD_FLOW:COMPLETED')) step = 'COMPLETED';

      return {
        id: r.Id,
        firstName: r.FirstName,
        lastName: r.LastName,
        company: r.Company && r.Company !== '[Pending]' ? r.Company : undefined,
        step,
        description: r.Description,
      };
    }
  } catch (err) {
    console.error('[leadFlowService] getLeadFromSalesforce error:', err);
  }
  return null;
}

/**
 * Creates or retrieves a Lead in Salesforce for this phone number
 */
async function ensureLead(phone: string, referralHeadline?: string): Promise<string | undefined> {
  const cleanPhone = normalizePhoneNumber(phone);
  const existing = await getLeadFromSalesforce(cleanPhone);
  if (existing?.id) return existing.id;

  try {
    const scConnector = new SalesCloudConnector();
    const source = referralHeadline ? `Instagram Ad: ${referralHeadline.slice(0, 40)}` : 'WhatsApp Lead';
    const newLead = await scConnector.createLead({
      name: 'WhatsApp Prospect',
      phoneNumber: cleanPhone,
      company: '[Pending]',
      labels: 'LEAD_FLOW:STEP_INTEREST',
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
              WhatZupp_Labels__c: 'LEAD_FLOW:STEP_INTEREST',
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
 * Step 1: Send Welcome Message with Interactive Buttons
 */
export async function sendStep1Welcome(phone: string, referralHeadline?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const leadId = await ensureLead(cleanPhone, referralHeadline);

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:STEP_INTEREST',
    });
  }

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
}

/**
 * Step 2: Send Services List
 */
export async function sendStep2Services(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText = "Certainly! We'd be happy to assist you. 😊\nMay I know which service you're looking for?";

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:STEP_SERVICE',
    });
  }

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
}

/**
 * Step 3: Ask Customer Name
 */
export async function sendStep3AskName(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText = 'Thank you for sharing that. May I know your name, please?';

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:STEP_NAME',
    });
  }

  const payload = {
    type: 'text',
    text: { preview_url: false, body: promptText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: promptText, leadId });
}

/**
 * Step 4: Ask Company Name
 */
export async function sendStep4AskCompany(phone: string, customerName: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText = `Thank you, ${customerName}. 😊\nMay I also know the name of your company or business?`;

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:STEP_COMPANY',
    });
  }

  const payload = {
    type: 'text',
    text: { preview_url: false, body: promptText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: promptText, leadId });
}

/**
 * Step 5: Ask Requirement
 */
export async function sendStep5AskRequirement(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const promptText =
    "Could you briefly tell us what you're looking to achieve or what kind of support you need? This will help us connect you with the right team.";

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:STEP_REQUIREMENT',
    });
  }

  const payload = {
    type: 'text',
    text: { preview_url: false, body: promptText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: promptText, leadId });
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

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:COMPLETED',
      Status: 'Working - Contacted',
    });
  }

  const payload = {
    type: 'text',
    text: { preview_url: false, body: confirmText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: confirmText, leadId });
}

/**
 * Handle "Just Exploring" Response
 */
export async function handleJustExploring(phone: string, leadId?: string): Promise<void> {
  const cleanPhone = normalizePhoneNumber(phone);
  const replyText =
    "No problem at all! Feel free to explore our solutions on our website: https://pentacloud.com or message us here anytime you'd like to connect. Have a wonderful day! 😊";

  if (leadId) {
    await updateSalesforceLead(leadId, {
      WhatZupp_Labels__c: 'LEAD_FLOW:JUST_EXPLORING',
      Status: 'Open - Not Contacted',
      Description: 'Inbound lead contacted via WhatsApp, selected "Just Exploring".',
    });
  }

  const payload = {
    type: 'text',
    text: { preview_url: false, body: replyText },
  };

  await sendWhatsAppAndLogToSalesforce({ to: cleanPhone, payload, displayText: replyText, leadId });
}

/**
 * Main Handler called by Webhook on incoming messages
 * State is read directly from the Salesforce Lead record!
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

  // 1. Check if user wants to reset/restart the flow
  if (lowerText === 'restart' || lowerText === 'reset') {
    console.log(`[leadFlowService] Restart requested for ${cleanPhone}`);
    await sendStep1Welcome(cleanPhone, referralHeadline);
    return true;
  }

  // 2. Fetch current Lead state from Salesforce
  const lead = await getLeadFromSalesforce(cleanPhone);
  const currentLeadId = lead?.id || params.leadId;
  const currentStep = lead?.step;

  console.log(`[leadFlowService] Processing for ${cleanPhone}: text="${text}", replyId="${interactiveReplyId}", sfStep="${currentStep}"`);

  // ─── STEP 1 BRANCH: User clicked or typed "Yes, I'm interested" / "Just exploring" ───
  if (interactiveReplyId === 'btn_yes_interested' || lowerText === "yes, i'm interested" || lowerText === 'yes') {
    console.log(`[leadFlowService] Step 1 -> Step 2: User interested (${cleanPhone})`);
    await sendStep2Services(cleanPhone, currentLeadId);
    return true;
  }

  if (interactiveReplyId === 'btn_just_exploring' || lowerText === 'just exploring' || lowerText === 'exploring') {
    console.log(`[leadFlowService] Step 1 -> Exploring (${cleanPhone})`);
    await handleJustExploring(cleanPhone, currentLeadId);
    return true;
  }

  // ─── STEP 2 BRANCH: User selected a service ───
  const isServiceOption =
    interactiveReplyId?.startsWith('srv_') ||
    currentStep === 'STEP_SERVICE' ||
    (currentStep === 'STEP_INTEREST' && (lowerText.includes('salesforce') || lowerText.includes('zoho') || lowerText.includes('marketing') || lowerText.includes('dev')));

  if (isServiceOption) {
    let selectedService = 'Salesforce Services';
    if (interactiveReplyId === 'srv_zoho' || lowerText.includes('zoho')) {
      selectedService = 'Zoho Solutions';
    } else if (interactiveReplyId === 'srv_marketing' || lowerText.includes('marketing')) {
      selectedService = 'Digital Marketing';
    } else if (interactiveReplyId === 'srv_webapp' || lowerText.includes('web') || lowerText.includes('app')) {
      selectedService = 'Website / App Development';
    } else if (interactiveReplyId === 'srv_other' || lowerText.includes('other')) {
      selectedService = 'Other IT Services';
    } else if (text.length > 0) {
      selectedService = text.slice(0, 50);
    }

    console.log(`[leadFlowService] Step 2 -> Step 3: Service selected "${selectedService}" (${cleanPhone})`);

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        Description: `Selected Service: ${selectedService}`,
        WhatZupp_Labels__c: 'LEAD_FLOW:STEP_NAME',
      });
    }

    await sendStep3AskName(cleanPhone, currentLeadId);
    return true;
  }

  // ─── STEP 3 BRANCH: Capturing Customer Name ───
  if (currentStep === 'STEP_NAME') {
    const rawName = text.trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0] || 'Prospect';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Contact';

    console.log(`[leadFlowService] Step 3 -> Step 4: Name captured "${rawName}" (${cleanPhone})`);

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        FirstName: firstName,
        LastName: lastName,
        WhatZupp_Labels__c: 'LEAD_FLOW:STEP_COMPANY',
      });
    }

    await sendStep4AskCompany(cleanPhone, firstName, currentLeadId);
    return true;
  }

  // ─── STEP 4 BRANCH: Capturing Company Name ───
  if (currentStep === 'STEP_COMPANY') {
    const company = text.trim() || 'Pentacloud Prospect';

    console.log(`[leadFlowService] Step 4 -> Step 5: Company captured "${company}" (${cleanPhone})`);

    if (currentLeadId) {
      await updateSalesforceLead(currentLeadId, {
        Company: company,
        WhatZupp_Labels__c: 'LEAD_FLOW:STEP_REQUIREMENT',
      });
    }

    await sendStep5AskRequirement(cleanPhone, currentLeadId);
    return true;
  }

  // ─── STEP 5 BRANCH: Capturing Requirement ───
  if (currentStep === 'STEP_REQUIREMENT') {
    const requirement = text.trim();

    console.log(`[leadFlowService] Step 5 -> Step 6: Requirement captured (${cleanPhone})`);

    if (currentLeadId) {
      const existingDesc = lead?.description ? `${lead.description}\n` : '';
      await updateSalesforceLead(currentLeadId, {
        Description: `${existingDesc}Requirement: ${requirement}\nCaptured via Pentacloud Interactive WhatsApp Flow.`,
        Status: 'Working - Contacted',
        WhatZupp_Labels__c: 'LEAD_FLOW:COMPLETED',
      });
    }

    await sendStep6Confirmation(cleanPhone, currentLeadId);
    return true;
  }

  // ─── NEW USER / TRIGGER KEYWORD: Start Step 1 ───
  const isStartKeyword =
    /^(hi|hello|hey|start|menu|get\s*started)\b/i.test(lowerText) ||
    lowerText.includes('saw your ad') ||
    lowerText.includes('welcome to pentacloud') ||
    !!referralHeadline;

  if (isStartKeyword || !lead) {
    console.log(`[leadFlowService] Starting new Lead Flow for ${cleanPhone} (Trigger: "${text}")`);
    await sendStep1Welcome(cleanPhone, referralHeadline);
    return true;
  }

  return false;
}
