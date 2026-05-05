import { syncFromServer } from '$lib/db/sync';

let syncing = false;

export async function safeSync() {
  if (syncing || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  syncing = true;
  try {
    await syncFromServer();
  } catch (e) {
    console.warn('Sync failed', e);
  } finally {
    syncing = false;
  }
}

export function startBackgroundSync() {
  if (typeof window === 'undefined') return;
  setInterval(() => safeSync(), 5 * 60 * 1000);
  window.addEventListener('online', () => safeSync());
}
