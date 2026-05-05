// import { json } from '@sveltejs/kit';
// import type { RequestHandler } from './$types';
// import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server';
// import { env as publicEnv } from '$env/dynamic/public';
// import { dev } from '$app/environment';
// import { issueSessionCookie } from '$lib/server/admin-session';
// import { env as privateEnv } from '$env/dynamic/private';

// function resolveRpId(reqUrl: URL): string {
//   const fromEnv = publicEnv.PUBLIC_RP_ID;
//   if (fromEnv) return fromEnv;
//   return reqUrl.hostname || 'localhost';
// }

// export const POST: RequestHandler = async ({ request, platform, cookies, url }) => {
//   const rpID = resolveRpId(url);
//   const db = platform?.env?.DB;
//   const kv = platform?.env?.KV;
//   if (!db || !kv) return json({ error: 'Unavailable' }, { status: 500 });

//   const body = await request.json();
//   const { username, response, mode } = body;

//   const origin = request.headers.get('origin') ||
//     (dev ? 'http://localhost:5173' : `https://${rpID}`);

//   const storedChallenge = await kv.get(`challenge:${username}`);
//   if (!storedChallenge) return json({ error: 'Challenge expired' }, { status: 400 });

//   try {
//     if (mode === 'register') {
//       // Allowlist gate: only pre-authorized usernames may register.
//       // The allowlist is seeded via migrations/009 and maintained by
//       // existing admins via direct D1 writes (no admin UI for this
//       // by design — adding an admin is a deliberate out-of-band act).
//       // const allowed = await db
//       //   .prepare('SELECT username FROM admin_allowlist WHERE username = ?')
//       //   .bind(username)
//       //   .first();
//       // if (!allowed) {
//       //   return json({ error: 'Non itilizatè sa a pa otorize' }, { status: 403 });
//       // }

//       const isEmail = typeof username === 'string' && username.includes('@');
// const allowed = await db
//   .prepare(
//     isEmail
//       ? 'SELECT username FROM admin_allowlist WHERE email = ?'
//       : 'SELECT username FROM admin_allowlist WHERE username = ?'
//   )
//   .bind(username)
//   .first<{ username: string }>();

// if (!allowed) {
//   return json({ error: 'Non itilizatè sa a pa otorize' }, { status: 403 });
// }
//       const existing = await db
//         .prepare('SELECT username FROM admins WHERE username = ?')
//         .bind(username)
//         .first();
//       if (existing) return json({ error: 'Non itilizatè sa a deja egziste' }, { status: 400 });

//       const verification = await verifyRegistrationResponse({
//         response,
//         expectedChallenge: storedChallenge,
//         expectedOrigin: origin,
//         expectedRPID: rpID,
//       });
//       if (verification.verified && verification.registrationInfo) {
//         await db
//           .prepare(
//             `INSERT INTO admins (username, credential_id, public_key, counter, created_at) VALUES (?, ?, ?, 0, unixepoch())`
//           )
//           .bind(
//             username,
//             verification.registrationInfo.credentialID,
//             Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64')
//           )
//           .run();
//         await kv.delete(`challenge:${username}`);
//         await issueSessionCookie(cookies, username, privateEnv.ADMIN_SESSION_SECRET || '', dev);
//         return json({ verified: true });
//       }
//     } else {
//       const admin = await db
//         .prepare('SELECT credential_id, public_key, counter FROM admins WHERE username = ?')
//         .bind(username)
//         .first();
//       if (!admin) return json({ error: 'User not found' }, { status: 404 });
//       const verification = await verifyAuthenticationResponse({
//         response,
//         expectedChallenge: storedChallenge,
//         expectedOrigin: origin,
//         expectedRPID: rpID,
//         credential: {
//           id: admin.credential_id as string,
//           publicKey: Uint8Array.from(Buffer.from(admin.public_key as string, 'base64')),
//           counter: (admin.counter as number) || 0,
//         },
//       });
//       if (verification.verified) {
//         // Persist the new counter so replay protection actually fires.
//         const newCounter = verification.authenticationInfo?.newCounter ?? 0;
//         await db
//           .prepare('UPDATE admins SET counter = ? WHERE username = ?')
//           .bind(newCounter, username)
//           .run();
//         await kv.delete(`challenge:${username}`);
//         await issueSessionCookie(cookies, username, privateEnv.ADMIN_SESSION_SECRET || '', dev);
//         return json({ verified: true });
//       }
//     }
//     return json({ error: 'Verification failed' }, { status: 400 });
//   } catch (error) {
//     console.error('[webauthn] verify error:', error);
//     return json({ error: 'Server error' }, { status: 500 });
//   }
// };
// const resolvedUsername = allowed.username;


