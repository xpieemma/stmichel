import { writable } from 'svelte/store';
import { getLocalDB } from '$lib/db/client';
import { stamps } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const passportCount = writable(0);

function makeNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers — sufficient as an idempotency key
  // when paired with the unique constraint on the server.
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function initPassport() {
  const db = await getLocalDB();
  if (!db) return;
  const result = await db.select().from(stamps).all();
  passportCount.set(result.length);
}

/**
 * Add a stamp for an event. Idempotent at the device level — calling
 * twice for the same event is a no-op (the unique nonce handles
 * server-side dedupe; the eventId check handles client-side).
 */
export async function addStamp(eventId: number) {
  const db = await getLocalDB();
  if (!db) return;

  // Don't double-stamp on the device.
  const existing = await db
    .select()
    .from(stamps)
    .where(eq(stamps.eventId, eventId))
    .all();
  if (existing.length > 0) return;

  await db.insert(stamps).values({
    nonce: makeNonce(),
    eventId,
    earnedAt: Math.floor(Date.now() / 1000),
    synced: 0,
  });

  const result = await db.select().from(stamps).all();
  passportCount.set(result.length);
}

export async function hasStamp(eventId: number): Promise<boolean> {
  const db = await getLocalDB();
  if (!db) return false;
  const result = await db
    .select()
    .from(stamps)
    .where(eq(stamps.eventId, eventId))
    .all();
  return result.length > 0;
}
