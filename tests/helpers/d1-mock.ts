/**
 * tests/helpers/d1-mock.ts
 *
 * Tiny in-memory shim that mimics the parts of the D1 API we use:
 *   db.prepare(sql).bind(...).run() / .first() / .all()
 *   db.batch([...statements])
 *
 * Backed by sql.js (pure-WASM SQLite), so tests don't need native
 * extensions and run anywhere Node runs.
 *
 * The shim is deliberately minimal — it only implements what the
 * production code actually calls, so it stays honest about the
 * contract surface.
 */
import initSqlJs from 'sql.js';
import { readFileSync } from 'node:fs';

let SQL: any;

export async function createMockD1() {
  if (!SQL) SQL = await initSqlJs();
  const db = new SQL.Database();

  // Implement the unixepoch() function that D1 provides natively but
  // upstream sqlite-wasm doesn't expose by default at this version.
  // sql.js's underlying SQLite does support it via the standard
  // library; if not, we fall back to registering it.
  try {
    db.exec('SELECT unixepoch()');
  } catch {
    db.create_function('unixepoch', () => Math.floor(Date.now() / 1000));
  }

  return makeD1Wrapper(db);
}

export function makeD1Wrapper(rawDb: any) {
  return {
    _raw: rawDb,
    prepare(sql: string) {
      const params: any[] = [];
      return {
        bind(...args: any[]) {
          params.push(...args);
          return this;
        },
        async run() {
          const stmt = rawDb.prepare(sql);
          stmt.run(params);
          stmt.free();
          return { success: true };
        },
        async first<T = any>(): Promise<T | null> {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params);
          const row = stmt.step() ? (stmt.getAsObject() as T) : null;
          stmt.free();
          return row;
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const stmt = rawDb.prepare(sql);
          stmt.bind(params);
          const rows: T[] = [];
          while (stmt.step()) rows.push(stmt.getAsObject() as T);
          stmt.free();
          return { results: rows };
        }
      };
    },
    async batch(statements: any[]) {
      // D1 .batch() runs all statements in a single transaction.
      rawDb.exec('BEGIN');
      try {
        for (const s of statements) await s.run();
        rawDb.exec('COMMIT');
      } catch (e) {
        rawDb.exec('ROLLBACK');
        throw e;
      }
      return statements.map(() => ({ success: true }));
    }
  };
}

export function loadMigrations(d1: any, paths: string[]) {
  for (const p of paths) {
    const sql = readFileSync(p, 'utf8');
    d1._raw.exec(sql);
  }
}