import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { env as publicEnv } from '$env/dynamic/public';
import { dev } from '$app/environment';
import { issueSessionCookie } from '$lib/server/admin-session';
import { env as privateEnv } from '$env/dynamic/private';

function resolveRpId(reqUrl: URL): string {
  const fromEnv = publicEnv.PUBLIC_RP_ID;
  if (fromEnv) return fromEnv;
  return reqUrl.hostname || 'localhost';
}

export const POST: RequestHandler = async ({ request, platform, cookies, url }) => {
  const rpID = resolveRpId(url);
  const db = platform?.env?.DB;
  const kv = platform?.env?.KV;
  if (!db || !kv) return json({ error: 'Unavailable' }, { status: 500 });

  const body = await request.json();
  const { username, response, mode } = body;

  const origin = request.headers.get('origin') ||
    (dev ? 'http://localhost:5173' : `https://${rpID}`);

  const storedChallenge = await kv.get(`challenge:${username}`);
  if (!storedChallenge) return json({ error: 'Challenge expired' }, { status: 400 });

  try {
    if (mode === 'register') {
      // ✅ Fix 1: use 'username' not 'identifier'
      const isEmail = typeof username === 'string' && username.includes('@');
      const allowed = await db
        .prepare(
          isEmail
            ? 'SELECT username FROM admin_allowlist WHERE email = ?'
            : 'SELECT username FROM admin_allowlist WHERE username = ?'
        )
        .bind(username)
        .first<{ username: string }>();

      if (!allowed) {
        return json({ error: 'Non itilizatè sa a pa otorize' }, { status: 403 });
      }

      // ✅ Fix 2: resolve canonical username HERE, inside the function
      const resolvedUsername = allowed.username;

      // ✅ Fix 3: use resolvedUsername in ALL operations below
      const existing = await db
        .prepare('SELECT username FROM admins WHERE username = ?')
        .bind(resolvedUsername)
        .first();
      if (existing) return json({ error: 'Non itilizatè sa a deja egziste' }, { status: 400 });

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: storedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
      if (verification.verified && verification.registrationInfo) {
        await db
          .prepare(
            `INSERT INTO admins (username, credential_id, public_key, counter, created_at)
             VALUES (?, ?, ?, 0, unixepoch())`
          )
          .bind(
            resolvedUsername,
            verification.registrationInfo.credentialID,
            Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64')
          )
          .run();
        await kv.delete(`challenge:${username}`);
        await issueSessionCookie(cookies, resolvedUsername, privateEnv.ADMIN_SESSION_SECRET || '', dev, platform?.env?.DB);
        return json({ verified: true });
      }
    } else {
      // Login: also resolve email → username
      const isEmail = typeof username === 'string' && username.includes('@');
      const adminLookup = isEmail
        ? await db.prepare('SELECT username FROM admins WHERE email = ?').bind(username).first<{ username: string }>()
        : null;
      const resolvedUsername = adminLookup?.username || username;

      const admin = await db
        .prepare('SELECT credential_id, public_key, counter FROM admins WHERE username = ?')
        .bind(resolvedUsername)
        .first();
      if (!admin) return json({ error: 'User not found' }, { status: 404 });

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: storedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: admin.credential_id as string,
          publicKey: Uint8Array.from(Buffer.from(admin.public_key as string, 'base64')),
          counter: (admin.counter as number) || 0,
        },
      });
      if (verification.verified) {
        const newCounter = verification.authenticationInfo?.newCounter ?? 0;
        await db
          .prepare('UPDATE admins SET counter = ? WHERE username = ?')
          .bind(newCounter, resolvedUsername)
          .run();
        await kv.delete(`challenge:${username}`);
        await issueSessionCookie(cookies, resolvedUsername, privateEnv.ADMIN_SESSION_SECRET || '', dev, platform?.env?.DB);
        return json({ verified: true });
      }
    }
    return json({ error: 'Verification failed' }, { status: 400 });
  } catch (error) {
    console.error('[webauthn] verify error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};