// import { json } from '@sveltejs/kit';
// import type { RequestHandler } from '@sveltejs/kit';
// import { verifyDelegationToken } from '$lib/auth/offline-tokens';

// export const POST: RequestHandler = async ({ request, platform, cookies }) => {
//   // For now, anyone can POST; later we'll protect with a valid admin session.
//   const db = platform?.env?.DB;
//   if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

//   const { token, newAdminUsername } = await request.json();
//   if (!token || !newAdminUsername) {
//     return json({ error: 'token and newAdminUsername required' }, { status: 400 });
//   }

//   // Parse the payload to find the delegating admin (sub)
// // Parse the payload to find the delegating admin (sub)
//   const parts = token.split('.');
//   if (parts.length !== 3) return json({ error: 'Malformed token' }, { status: 400 });
  
//   let payload: unknown;
//   try {
//     // Convert base64url back to standard base64 before decoding
//     let base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
//     const pad = (4 - (base64Payload.length % 4)) % 4;
//     base64Payload += '='.repeat(pad);

//     payload = JSON.parse(
//       new TextDecoder().decode(Uint8Array.from(atob(base64Payload), c => c.charCodeAt(0)))
//     );
//   } catch (e) {
//     console.error('Failed to parse token payload:', e);
//     return json({ error: 'Invalid token payload' }, { status: 400 });
//   }
  
//   const delegatorUsername = (payload as { sub?: string })?.sub;

//   // Lookup the delegator's stored password hash
//   const delegator = await db.prepare(
//     'SELECT password_hash FROM admins WHERE username = ?'
//   ).bind(delegatorUsername).first<{ password_hash: string | null }>();

//   if (!delegator?.password_hash) {
//     return json({ error: 'Delegator not found or has no password' }, { status: 404 });
//   }

//   // Verify the token
//   const verified = await verifyDelegationToken(token, delegator.password_hash);
//   if (!verified) return json({ error: 'Invalid or expired delegation token' }, { status: 403 });

//   // Add the new user to the allowlist as approved
//   await db.prepare(
//     `INSERT OR IGNORE INTO admin_allowlist (username, email, status, added_by, added_at)
//      VALUES (?, ?, 'approved', ?, unixepoch())`
//   ).bind(newAdminUsername, `${newAdminUsername}@onboarded.local`, delegatorUsername).run();

//   return json({ ok: true });
// };



import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyDelegationToken } from '$lib/auth/offline-tokens';

// 1. Define the expected shape of the request payload
interface ClaimRequestPayload {
  token?: string;
  newAdminUsername?: string;
}

// 2. Removed the unused 'cookies' parameter
export const POST: RequestHandler = async ({ request, platform }) => {
  // For now, anyone can POST; later we'll protect with a valid admin session.
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  // 3. Cast the parsed JSON to our defined interface
  const { token, newAdminUsername } = (await request.json()) as ClaimRequestPayload;
  
  if (!token || !newAdminUsername) {
    return json({ error: 'token and newAdminUsername required' }, { status: 400 });
  }

  // Parse the payload to find the delegating admin (sub)
  const parts = token.split('.');
  if (parts.length !== 3) return json({ error: 'Malformed token' }, { status: 400 });
  
  let payload: unknown;
  try {
    // Convert base64url back to standard base64 before decoding
    let base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64Payload.length % 4)) % 4;
    base64Payload += '='.repeat(pad);

    payload = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(base64Payload), c => c.charCodeAt(0)))
    );
  } catch (e) {
    console.error('Failed to parse token payload:', e);
    return json({ error: 'Invalid token payload' }, { status: 400 });
  }
  
  const delegatorUsername = (payload as { sub?: string })?.sub;

  // Lookup the delegator's stored password hash
  const delegator = await db.prepare(
    'SELECT password_hash FROM admins WHERE username = ?'
  ).bind(delegatorUsername).first<{ password_hash: string | null }>();

  if (!delegator?.password_hash) {
    return json({ error: 'Delegator not found or has no password' }, { status: 404 });
  }

  // Verify the token
  const verified = await verifyDelegationToken(token, delegator.password_hash);
  if (!verified) return json({ error: 'Invalid or expired delegation token' }, { status: 403 });

  // Add the new user to the allowlist as approved
  await db.prepare(
    `INSERT OR IGNORE INTO admin_allowlist (username, email, status, added_by, added_at)
     VALUES (?, ?, 'approved', ?, unixepoch())`
  ).bind(newAdminUsername, `${newAdminUsername}@onboarded.local`, delegatorUsername).run();

  return json({ ok: true });
};