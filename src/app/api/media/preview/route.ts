import { NextResponse } from 'next/server';
import { getSalesCloudAccessToken } from '@/lib/salesCloudAuth';
import { getSfmcAccessToken } from '@/lib/sfmcAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return new NextResponse('Missing messageId', { status: 400 });
    }

    const { access_token, instance_url } = await getSalesCloudAccessToken();
    let workspace = 'salescloud';
    let contentVersionId: string | null = null;
    let assetId: string | null = null;
    
    // 1. Try to find message in Salesforce
    if (!access_token.startsWith('mock-')) {
      const q = `SELECT ContentVersionId__c, Media_Type__c FROM WhatsApp_Message__c WHERE Message_Id__c='${messageId}' LIMIT 1`;
      const res = await fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0 && data.records[0].ContentVersionId__c) {
          contentVersionId = data.records[0].ContentVersionId__c;
          workspace = 'salescloud';
        }
      }
    }

    // 2. Try to find message in SFMC if not found in Salesforce
    if (!contentVersionId) {
      const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI;
      if (sfmcRestBaseUri) {
        const { access_token: sfmcToken } = await getSfmcAccessToken();
        const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
        // We'd have to search both sent and received DEs. Let's do a simple filter query.
        const sfmcRes = await fetch(`${baseUri}/data/v1/customobjectdata/key/WhatsApp_Sent_Messages/rowset?$filter=WaMid%20eq%20'${messageId}'`, {
          headers: { 'Authorization': `Bearer ${sfmcToken}` }
        });
        if (sfmcRes.ok) {
          const sfmcData = await sfmcRes.json();
          const items = sfmcData.items || [];
          if (items.length > 0) {
            const row = items[0];
            const getVal = (r: any, key: string) => r.keys?.[key] || r.values?.[key] || r[key];
            assetId = getVal(row, 'AssetId') || getVal(row, 'assetid');
            if (assetId) workspace = 'sfmc';
          }
        }
      }
    }

    if (!contentVersionId && !assetId) {
      return new NextResponse('Media not found for message', { status: 404 });
    }

    // 3. Fetch Binary and Stream
    let mediaBuffer: ArrayBuffer;
    let contentType = 'application/octet-stream';

    if (workspace === 'salescloud' && contentVersionId) {
      const mediaRes = await fetch(`${instance_url}/services/data/v59.0/sobjects/ContentVersion/${contentVersionId}/VersionData`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (!mediaRes.ok) throw new Error('Failed to fetch from Salesforce Files');
      mediaBuffer = await mediaRes.arrayBuffer();
      contentType = mediaRes.headers.get('content-type') || 'application/octet-stream';
    } else if (workspace === 'sfmc' && assetId) {
      const sfmcRestBaseUri = process.env.SFMC_REST_BASE_URI!;
      const { access_token: sfmcToken } = await getSfmcAccessToken();
      const baseUri = sfmcRestBaseUri.replace(/\/$/, '');
      const assetRes = await fetch(`${baseUri}/asset/v1/content/assets/${assetId}`, {
        headers: { 'Authorization': `Bearer ${sfmcToken}` }
      });
      if (!assetRes.ok) throw new Error('Failed to fetch SFMC Asset');
      const assetData = await assetRes.json();
      const publishedUrl = assetData.fileProperties?.publishedURL || assetData.views?.html?.url;
      
      if (!publishedUrl) throw new Error('No published URL for SFMC Asset');
      
      const fileRes = await fetch(publishedUrl);
      mediaBuffer = await fileRes.arrayBuffer();
      contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    } else {
      throw new Error('Workspace storage missing');
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'private, max-age=86400');
    headers.set('ETag', `"${contentVersionId || assetId}"`);

    return new NextResponse(mediaBuffer, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('[media-preview] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
