import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';
// $env/dynamic/public reads at runtime from process.env during build and
// from platform.env at runtime on Cloudflare. Static imports throw if the
// variable is missing; dynamic reads return undefined and let us fall back
// gracefully. This is what makes a first-time `pnpm dev` run succeed with no
// .env file present.

import { env as publicEnv } from '$env/dynamic/public';

// Fall back to the actual request hostname rather than 'localhost'
// so a missing PUBLIC_RP_ID doesn't silently break passkey auth in
// production. The env var still wins when it's set.
function resolveRpId(reqUrl: URL): string {
  const fromEnv = publicEnv.PUBLIC_RP_ID;
  if (fromEnv) return fromEnv;
  return reqUrl.hostname || 'localhost';
}
const rpName = 'ST MICHEL Admin';

export const GET: RequestHandler = async ({ url, platform }) => {
  const rpID = resolveRpId(url);
  const username = url.searchParams.get('username');
  const mode = url.searchParams.get('mode') || 'login';
  if (!username) return json({ error: 'Missing username' }, { status: 400 });

  const kv = platform?.env?.KV;
  if (!kv) return json({ error: 'KV unavailable' }, { status: 500 });

  try {
    let options;
    if (mode === 'register') {
    //   options = await generateRegistrationOptions({
    //     rpName,
    //     rpID,
    //     userID: username,
    //     userName: username,
    //     attestationType: 'none',
    //   });
    // } else {
    //   options = await generateAuthenticationOptions({ rpID });
    // }
let displayName = username;
      const db = platform?.env?.DB;
      if (db) {
        const isEmail = username.includes('@');
        if (isEmail) {
          const row = await db
            .prepare('SELECT username FROM admin_allowlist WHERE email = ?')
            .bind(username)
            .first<{ username: string }>();
          if (row) displayName = row.username;
        }
      }

      options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: displayName,
        userName: displayName,
        attestationType: 'none',
      });
    } else {
      options = await generateAuthenticationOptions({ rpID });
    }

    await kv.put(`challenge:${username}`, options.challenge, { expirationTtl: 300 });
    return json(options);
  } catch (error) {
    console.error('[webauthn] generate error:', error);
    return json({ error: 'Server error' }, { status: 500 });
  }
};
