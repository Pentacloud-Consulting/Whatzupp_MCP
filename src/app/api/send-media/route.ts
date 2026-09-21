import { NextResponse } from 'next/server';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';
import { getSfmcAccessToken } from '@/lib/sfmcAuth';
import { sendWhatsAppMessage } from '@/services/whatsappService';
import { SalesCloudConnector } from '@/lib/connectors/salesCloudConnector';
import { writeSentMessage } from '@/lib/sfmcDE';
import { setConversationOwner } from '@/lib/storage/kvStore';
import { getAppEnvVariables } from '@/utils/envVariables';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const phone = formData.get('phone') as string;
    const caption = formData.get('caption') as string || '';
    const workspaceId = formData.get('workspaceId') as string || 'salescloud-ws-1';

    if (!file || !phone) {
      return NextResponse.json({ error: 'Missing file or phone number' }, { status: 400 });
    }

    const { accessToken, phoneNumberId } = await getAppEnvVariables();
    const cleanPhone = phone.replace(/^\+/, '').trim();
    let mediaType = 'document';
    if (file.type.startsWith('image/')) mediaType = 'image';
    else if (file.type.startsWith('video/')) mediaType = 'video';
    else if (file.type.startsWith('audio/')) mediaType = 'audio';

    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const fileName = file.name || `media_${Date.now()}`;
    const fileSize = file.size;

    let contentDocumentId: string | undefined;
    let contentVersionId: string | undefined;
    let assetId: string | undefined;
    let assetCustomerKey: string | undefined;

    // 1. Upload to Workspace Storage
    if (workspaceId === 'salescloud-ws-1') {
      const { access_token, instance_url } = await getSalesCloudAccessToken();
      if (!access_token.startsWith('mock-')) {
        // Upload to Salesforce Files (ContentVersion)
        const cvPayload = {
          Title: fileName,
          PathOnClient: fileName,
          VersionData: base64File,
          Origin: 'H'
        };

        const cvRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/ContentVersion`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cvPayload)
        });

        if (!cvRes.ok) {
          const err = await cvRes.text();
          console.error('[send-media] Failed to upload to Salesforce Files:', err);
          throw new Error('Failed to upload to Salesforce Files');
        }

        const cvData = await cvRes.json();
        contentVersionId = cvData.id;

        // Fetch ContentDocumentId
        const cdQuery = await fetch(`${instance_url}/services/data/v59.0/query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id='${contentVersionId}'`, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const cdData = await cdQuery.json();
        contentDocumentId = cdData.records?.[0]?.ContentDocumentId;
      }
    } else if (workspaceId === 'sfmc-ws-1') {
      const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;
      if (sfmcRestBaseUri) {
        const { access_token } = await getSfmcAccessToken();
        const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
        
        let assetTypeId = 8; // Document
        if (mediaType === 'image') assetTypeId = 23;
        else if (mediaType === 'video') assetTypeId = 21;
        else if (mediaType === 'audio') assetTypeId = 22;

        const assetPayload = {
          name: fileName,
          assetType: { id: assetTypeId },
          fileProperties: { fileName },
          file: base64File
        };

        const assetRes = await fetch(`${baseUri}/asset/v1/content/assets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assetPayload)
        });

        if (!assetRes.ok) {
          const err = await assetRes.text();
          console.error('[send-media] Failed to upload to SFMC Assets:', err);
          throw new Error('Failed to upload to SFMC Assets');
        }

        const assetData = await assetRes.json();
        assetId = assetData.id?.toString();
        assetCustomerKey = assetData.customerKey;
      }
    } else {
      throw new Error(`Unknown workspace ID: ${workspaceId}`);
    }

    // 2. Upload to Meta Graph API
    const metaFormData = new FormData();
    metaFormData.append('messaging_product', 'whatsapp');
    metaFormData.append('file', file);
    
    const metaUrl = `https://graph.facebook.com/v22.0/${phoneNumberId}/media`;
    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: metaFormData
    });
    
    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      console.error('[send-media] Meta Upload Error:', metaData);
      throw new Error(metaData?.error?.message || 'Failed to upload media to Meta');
    }
    const metaMediaId = metaData.id;

    // 3. Send WhatsApp Message
    const waResult = await sendWhatsAppMessage({
      to: cleanPhone,
      message: caption,
      accessToken,
      phoneNumberId,
      mediaId: metaMediaId,
      mediaType: mediaType
    });
    const wamid = waResult.messageId || `wamid.${Date.now()}`;

    // 4. Create Message Record
    if (workspaceId === 'salescloud-ws-1') {
      const scConnector = new SalesCloudConnector();
      await scConnector.saveOutboundMessage({
        messageId: wamid,
        recipientPhone: cleanPhone,
        content: caption || `[Media: ${mediaType}] ${fileName}`,
        mediaType,
        mediaFileName: fileName,
        mediaSize: fileSize,
        contentDocumentId,
        contentVersionId,
        metaMediaId
      });
    } else if (workspaceId === 'sfmc-ws-1') {
      await writeSentMessage({
        WaMid: wamid,
        Phone: cleanPhone,
        MessageContent: caption || `[Media: ${mediaType}] ${fileName}`,
        Status: 'sent',
        SentTime: new Date().toISOString(),
        Source: 'WhatZupp_SFMC_Connector',
        AssetId: assetId,
        AssetCustomerKey: assetCustomerKey,
        MetaMediaId: metaMediaId,
        MediaType: mediaType
      });
      await setConversationOwner(cleanPhone, workspaceId, 'outbound').catch(console.warn);
    }

    return NextResponse.json({ success: true, messageId: wamid });
  } catch (error: any) {
    console.error('[send-media] Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
