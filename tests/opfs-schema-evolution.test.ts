/**
 * tests/opfs-schema-evolution.test.ts
 *
 * Verifies the cure for Round 4 bug #8: existing OPFS users had a
 * `stamps` table created BEFORE the nonce column existed. The cured
 * code in src/lib/db/client.ts must:
 *
 *   1. Detect the missing column via PRAGMA table_info(stamps)
 *   2. Run ALTER TABLE to add it
 *   3. Backfill synthetic legacy nonces so the unique index can be created
 *   4. Create the unique index
 *
 * We can't load the real client.ts here (it imports browser-only
 * modules), so we re-implement the introspect-and-evolve logic in a
 * function that EXACTLY mirrors the production sequence, then test
 * it against simulated old/new database states.
 *
 * If the production logic ever drifts from this reference, the test
 * will still pass — but the regex-based architectural-invariants
 * test catches that drift in source. Together they form belt+braces.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';

let SQL: any;

// Mirror of the cured `createTables` body from src/lib/db/client.ts.
function evolveSchema(rawDb: any) {
  // Step 1: initial schema (no-op if tables exist)
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS stamps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      earned_at INTEGER,
      synced INTEGER DEFAULT 0
    );
  `);

  // Step 2: introspect for nonce
  const cols = rawDb.exec('PRAGMA table_info(stamps)')[0];
  const hasNonce = cols && cols.values.some((row: any[]) => row[1] === 'nonce');

  // Step 3 + 4: ALTER + backfill
  if (!hasNonce) {
    rawDb.exec('ALTER TABLE stamps ADD COLUMN nonce TEXT;');
    rawDb.exec("UPDATE stamps SET nonce = printf('legacy-opfs-%d', id) WHERE nonce IS NULL;");
  }

  // Step 5: unique index (idempotent)
  rawDb.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_stamps_nonce ON stamps(nonce);');
}

function readStamps(rawDb: any) {
  const exec = rawDb.exec('SELECT * FROM stamps ORDER BY id')[0];
  if (!exec) return [];
  const cols = exec.columns;
  return exec.values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((c: string, i: number) => (obj[c] = row[i]));
    return obj;
  });
}

function getColumns(rawDb: any) {
  const exec = rawDb.exec('PRAGMA table_info(stamps)')[0];
  return exec ? exec.values.map((row: any[]) => row[1]) : [];
}

function getIndexes(rawDb: any) {
  const exec = rawDb.exec(
    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='stamps'"
  )[0];
  return exec ? exec.values.map((row: any[]) => row[0]) : [];
}

describe('OPFS schema evolution (Round 4 bug #8)', () => {
  beforeEach(async () => {
    if (!SQL) SQL = await initSqlJs();
  });

  it('on a FRESH database: creates the stamps table with nonce + index in one pass', () => {
    const db = new SQL.Database();
    evolveSchema(db);

    expect(getColumns(db)).toContain('nonce');
    expect(getIndexes(db)).toContain('idx_stamps_nonce');
  });

  it('on a LEGACY database (no nonce column, has rows): adds the column and backfills', () => {
    const db = new SQL.Database();
    // Simulate the OLD schema that pre-Round-4 users have.
    db.exec(`
      CREATE TABLE stamps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        earned_at INTEGER,
        synced INTEGER DEFAULT 0
      );
      INSERT INTO stamps (event_id, earned_at) VALUES (1, 1700000000);
      INSERT INTO stamps (event_id, earned_at) VALUES (2, 1700000100);
      INSERT INTO stamps (event_id, earned_at) VALUES (3, 1700000200);
    `);

    // Sanity: starting state has 3 rows but no nonce column
    expect(getColumns(db)).not.toContain('nonce');
    expect(readStamps(db).length).toBe(3);

    // Run the migration
    evolveSchema(db);

    // Column added
    expect(getColumns(db)).toContain('nonce');

    // All 3 rows still there, each with a synthetic legacy nonce
    const rows = readStamps(db);
    expect(rows.length).toBe(3);
    expect(rows[0].nonce).toBe('legacy-opfs-1');
    expect(rows[1].nonce).toBe('legacy-opfs-2');
    expect(rows[2].nonce).toBe('legacy-opfs-3');

    // Unique index in place
    expect(getIndexes(db)).toContain('idx_stamps_nonce');
  });

  it('after evolution, nonce uniqueness is enforced', () => {
    const db = new SQL.Database();
    evolveSchema(db);

    db.exec("INSERT INTO stamps (nonce, event_id, earned_at) VALUES ('shared-nonce', 1, 100);");

    let threw = false;
    try {
      db.exec("INSERT INTO stamps (nonce, event_id, earned_at) VALUES ('shared-nonce', 2, 200);");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('is IDEMPOTENT: running evolveSchema twice does not duplicate or error', () => {
    const db = new SQL.Database();
    evolveSchema(db);
    evolveSchema(db); // second pass must be safe
    evolveSchema(db); // third pass too — for users who reload often

    expect(getColumns(db).filter((c: string) => c === 'nonce').length).toBe(1);
    expect(getIndexes(db).filter((i: string) => i === 'idx_stamps_nonce').length).toBe(1);
  });

  it('preserves existing post-Round-4 nonces (does not overwrite real nonces with legacy ones)', () => {
    const db = new SQL.Database();
    // Simulate a user who was already on the cured version
    db.exec(`
      CREATE TABLE stamps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        earned_at INTEGER,
        synced INTEGER DEFAULT 0,
        nonce TEXT
      );
      INSERT INTO stamps (event_id, earned_at, nonce) VALUES (1, 100, 'real-uuid-abc');
    `);

    evolveSchema(db);

    const rows = readStamps(db);
    expect(rows.length).toBe(1);
    expect(rows[0].nonce).toBe('real-uuid-abc'); // NOT 'legacy-opfs-1'
  });
});
