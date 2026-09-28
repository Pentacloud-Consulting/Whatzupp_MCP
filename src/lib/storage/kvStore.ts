// src/lib/storage/kvStore.ts
// Universal Storage Adapter for non-customer app config & unmatched queue
// Priority: Vercel KV (Redis) → In-memory (serverless) → Local JSON (dev)

import fs from 'fs';
import path from 'path';
import { normalizePhoneNumber } from '@/utils/phone';

export interface UnmatchedMessage {
  id: string;
  phoneNumber: string;
  content: string;
  timestamp: string;
  status?: 'unmatched' | 'ambiguous';
  candidateWorkspaces?: string[];
  mediaType?: string;
  mediaId?: string;
  filename?: string;
  rawPayload?: Record<string, unknown>;
}

export interface ConversationOwner {
  workspaceId: string;
  updatedAt: string;
  assignedBy?: 'outbound' | 'inbound_match' | 'manual_assignment';
}

// ─── In-memory fallback for serverless (when KV + filesystem are unavailable) ───
const globalForKV = globalThis as unknown as { __kvMemStore: Map<string, string> | undefined };
const memStore: Map<string, string> = globalForKV.__kvMemStore ?? new Map();
globalForKV.__kvMemStore = memStore;

const isVercelKVConfigured = () => !!process.env.KV_REST_API_URL;
const isReadOnlyFS = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');

function ensureDataDirExists() {
  if (isReadOnlyFS) return; // Skip on read-only FS
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore
  }
}

// ─── Low-level KV helpers ───

async function kvGet(key: string): Promise<string | null> {
  // 1. Vercel KV
  if (isVercelKVConfigured()) {
    try {
      const res = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return data.result ?? null;
      }
    } catch (err) {
      console.error('[kvStore] KV GET failed:', err);
    }
  }

  // 2. In-memory (always available)
  const memVal = memStore.get(key);
  if (memVal !== undefined) return memVal;

  // 3. Local filesystem (dev only)
  if (!isReadOnlyFS) {
    ensureDataDirExists();
    const filePath = path.join(DATA_DIR, 'app_config.json');
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const store = JSON.parse(content);
        return store[key] !== undefined ? JSON.stringify(store[key]) : null;
      } catch {
        return null;
      }
    }
  }

  return null;
}

async function kvSet(key: string, value: string): Promise<void> {
  // 1. Vercel KV
  if (isVercelKVConfigured()) {
    try {
      await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        body: JSON.stringify(value),
      });
      // Also update in-memory cache
      memStore.set(key, value);
      return;
    } catch (err) {
      console.error('[kvStore] KV SET failed:', err);
    }
  }

  // 2. In-memory (always works)
  memStore.set(key, value);

  // 3. Local filesystem (dev only)
  if (!isReadOnlyFS) {
    try {
      ensureDataDirExists();
      const filePath = path.join(DATA_DIR, 'app_config.json');
      let store: Record<string, unknown> = {};
      if (fs.existsSync(filePath)) {
        try {
          store = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch { /* ignore */ }
      }
      store[key] = JSON.parse(value);
      fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
    } catch {
      // Ignore filesystem errors
    }
  }
}

// ─── Unmatched Queue ───

let devUnmatchedQueue: UnmatchedMessage[] = [];

export async function getUnmatchedQueue(): Promise<UnmatchedMessage[]> {
  const raw = await kvGet('unmatched_queue');
  if (raw) {
    try { return JSON.parse(raw); } catch { return []; }
  }

  // Legacy dev fallback
  if (!isReadOnlyFS) {
    ensureDataDirExists();
    const filePath = path.join(DATA_DIR, 'unmatched_queue.json');
    if (fs.existsSync(filePath)) {
      try {
        devUnmatchedQueue = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch { devUnmatchedQueue = []; }
    }
    return devUnmatchedQueue;
  }

  return [];
}

export async function pushUnmatched(msg: UnmatchedMessage): Promise<void> {
  const queue = await getUnmatchedQueue();
  const existingIdx = queue.findIndex(item => item.id === msg.id);
  if (existingIdx >= 0) {
    queue[existingIdx] = msg;
  } else {
    queue.push(msg);
  }
  await kvSet('unmatched_queue', JSON.stringify(queue));
}

export async function removeUnmatched(id: string): Promise<boolean> {
  const queue = await getUnmatchedQueue();
  const filtered = queue.filter(item => item.id !== id);
  const wasRemoved = filtered.length < queue.length;
  await kvSet('unmatched_queue', JSON.stringify(filtered));
  return wasRemoved;
}

// ─── Config Store ───

export async function getConfig(key: string): Promise<unknown> {
  const raw = await kvGet(`cfg_${key}`);
  if (raw) {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return null;
}

export async function setConfig(key: string, value: unknown): Promise<void> {
  await kvSet(`cfg_${key}`, JSON.stringify(value));
}

// ─── Conversation Owner ───

export async function getConversationOwner(phone: string): Promise<ConversationOwner | null> {
  const norm = normalizePhoneNumber(phone);
  if (!norm) return null;
  const data = await getConfig(`conversation_owner:${norm}`);
  if (data && typeof data === 'object' && 'workspaceId' in data) {
    return data as ConversationOwner;
  }
  return null;
}

export async function setConversationOwner(
  phone: string,
  workspaceId: string,
  assignedBy: 'outbound' | 'inbound_match' | 'manual_assignment' = 'outbound'
): Promise<void> {
  const norm = normalizePhoneNumber(phone);
  if (!norm || !workspaceId) return;
  const record: ConversationOwner = {
    workspaceId,
    updatedAt: new Date().toISOString(),
    assignedBy,
  };
  await setConfig(`conversation_owner:${norm}`, record);
}
