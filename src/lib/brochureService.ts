// src/lib/brochureService.ts
// Handles automated and agent-initiated sending of the Pentacloud Brochure (PDF)
// 1. Sends PDF via Meta WhatsApp Graph API
// 2. Uploads/Links PDF to Salesforce Files (ContentVersion)
// 3. Updates Lead Brochure_Downloaded__c = true in Salesforce
// 4. Creates outbound WhatsApp_Message__c record
// 5. Emits real-time SSE event to LWC chat

import fs from 'fs';
import path from 'path';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { emitRealtimeMessage } from '@/lib/realtime';

interface SendBrochureParams {
  recipientPhone: string;
  leadId?: string;
  contactId?: string;
  senderName?: string;
  caption?: string;
}

// In-memory cache for Meta Media ID so we don't re-upload 3MB on every send
let cachedMetaMediaId: { id: string; expiresAt: number } | null = null;

export async function sendPentacloudBrochure(params: SendBrochureParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { recipientPhone, senderName } = params;
  let leadId = params.leadId;
  let contactId = params.contactId;

  if (!recipientPhone) {
    return { success: false, error: 'Recipient phone number is required' };
  }

  const cleanPhone = recipientPhone.replace(/\D/g, '');
  const fileName = 'Pentacloud_Brochure.pdf';
  const customCaption = params.caption || 'Hello! Here is the Pentacloud Consulting Brochure. Please feel free to reach out if you have any questions!';

  // Locate the PDF file on disk
  const possiblePaths = [
    path.resolve(process.cwd(), 'Pentacloud_Brochure.pdf'),
    path.resolve(process.cwd(), 'public', 'Pentacloud_Brochure.pdf'),
  ];

  let filePath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.error('[brochureService] Pentacloud_Brochure.pdf file not found on disk');
    return { success: false, error: 'Brochure PDF file not found on server' };
  }

  const fileBuffer = fs.readFileSync(filePath);
  const base64File = fileBuffer.toString('base64');

  // Dynamically resolve leadId or contactId if not provided
  const scConnector = new SalesCloudConnector();
  if (!leadId && !contactId) {
    try {
      const contact = await scConnector.findContact({ phoneNumber: cleanPhone });
      if (contact && contact.salesforceRecordId) {
        if (contact.salesforceObjectType === 'Lead') leadId = contact.salesforceRecordId;
        else if (contact.salesforceObjectType === 'Contact') contactId = contact.salesforceRecordId;
      }
    } catch (e) {
      console.warn('[brochureService] Contact resolution failed:', e);
    }
  }

  // Retrieve token & phone number ID for Meta API
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  let metaMediaId = '';

  // 1. Upload to Meta Graph API (or reuse valid cached ID)
  if (cachedMetaMediaId && Date.now() < cachedMetaMediaId.expiresAt) {
    metaMediaId = cachedMetaMediaId.id;
  } else if (accessToken && phoneNumberId) {
    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      formData.append('file', blob, fileName);

      const metaRes = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        metaMediaId = metaData.id;
        // Cache for 24 hours (Meta media IDs valid for 30 days)
        cachedMetaMediaId = { id: metaMediaId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
        console.log(`[brochureService] Uploaded brochure to Meta media ID: ${metaMediaId}`);
      } else {
        const err = await metaRes.text();
        console.error('[brochureService] Meta media upload failed:', err);
      }
    } catch (uploadErr) {
      console.error('[brochureService] Error uploading brochure to Meta:', uploadErr);
    }
  }

  // 2. Send WhatsApp Document Message
  let actualWamid = `wamid.brochure.${Date.now()}`;
  try {
    const sendResult = await sendWhatsAppMessage({
      to: cleanPhone,
      message: customCaption,
      accessToken,
      phoneNumberId,
      mediaId: metaMediaId || undefined,
      mediaType: 'document',
      filename: fileName,
    });

    if (sendResult.messageId) {
      actualWamid = sendResult.messageId;
    }
    console.log(`[brochureService] WhatsApp document sent to ${cleanPhone}: ${actualWamid}`);
  } catch (sendErr) {
    console.error('[brochureService] WhatsApp send message failed:', sendErr);
  }

  // 3. Upload to Salesforce Files & Update Lead
  let contentVersionId: string | undefined;
  let contentDocumentId: string | undefined;

  try {
    const { access_token, instance_url } = await getSalesCloudAccessToken();
    if (access_token && !access_token.startsWith('mock-')) {
      // 3a. Re-use existing ContentVersion in Salesforce Files if present, avoiding storage limit exhaustion
      const existQuery = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT+Id,+ContentDocumentId+FROM+ContentVersion+WHERE+Title='Pentacloud+Consulting+Brochure'+AND+IsLatest=true+ORDER+BY+CreatedDate+DESC+LIMIT+1`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (existQuery.ok) {
        const existData = await existQuery.json();
        if (existData.records && existData.records.length > 0) {
          contentVersionId = existData.records[0].Id;
          contentDocumentId = existData.records[0].ContentDocumentId;
          console.log(`[brochureService] Reusing existing Salesforce File: ContentVersion=${contentVersionId}, ContentDocument=${contentDocumentId}`);

          // Link to Lead or Contact via ContentDocumentLink if not already linked
          const targetId = leadId || contactId;
          if (targetId && contentDocumentId) {
            try {
              const linkCheck = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT+Id+FROM+ContentDocumentLink+WHERE+ContentDocumentId='${contentDocumentId}'+AND+LinkedEntityId='${targetId}'+LIMIT+1`, {
                headers: { Authorization: `Bearer ${access_token}` },
              });
              if (linkCheck.ok) {
                const linkData = await linkCheck.json();
                if (!linkData.records || linkData.records.length === 0) {
                  await fetch(`${instance_url}/services/data/v59.0/sobjects/ContentDocumentLink`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${access_token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      ContentDocumentId: contentDocumentId,
                      LinkedEntityId: targetId,
                      ShareType: 'V',
                      Visibility: 'AllUsers',
                    }),
                  });
                  console.log(`[brochureService] Linked existing brochure ContentDocument ${contentDocumentId} to ${targetId}`);
                }
              }
            } catch (linkErr) {
              console.warn('[brochureService] ContentDocumentLink creation warning:', linkErr);
            }
          }
        }
      }

      // If no file exists yet, upload ContentVersion as fallback
      if (!contentVersionId) {
        const cvPayload = {
          Title: 'Pentacloud Consulting Brochure',
          PathOnClient: fileName,
          VersionData: base64File,
          Origin: 'H',
          FirstPublishLocationId: leadId || contactId || undefined,
        };

        const cvRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/ContentVersion`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cvPayload),
        });

        if (cvRes.ok) {
          const cvData = await cvRes.json();
          contentVersionId = cvData.id;

          const cdQuery = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id='${contentVersionId}'`, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          if (cdQuery.ok) {
            const cdData = await cdQuery.json();
            contentDocumentId = cdData.records?.[0]?.ContentDocumentId;
          }
          console.log(`[brochureService] Created Salesforce File: ContentVersion=${contentVersionId}, ContentDocument=${contentDocumentId}`);
        }
      }

      // 3b. Update Brochure_Downloaded__c = true on Lead
      if (leadId) {
        const updateLeadRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/Lead/${leadId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Brochure_Downloaded__c: true,
          }),
        });

        if (updateLeadRes.ok || updateLeadRes.status === 204) {
          console.log(`[brochureService] Successfully marked Brochure_Downloaded__c = true for Lead ${leadId}`);
        } else {
          console.warn(`[brochureService] Could not update Brochure_Downloaded__c on Lead ${leadId}:`, await updateLeadRes.text());
        }
      }
    }
  } catch (sfErr) {
    console.error('[brochureService] Salesforce update/file upload error:', sfErr);
  }

  // 4. Save Outbound WhatsApp_Message__c Record in Salesforce
  const mediaContent = `[Media: document: ${metaMediaId || 'brochure'}] ${fileName}\n${customCaption}`;
  try {
    await scConnector.saveOutboundMessage({
      messageId: actualWamid,
      recipientPhone: cleanPhone,
      content: mediaContent,
      leadId,
      contactId,
      mediaType: 'document',
      contentDocumentId,
      contentVersionId,
      metaMediaId,
      status: 'SENT',
    });
    console.log(`[brochureService] Saved outbound message record in Salesforce: ${actualWamid}`);
  } catch (recordErr) {
    console.error('[brochureService] Failed to save outbound message record:', recordErr);
  }

  // 5. Emit Realtime SSE Event to LWC Chat
  try {
    emitRealtimeMessage(cleanPhone, {
      id: actualWamid,
      content: mediaContent,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: 'SENT',
      recipientId: cleanPhone,
      mediaType: 'document',
      filename: fileName,
    }, 'salescloud-ws-1').catch(e => console.warn('[brochureService] SSE emit error:', e));
  } catch (e) {
    // Ignore realtime emit failure
  }

  return { success: true, messageId: actualWamid };
}
