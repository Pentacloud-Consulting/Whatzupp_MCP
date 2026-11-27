// src/lib/locationService.ts
// Handles automated and agent-initiated sending of the Pentacloud Office Location
// 1. Sends native WhatsApp Location via Meta Graph API
// 2. Saves outbound WhatsApp_Message__c record in Salesforce
// 3. Emits real-time SSE event to LWC chat

import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { emitRealtimeMessage } from '@/lib/realtime';

export const PENTACLOUD_LOCATION = {
  name: 'Pentacloud Consulting',
  address: 'Jagan Arcade, 4th Floor, 1st main Road Post, Anandnagar, RT Nagar, Bengaluru, Karnataka 560032',
  latitude: 13.0227204,
  longitude: 77.595715,
  mapsUrl: 'https://maps.google.com/?q=13.0227204,77.5957150',
};

interface SendLocationParams {
  recipientPhone: string;
  leadId?: string;
  contactId?: string;
  senderName?: string;
}

export async function sendPentacloudLocation(params: SendLocationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { recipientPhone } = params;
  let leadId = params.leadId;
  let contactId = params.contactId;

  if (!recipientPhone) {
    return { success: false, error: 'Recipient phone number is required' };
  }

  const cleanPhone = recipientPhone.replace(/\D/g, '');

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
      console.warn('[locationService] Contact resolution failed:', e);
    }
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  let actualWamid = `wamid.loc.${Date.now()}`;

  // 1. Send native WhatsApp Location pin via Meta Graph API
  if (accessToken && phoneNumberId) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'location',
        location: {
          latitude: PENTACLOUD_LOCATION.latitude,
          longitude: PENTACLOUD_LOCATION.longitude,
          name: PENTACLOUD_LOCATION.name,
          address: PENTACLOUD_LOCATION.address,
        },
      };

      const metaRes = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        actualWamid = metaData.messages?.[0]?.id || actualWamid;
        console.log(`[locationService] Sent native location pin to ${cleanPhone}: ${actualWamid}`);
      } else {
        const err = await metaRes.text();
        console.error('[locationService] Meta location send failed:', err);
      }
    } catch (locErr) {
      console.error('[locationService] Error sending location to Meta:', locErr);
    }
  }

  // 2. Format content for Salesforce storage & Chat display
  const locationContent = `📍 [Location: ${PENTACLOUD_LOCATION.name}]\n${PENTACLOUD_LOCATION.address}\n\nGoogle Maps: ${PENTACLOUD_LOCATION.mapsUrl}`;

  // 3. Save Outbound WhatsApp_Message__c Record in Salesforce
  try {
    await scConnector.saveOutboundMessage({
      messageId: actualWamid,
      recipientPhone: cleanPhone,
      content: locationContent,
      leadId,
      contactId,
      mediaType: 'location',
      status: 'SENT',
    });
    console.log(`[locationService] Saved outbound location record in Salesforce: ${actualWamid}`);
  } catch (recordErr) {
    console.error('[locationService] Failed to save outbound location record in Salesforce:', recordErr);
  }

  // 4. Emit Realtime SSE Event to LWC Chat
  try {
    emitRealtimeMessage(cleanPhone, {
      id: actualWamid,
      content: locationContent,
      timestamp: new Date().toISOString(),
      sender: 'user',
      status: 'SENT',
      recipientId: cleanPhone,
      mediaType: 'location',
    }, 'salescloud-ws-1').catch(e => console.warn('[locationService] SSE emit error:', e));
  } catch (e) {
    // Ignore realtime emit failure
  }

  return { success: true, messageId: actualWamid };
}

