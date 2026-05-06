import { getLocalDB } from '$lib/db/client';
import { hashPassword, FIXED_SALT_U8 } from './crypto';
import { sql } from 'drizzle-orm';

/**
 * Ensure the auth_vault table exists in OPFS.
 */
async function ensureVaultTable() {
  const db = await getLocalDB();
  if (db) {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS auth_vault (
        username TEXT PRIMARY KEY,
        master_hash TEXT NOT NULL,
        decoy_hash TEXT
      )
    `);
  }
}

/**
 * Store the master hash after a successful online login.
 */
export async function storeMasterHash(username: string, hash: string) {
  await ensureVaultTable();
  const db = await getLocalDB();
  if (db) {
    await db.run(
      sql`INSERT OR REPLACE INTO auth_vault (username, master_hash) VALUES (${username}, ${hash})`
    );
  }
}

/**
 * Store a decoy password hash locally. Never transmitted.
 */
export async function setDecoyPassword(username: string, password: string) {
  await ensureVaultTable();
  const db = await getLocalDB();
  if (!db) return;
  const hash = await hashPassword(password, FIXED_SALT_U8);
  await db.run(
    sql`UPDATE auth_vault SET decoy_hash = ${hash} WHERE username = ${username}`
  );
}

/**
 * Check a password against local vault and return the role.
 * Returns 'admin' if master matches, 'decoy' if decoy matches, or null.
 */
export async function checkLocalLogin(username: string, password: string): Promise<'admin' | 'decoy' | null> {
  await ensureVaultTable();
  const db = await getLocalDB();
  if (!db) return null;
  const row = await db.get<{
    master_hash: string;
    decoy_hash: string;
  }>(
    sql`SELECT master_hash, decoy_hash FROM auth_vault WHERE username = ${username}`
  );
  if (!row) return null;
  const candidateHash = await hashPassword(password, FIXED_SALT_U8);
  if (candidateHash === row.master_hash) return 'admin';
  if (candidateHash === row.decoy_hash) return 'decoy';
  return null;
}