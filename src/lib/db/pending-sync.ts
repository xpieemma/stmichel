import { getLocalDB } from './client';
import { sql } from 'drizzle-orm';

export async function addToQueue(type: string, payload: any) {
  const db = await getLocalDB();
  if (!db) return;
  await db.run(sql`
    INSERT INTO pending_sync (type, payload, created_at, attempts)
    VALUES (${type}, ${JSON.stringify(payload)}, ${Math.floor(Date.now() / 1000)}, 0)
  `);
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await (reg as any).sync.register('sync-events');
  }
}

export async function getPendingOperations() {
  const db = await getLocalDB();
  if (!db) return [];
  const result = await db.all(sql`
    SELECT * FROM pending_sync ORDER BY created_at ASC LIMIT 10
  `);
  return result.map((row: any) => ({ ...row, payload: JSON.parse(row.payload) }));
}

export async function removeFromQueue(id: number) {
  const db = await getLocalDB();
  if (!db) return;
  await db.run(sql`DELETE FROM pending_sync WHERE id = ${id}`);
}
