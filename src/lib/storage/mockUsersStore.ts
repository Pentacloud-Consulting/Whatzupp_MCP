// src/lib/storage/mockUsersStore.ts
// Persistent mock users store that uses kvStore (Vercel KV / file-based) for durability.
// This ensures users created by tenant admins survive serverless cold starts in production.

import { getConfig, setConfig } from './kvStore';

const KV_KEY = 'mock_users';

// In-memory cache to reduce KV reads within a single invocation
let memoryCache: any[] | null = null;

/**
 * Load users from the persistent KV store.
 * Falls back to an empty array if nothing is stored yet.
 */
async function loadFromKV(): Promise<any[]> {
  if (memoryCache !== null) return memoryCache;
  try {
    const stored = await getConfig(KV_KEY) as any[] | null;
    memoryCache = stored || [];
  } catch {
    memoryCache = [];
  }
  return memoryCache;
}

/**
 * Persist the current users list to KV.
 */
async function saveToKV(users: any[]): Promise<void> {
  memoryCache = users;
  try {
    await setConfig(KV_KEY, users);
  } catch (err) {
    console.error('[mockUsersStore] Failed to persist users to KV:', err);
  }
}

// ─── Synchronous legacy API (still used by login route) ───
// These work from the in-memory cache and are populated on first async call.

const globalForMock = globalThis as unknown as { __mockUsers: any[] | undefined };
const globalMockUsers: any[] = globalForMock.__mockUsers ?? [];
globalForMock.__mockUsers = globalMockUsers;

/**
 * Synchronous getter — returns the in-memory array.
 * For guaranteed up-to-date data, use getMockUsersAsync().
 */
export function getMockUsers(): any[] {
  return globalMockUsers;
}

/**
 * Async getter — loads from KV on first call, then returns cached.
 * Always prefer this in API routes.
 */
export async function getMockUsersAsync(): Promise<any[]> {
  const kvUsers = await loadFromKV();
  // Merge: KV is source of truth, but also include any in-memory users not yet in KV
  const kvIds = new Set(kvUsers.map((u: any) => u.id));
  const extras = globalMockUsers.filter((u: any) => !kvIds.has(u.id));
  if (extras.length > 0) {
    kvUsers.push(...extras);
    await saveToKV(kvUsers);
  }
  // Sync the global in-memory array
  globalMockUsers.length = 0;
  globalMockUsers.push(...kvUsers);
  return globalMockUsers;
}

export async function addMockUser(user: any): Promise<void> {
  const users = await loadFromKV();
  // Prevent duplicates
  const existing = users.findIndex((u: any) => u.id === user.id || u.email === user.email);
  if (existing >= 0) {
    users[existing] = { ...users[existing], ...user };
  } else {
    users.push(user);
  }
  // Also update the synchronous global array
  const gIdx = globalMockUsers.findIndex((u: any) => u.id === user.id || u.email === user.email);
  if (gIdx >= 0) {
    globalMockUsers[gIdx] = { ...globalMockUsers[gIdx], ...user };
  } else {
    globalMockUsers.push(user);
  }
  await saveToKV(users);
}

export async function updateMockUser(userId: string, updates: any): Promise<void> {
  const users = await loadFromKV();
  const user = users.find((u: any) => u.id === userId);
  if (user) {
    Object.assign(user, updates);
    await saveToKV(users);
  }
  // Also update sync array
  const gUser = globalMockUsers.find((u: any) => u.id === userId);
  if (gUser) Object.assign(gUser, updates);
}

export async function deleteMockUser(userId: string): Promise<void> {
  const users = await loadFromKV();
  const index = users.findIndex((u: any) => u.id === userId);
  if (index !== -1) {
    users.splice(index, 1);
    await saveToKV(users);
  }
  // Also update sync array
  const gIdx = globalMockUsers.findIndex((u: any) => u.id === userId);
  if (gIdx !== -1) globalMockUsers.splice(gIdx, 1);
}
