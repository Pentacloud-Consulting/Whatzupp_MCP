// src/lib/sfmcDE.ts
// Helper functions for writing WhatsApp message data to SFMC Data Extensions
// Uses the SFMC REST API (async upsert) with the cached OAuth2 token

import { getSfmcAccessToken } from './sfmcAuth';

// ----- Types -----

interface SentMessageRow {
  WaMid: string;
  ContactKey?: string;
  Phone: string;
  TemplateName?: string;
  Language?: string;
  Parameters?: string;
  MessageContent?: string;
  Status: string;
  SentTime?: string;
  DeliveredTime?: string;
  ReadTime?: string;
  FailedReason?: string;
  JourneyName?: string;
  Source?: string;
  Logs?: string;
  AssetId?: string;
  AssetCustomerKey?: string;
  MetaMediaId?: string;
  MediaType?: string;
}

interface ReceivedMessageRow {
  WaMid: string;
  Phone: string;
  ContactName?: string;
  MessageType?: string;
  MessageContent?: string;
  MediaUrl?: string; // deprecated, use permanent identifiers
  ReceivedTime: string;
  AssetId?: string;
  AssetCustomerKey?: string;
  MetaMediaId?: string;
}

interface StatusUpdateRow {
  WaMid: string;
  Status: string;
  DeliveredTime?: string;
  ReadTime?: string;
  FailedReason?: string;
  Logs?: string;
}

// ----- Internal Helper -----

/**
 * Upserts a row into an SFMC Data Extension by external key.
 * Uses the async rows endpoint for better performance.
 * 
 * @param deExternalKey - The external key of the Data Extension
 * @param keys - Primary key fields (e.g. { WaMid: "wamid.xxx" })
 * @param values - Non-key field values to upsert
 */
async function upsertDeRow(
  deExternalKey: string,
  keys: Record<string, string>,
  values: Record<string, string>
): Promise<void> {
  const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;

  if (!sfmcRestBaseUri) {
    console.warn(`[SFMC DE] SFMC_REST_BASE_URI not configured — skipping write to ${deExternalKey}`);
    return;
  }

  const { access_token } = await getSfmcAccessToken();

  // Clean up trailing slash from base URI if it exists
  const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
  const url = `${baseUri}/hub/v1/dataevents/key:${deExternalKey}/rowset`;

  // Payload for the synchronous rowset endpoint is a direct array
  const payload = [
    {
      keys,
      values,
    },
  ];

  console.log(`[SFMC DE] Upserting to ${deExternalKey} synchronously: keys=${JSON.stringify(keys)}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[SFMC DE] Upsert failed (${response.status}):`, errorText);
    throw new Error(`SFMC DE upsert failed (${response.status}): ${errorText}`);
  }

  console.log(`[SFMC DE] Successfully wrote to ${deExternalKey}`);
}

// ----- Public Functions -----

/**
 * Write a sent message (outbound) to WhatsApp_Sent_Messages DE.
 * Called after a template message is successfully sent via Meta API.
 */
export async function writeSentMessage(row: SentMessageRow): Promise<void> {
  const keys = { WaMid: row.WaMid };

  // Build values object, omitting undefined fields
  const values: Record<string, string> = {};
  if (row.ContactKey) values.ContactKey = row.ContactKey;
  values.Phone = row.Phone;
  if (row.TemplateName) values.TemplateName = row.TemplateName;
  if (row.Language) values.Language = row.Language;
  if (row.Parameters) values.Parameters = row.Parameters;
  if (row.MessageContent) values.MessageContent = row.MessageContent;
  values.Status = row.Status;
  if (row.SentTime) values.SentTime = row.SentTime;
  if (row.DeliveredTime) values.DeliveredTime = row.DeliveredTime;
  if (row.ReadTime) values.ReadTime = row.ReadTime;
  if (row.FailedReason) values.FailedReason = row.FailedReason;
  if (row.JourneyName) values.JourneyName = row.JourneyName;
  if (row.Source) values.Source = row.Source;
  if (row.AssetId) values.AssetId = row.AssetId;
  if (row.AssetCustomerKey) values.AssetCustomerKey = row.AssetCustomerKey;
  if (row.MetaMediaId) values.MetaMediaId = row.MetaMediaId;
  if (row.MediaType) values.MediaType = row.MediaType;
  
  // Set summary log
  values.Logs = row.Status === 'failed' ? 'Failed' : 'Success';

  await upsertDeRow('WhatsApp_Sent_Messages', keys, values);
}

/**
 * Write a received message (inbound) to WhatsApp_Received_Messages DE.
 * Called when the webhook receives an incoming message from a user.
 */
export async function writeReceivedMessage(row: ReceivedMessageRow): Promise<void> {
  const keys = { WaMid: row.WaMid };

  const values: Record<string, string> = {};
  values.Phone = row.Phone;
  if (row.ContactName) values.ContactName = row.ContactName;
  if (row.MessageType) values.MessageType = row.MessageType;
  if (row.MessageContent) values.MessageContent = row.MessageContent;
  if (row.MediaUrl) values.MediaUrl = row.MediaUrl;
  if (row.AssetId) values.AssetId = row.AssetId;
  if (row.AssetCustomerKey) values.AssetCustomerKey = row.AssetCustomerKey;
  if (row.MetaMediaId) values.MetaMediaId = row.MetaMediaId;
  values.ReceivedTime = row.ReceivedTime;

  await upsertDeRow('WhatsApp_Received_Messages', keys, values);
}

/**
 * Update the delivery status of a sent message in WhatsApp_Sent_Messages DE.
 * Called when the webhook receives a status callback (sent/delivered/read/failed).
 */
export async function updateSentMessageStatus(row: StatusUpdateRow): Promise<void> {
  const keys = { WaMid: row.WaMid };

  const values: Record<string, string> = {};
  values.Status = row.Status;
  if (row.DeliveredTime) values.DeliveredTime = row.DeliveredTime;
  if (row.ReadTime) values.ReadTime = row.ReadTime;
  if (row.FailedReason) values.FailedReason = row.FailedReason;

  // Update summary log
  values.Logs = row.Status === 'failed' ? 'Failed' : 'Success';

  await upsertDeRow('WhatsApp_Sent_Messages', keys, values);
}

/**
 * Log an opt-out (or opt-in) action based on a keyword reply (e.g., "STOP")
 * DE: WhatsApp_OptOuts
 * Keys: Phone
 * Values: Action, Timestamp
 */
export async function writeOptOutStatus(phone: string, action: string) {
  if (!phone) return;
  
  const timestamp = new Date().toISOString();
  
  const keys = { Phone: phone };
  const values = {
    Action: action,
    Timestamp: timestamp
  };

  await upsertDeRow('WhatsApp_OptOuts', keys, values);
}
