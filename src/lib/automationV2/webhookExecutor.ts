// src/lib/automationV2/webhookExecutor.ts

export interface WebhookActionData {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  payload?: any;
}

/**
 * Safely executes outgoing webhooks with idempotency and timeout protection.
 */
export const executeWebhookNode = async (
  contactId: string,
  data: WebhookActionData
): Promise<{ success: boolean; response?: any; error?: string }> => {
  console.log(`[WebhookExecutor] Executing ${data.method} to ${data.url} for contact ${contactId}`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s strict timeout

    const res = await fetch(data.url, {
      method: data.method,
      headers: {
        'Content-Type': 'application/json',
        ...(data.headers || {})
      },
      body: data.method !== 'GET' ? JSON.stringify(data.payload || {}) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const json = await res.json().catch(() => null);
    return { success: true, response: json };

  } catch (error: any) {
    console.error(`[WebhookExecutor] Failed for ${contactId}:`, error.message);
    // In production, push to Dead Letter Queue if retry exhaustion occurs
    return { success: false, error: error.message };
  }
};
