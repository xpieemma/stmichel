#!/usr/bin/env node
/**
 * scripts/grant-admin.js
 *
 * Engineer-side tool to grant admin access to a user. Approves an
 * email in the allowlist AND optionally pre-sets a password so the
 * user can log in immediately (then change it via the UI).
 *
 * Usage:
 *   node scripts/grant-admin.js <email> [password] [--remote]
 *
 * Examples:
 *   node scripts/grant-admin.js alice@example.com
 *     → adds alice to allowlist as 'approved', no password set
 *
 *   node scripts/grant-admin.js bob@example.com 'temp-pass-1234'
 *     → adds bob, sets password (he should change it after login)
 *
 *   node scripts/grant-admin.js carol@example.com 'pw' --remote
 *     → run against PRODUCTION D1 (use with care)
 *
 * The script invokes wrangler d1 execute under the hood. All hashing
 * happens locally (Node's webcrypto.subtle), so the cleartext password
 * never leaves your machine.
 */
import { execSync } from 'node:child_process';
import { webcrypto } from 'node:crypto';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const positional = args.filter((a) => !a.startsWith('--'));
const [email, password] = positional;

if (!email) {
  console.error('Usage: node scripts/grant-admin.js <email> [password] [--remote]');
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`Not a valid email: ${email}`);
  process.exit(1);
}

const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
const flag = remote ? '--remote' : '--local';
const dbName = 'stmichel-festival-db';


// Escape single quotes for SQL string literals. We have to embed
// values in the SQL because wrangler d1 execute doesn't accept
// parameter binding via CLI. The escape is rigorous: single quote
// becomes two single quotes (SQL standard), and we reject NUL bytes
// because they break SQLite. This is sufficient defense for the
// engineer-internal CLI; user-facing endpoints use proper .bind().
function sqlQuote(value) {
  if (value === null || value === undefined) return 'NULL';
  const s = String(value);
  if (s.includes('\0')) {
    throw new Error('Refusing to embed NUL byte in SQL');
  }
  return "'" + s.replace(/'/g, "''") + "'";
}

function run(sql) {
  const cmd = `npx wrangler d1 execute ${dbName} ${flag} --command ${JSON.stringify(sql)}`;
  console.log(`> ${cmd.slice(0, 120)}${cmd.length > 120 ? '…' : ''}`);
  execSync(cmd, { stdio: 'inherit' });
}

// 1) Allowlist row (idempotent)
run(`INSERT OR IGNORE INTO admin_allowlist (username, email, note, added_by, status)
     VALUES (${sqlQuote(username)}, ${sqlQuote(email)}, 'Granted by engineer', 'engineer-cli', 'approved')`);
run(`UPDATE admin_allowlist SET status='approved', email=${sqlQuote(email)}
     WHERE username=${sqlQuote(username)}`);

if (!password) {
  console.log(`\n✓ ${email} is approved. They can register their own credential at /admin/login.`);
  process.exit(0);
}

// 2) Password hash (PBKDF2-SHA256, 310k iters — matches /admin/api/password/register)
const ITERATIONS = 310_000;
const saltBytes = webcrypto.getRandomValues(new Uint8Array(16));
const enc = new TextEncoder();
const key = await webcrypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: ITERATIONS },
  key,
  256
);
const hashB64 = Buffer.from(bits).toString('base64');
const saltB64 = Buffer.from(saltBytes).toString('base64');

// 3) Insert/update admin row with email + hash
run(`INSERT INTO admins (username, email, credential_id, public_key, counter, password_hash, password_salt, password_iterations, created_at)
     VALUES (${sqlQuote(username)}, ${sqlQuote(email)}, NULL, NULL, 0, ${sqlQuote(hashB64)}, ${sqlQuote(saltB64)}, ${ITERATIONS}, unixepoch())
     ON CONFLICT(username) DO UPDATE SET
       email = ${sqlQuote(email)},
       password_hash = ${sqlQuote(hashB64)},
       password_salt = ${sqlQuote(saltB64)},
       password_iterations = ${ITERATIONS}`);

console.log(`\n✓ ${email} can now log in with the password you provided.`);
console.log(`  Login URL: /admin/login`);
console.log(`  Tell them to change it after first login.`);
