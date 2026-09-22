/**
 * Central SSE Realtime Message Emitter
 * Broadcasts messages to both per-phone stream and global stream.
 */

export function resolveAppUrl(): string {
  // 1. If NEXT_PUBLIC_APP_URL is set and points to a real domain (not localhost), use it
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitUrl && !explicitUrl.includes('localhost') && !explicitUrl.includes('127.0.0.1')) {
    return explicitUrl.replace(/\/$/, '');
  }

  // 2. On Vercel, use VERCEL_URL (auto-set by Vercel at build/runtime)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl.replace(/\/$/, '') : `https://${vercelUrl}`;
  }

  // 3. Local dev fallback
  return explicitUrl || 'http://localhost:3000';
}

export async function emitRealtimeMessage(phoneNumber: string, message: {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'contact';
  status: string;
  recipientId: string;
  localId?: string;
  mediaType?: string;
  mediaId?: string;
  mediaUrl?: string;
  filename?: string;
}, workspaceId: string) {
  const appUrl = resolveAppUrl();

  const cleanPhone = phoneNumber.replace(/^\+/, '');

  const payload = {
    phoneNumber: cleanPhone,
    message: {
      ...message,
      recipientId: cleanPhone,
    },
    workspaceId,
  };

  try {
    await Promise.all([
      fetch(`${appUrl}/api/messages/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(e => console.warn('[realtime] Per-phone SSE emit error:', e)),
      fetch(`${appUrl}/api/messages/stream/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(e => console.warn('[realtime] Global SSE emit error:', e)),
    ]);
  } catch (err) {
    console.error('[realtime] emitRealtimeMessage failed:', err);
  }
}
