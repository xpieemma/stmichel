// import type { Handle, HandleServerError } from '@sveltejs/kit';
// import { sequence } from '@sveltejs/kit/hooks';
// import { dev } from '$app/environment';
// import { env as privateEnv } from '$env/dynamic/private';
// import { verifySession } from '$lib/server/admin-session';



// const dbHandle: Handle = async ({ event, resolve }) => {
//   if (event.platform?.env) {
//     event.locals.db = event.platform.env.DB;
//     event.locals.kv = event.platform.env.KV;
//     // Fail loud when bindings go missing in production. Without this
//     // line, every API call returns a generic 500 with no clue why.
//     if (!event.locals.db) {
//       console.error('[hooks] D1 binding "DB" is missing — check wrangler.toml');
//     }
//     if (!event.locals.kv) {
//       console.error('[hooks] KV binding "KV" is missing — check wrangler.toml');
//     }
//   } else if (!event.url.pathname.startsWith('/_app/')) {
//     // No platform.env at all = running outside Cloudflare (vite dev).
//     // This is normal in dev; only warn for actual API hits.
//     if (event.url.pathname.startsWith('/api/') ||  event.url.pathname.startsWith('/admin/api/')) {
//       console.warn('[hooks] platform.env unavailable — API will fail. Run with `wrangler pages dev`.');
//      return new Response(
//         JSON.stringify({ 
//           error: 'Cloudflare bindings unavailable in local dev',
//           hint: 'Run: pnpm build && pnpm wrangler pages dev .svelte-kit/cloudflare'
//         }),
//         { 
//           status: 503, 
//           headers: { 'Content-Type': 'application/json' } 
//         }
//       );
//     }
//   }
//   return resolve(event);
// };


// // Origin check for admin state-changing requests. Defense in depth on
// // top of the strict-SameSite session cookie. Blocks CSRF if an
// // attacker somehow lands on the same origin (compromised subdomain,
// // service-worker caching a malicious page, etc.).
// const adminOriginHandle: Handle = async ({ event, resolve }) => {
//   const { pathname } = event.url;
//   // const needsCheck =
//   //   (pathname.startsWith('/api/admin') ||
//   //     (pathname.startsWith('/admin') && pathname !== '/admin/login')) &&
//   //   ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method);
// const PUBLIC_AUTH_PATHS = [
//   '/admin/login',
//   '/admin/api/webauthn',
//   '/admin/api/password',
//   '/admin/api/demo-login',
//   '/admin/api/request-access',
// ];

// const needsCheck =
//   (pathname.startsWith('/api/admin') ||
//     (pathname.startsWith('/admin') &&
//       !PUBLIC_AUTH_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')))) &&
//   ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method);

//   if (needsCheck) {
//     const origin = event.request.headers.get('origin');
//     const host = event.request.headers.get('host');
//     // An absent Origin header on a mutating request is suspicious;
//     // modern browsers always send it on fetch/XHR/form-submit.
//     if (!origin) {
//       return new Response('Forbidden: missing Origin', { status: 403 });
//     }
//     try {
//       if (host && new URL(origin).host !== host) {
//         return new Response('Forbidden: origin mismatch', { status: 403 });
//       }
//     } catch {
//       return new Response('Forbidden: invalid Origin', { status: 403 });
//     }
//   }

//   return resolve(event);
// };

// const authHandle: Handle = async ({ event, resolve }) => {
//   if (event.url.pathname.startsWith('/admin')) {
//     // Allow login and the credential endpoints through (chicken/egg).
//     // Also allow public request-access and demo-login; these are
//     // unauthenticated by design.
//     if (
//       event.url.pathname === '/admin/login' ||
//       event.url.pathname.startsWith('/admin/api/webauthn') ||
//       event.url.pathname.startsWith('/admin/api/password') ||
//       event.url.pathname === '/admin/api/request-access' ||
//       event.url.pathname === '/admin/api/demo-login'
//     ) {
//       return resolve(event);
//     }
//     // Cryptographically verify the cookie. Pre-Round-10 this was just
//     // `if (!session) redirect()` — any string passed.
//     const token = event.cookies.get('admin_session');
//     const secret = privateEnv.ADMIN_SESSION_SECRET || '';
//     const username = await verifySession(token, secret);
//     if (!username) {
//       return new Response('Unauthorized', {
//         status: 302,
//         headers: { Location: '/admin/login' }
//       });
//     }
//     // Belt-and-braces: cross-check the admins table. A signed cookie
//     // for a deleted/disabled admin must stop working immediately.
//     //
//     // Fail-closed semantics: if the DB binding is missing in
//     // production (misconfigured deploy, D1 outage, etc.), we MUST
//     // refuse the session rather than silently skipping the check.
//     // Skipping would mean any forgery that beat the HMAC would also
//     // pass the cross-check on a degraded deploy. In dev, we tolerate
//     // the missing binding so the helpful "no such table" hint can
//     // fire from handleError instead of producing a 302 here.
//     const db = event.platform?.env?.DB;
//     if (db) {
//       const row = await db
//         .prepare('SELECT username FROM admins WHERE username = ?')
//         .bind(username)
//         .first();
//       if (!row) {
//         // Wipe the now-invalid cookie before redirecting.
//         event.cookies.delete('admin_session', { path: '/' });
//         return new Response('Unauthorized', {
//           status: 302,
//           headers: { Location: '/admin/login' }
//         });
//       }
//     } else if (!dev) {
//       // Production with no DB binding: refuse rather than degrade.
//       // This is fail-closed.
//       console.error('[auth] D1 binding missing in production — refusing admin access');
//       event.cookies.delete('admin_session', { path: '/' });
//       return new Response('Service unavailable', { status: 503 });
//     }
//     event.locals.admin = username;
//   }
//   return resolve(event);
// };

// // Same verifier used by the API admin endpoints. Returns 401 (not 302
// // redirect, which JSON clients can't follow) before any DB write.
// const apiAdminAuthHandle: Handle = async ({ event, resolve }) => {
//   if (event.url.pathname.startsWith('/api/admin/')) {
//     const token = event.cookies.get('admin_session');
//     const secret = privateEnv.ADMIN_SESSION_SECRET || '';
//     const username = await verifySession(token, secret);
//     if (!username) {
//       return new Response(JSON.stringify({ error: 'Unauthorized' }), {
//         status: 401,
//         headers: { 'content-type': 'application/json' }
//       });
//     }
//     // Cross-check the admins table — a signed cookie for a deleted
//     // admin should stop working immediately. Same fail-closed JSON
//     // semantics as the page handle: missing DB in prod = 503.
//     const db = event.platform?.env?.DB;
//     if (db) {
//       const row = await db
//         .prepare('SELECT username FROM admins WHERE username = ?')
//         .bind(username)
//         .first();
//       if (!row) {
//         event.cookies.delete('admin_session', { path: '/' });
//         return new Response(JSON.stringify({ error: 'Unauthorized' }), {
//           status: 401,
//           headers: { 'content-type': 'application/json' }
//         });
//       }
//     } else if (!dev) {
//       console.error('[auth-api] D1 binding missing in production');
//       return new Response(JSON.stringify({ error: 'Service unavailable' }), {
//         status: 503,
//         headers: { 'content-type': 'application/json' }
//       });
//     }
//     // Demo user is read-only: GET passes through, mutations are 403.
//     // This protects against demo visitors editing real festival data.
//     if (username === 'demo' && event.request.method !== 'GET') {
//       return new Response(JSON.stringify({ error: 'Demo user is read-only' }), {
//         status: 403,
//         headers: { 'content-type': 'application/json' }
//       });
//     }
//     event.locals.admin = username;
//   }
//   return resolve(event);
// };

// const securityHeaders: Handle = async ({ event, resolve }) => {
//   const response = await resolve(event);
//   response.headers.set('X-Frame-Options', 'DENY');
//   response.headers.set('X-Content-Type-Options', 'nosniff');
//   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
//   response.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

//   // Required for OPFS / SharedArrayBuffer (cross-origin isolation)
//   response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
//   response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

//   const csp = [
//     "default-src 'self'",
//     "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com",
//     "style-src 'self' 'unsafe-inline'",
//     "img-src 'self' data: blob: https:",
//     "font-src 'self' data:",
//     "connect-src 'self' https://*.cloudflare.com https://graph.facebook.com",
//     "frame-src https://www.youtube.com https://www.tiktok.com https://web.facebook.com",
//     "worker-src 'self' blob:",
//     "manifest-src 'self'"
//   ].join('; ');
//   response.headers.set('Content-Security-Policy', csp);
//   return response;
// };

// const cacheHandle: Handle = async ({ event, resolve }) => {
//   const response = await resolve(event);
//   if (event.url.pathname.match(/\.(js|css|png|jpg|svg|webp|avif)$/)) {
//     response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
//   } else if (!event.url.pathname.startsWith('/api/')) {
//     response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=3600');
//   }
//   return response;
// };

// export const handle = sequence(dbHandle, adminOriginHandle, authHandle, apiAdminAuthHandle, securityHeaders, cacheHandle);

// export const handleError: HandleServerError = async ({ error, event }) => {
//   // In dev, the most common 500 cause is an unmigrated D1 dev DB.
//   // Catch it HERE — not in a handle wrapper — because SvelteKit's
//   // endpoint runtime catches throws inside its own resolve() before
//   // they reach our wrappers. This is the documented place for error
//   // shape transformation.
//   if (dev && error instanceof Error && /no such table/i.test(error.message)) {
//     console.error('\n\x1b[31m═══════════════════════════════════════════════════════');
//     console.error('  D1 NOT INITIALIZED');
//     console.error('═══════════════════════════════════════════════════════\x1b[0m');
//     console.error(`D1 dev database has no schema. Run:\n\n    pnpm db:migrate:local\n\nThen restart \`pnpm dev\`.\n`);
//     console.error(`Original error: ${error.message}`);
//     console.error('\x1b[31m═══════════════════════════════════════════════════════\x1b[0m\n');
//     return {
//       message: 'D1 dev database not migrated. Run: pnpm db:migrate:local',
//       code: 503,
//       hint: 'pnpm db:migrate:local'
//     } as any;
//   }
//   console.error('Server error:', error, 'at', event.url.pathname);
//   return { message: 'An error occurred. Please try again.', code: 500 };
// };


import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { verifySession } from '$lib/server/admin-session';

const dbHandle: Handle = async ({ event, resolve }) => {
  if (event.platform?.env) {
    event.locals.db = event.platform.env.DB;
    event.locals.kv = event.platform.env.KV;
    event.locals.r2 = event.platform.env.R2;
    if (!event.locals.db) {
      console.error('[hooks] D1 binding "DB" is missing — check wrangler.toml');
    }
    if (!event.locals.kv) {
      console.error('[hooks] KV binding "KV" is missing — check wrangler.toml');
    }
    if (!event.locals.r2) {
      console.error('[hooks] R2 binding "R2" is missing — check wrangler.toml');
    }
  } else if (!event.url.pathname.startsWith('/_app/')) {
   
    if (
      event.url.pathname.startsWith('/api/') ||
      event.url.pathname.startsWith('/admin/api/')
    ) {
      console.warn('[hooks] platform.env unavailable — API will fail.');
      return new Response(
        JSON.stringify({
          error: 'Cloudflare bindings unavailable in local dev',
          hint: 'Run: pnpm build && pnpm wrangler pages dev .svelte-kit/cloudflare'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  return resolve(event);
};


const PUBLIC_AUTH_PATHS = [
  '/admin/login',
  '/admin/api/webauthn',
  '/admin/api/password',
  '/admin/api/demo-login',
  '/admin/api/request-access',
];

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );
}

const adminOriginHandle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  // ✅ Fix: exempt public auth endpoints from CSRF check
  const needsCheck =
    (pathname.startsWith('/api/admin') ||
      (pathname.startsWith('/admin') && !isPublicAuthPath(pathname))) &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method);

  if (needsCheck) {
    const origin = event.request.headers.get('origin');
    const host = event.request.headers.get('host');
    if (!origin) {
      return new Response('Forbidden: missing Origin', { status: 403 });
    }
    try {
      if (host && new URL(origin).host !== host) {
        return new Response('Forbidden: origin mismatch', { status: 403 });
      }
    } catch {
      return new Response('Forbidden: invalid Origin', { status: 403 });
    }
  }

  return resolve(event);
};

const authHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/admin')) {
    // ✅ Fix: redirect bare /admin to dashboard
    if (event.url.pathname === '/admin' || event.url.pathname === '/admin/') {
      return new Response(null, {
        status: 302,
        headers: { Location: '/admin/dashboard' }
      });
    }

    if (
      event.url.pathname === '/admin/login' ||
      event.url.pathname.startsWith('/admin/api/webauthn') ||
      event.url.pathname.startsWith('/admin/api/password') ||
      event.url.pathname === '/admin/api/request-access' ||
      event.url.pathname === '/admin/api/demo-login'
    ) {
      return resolve(event);
    }

    const token = event.cookies.get('admin_session');
    const secret = privateEnv.ADMIN_SESSION_SECRET || '';
    const username = await verifySession(token, secret);
    if (!username) {
      return new Response('Unauthorized', {
        status: 302,
        headers: { Location: '/admin/login' }
      });
    }

    const db = event.platform?.env?.DB;
    if (db) {
      const row = await db
        .prepare('SELECT username FROM admins WHERE username = ?')
        .bind(username)
        .first();
      if (!row) {
        event.cookies.delete('admin_session', { path: '/' });
        return new Response('Unauthorized', {
          status: 302,
          headers: { Location: '/admin/login' }
        });
      }
    } else if (!dev) {
      console.error('[auth] D1 binding missing in production — refusing admin access');
      event.cookies.delete('admin_session', { path: '/' });
      return new Response('Service unavailable', { status: 503 });
    }
    event.locals.admin = username;
  }
  return resolve(event);
};

const apiAdminAuthHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/api/admin/')) {
    const token = event.cookies.get('admin_session');
    const secret = privateEnv.ADMIN_SESSION_SECRET || '';
    const username = await verifySession(token, secret);
    if (!username) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const db = event.platform?.env?.DB;
    if (db) {
      const row = await db
        .prepare('SELECT username FROM admins WHERE username = ?')
        .bind(username)
        .first();
      if (!row) {
        event.cookies.delete('admin_session', { path: '/' });
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      }
    } else if (!dev) {
      console.error('[auth-api] D1 binding missing in production');
      return new Response(JSON.stringify({ error: 'Service unavailable' }), {
        status: 503,
        headers: { 'content-type': 'application/json' }
      });
    }

    if (username === 'demo' && event.request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Demo user is read-only' }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }
    event.locals.admin = username;
  }
  return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.cloudflare.com https://graph.facebook.com",
    "frame-src https://www.youtube.com https://www.tiktok.com https://web.facebook.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);
  return response;
};

const cacheHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  if (event.url.pathname.match(/\.(js|css|png|jpg|svg|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (!event.url.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=3600');
  }
  return response;
};

export const handle = sequence(
  dbHandle,
  adminOriginHandle,
  authHandle,
  apiAdminAuthHandle,
  securityHeaders,
  cacheHandle
);

export const handleError: HandleServerError = async ({ error, event }) => {
  if (dev && error instanceof Error && /no such table/i.test(error.message)) {
    console.error('\n\x1b[31m═══════════════════════════════════════════════════════');
    console.error('  D1 NOT INITIALIZED');
    console.error('═══════════════════════════════════════════════════════\x1b[0m');
    console.error(`D1 dev database has no schema. Run:\n\n    pnpm db:migrate:local\n\nThen restart \`pnpm dev\`.\n`);
    console.error(`Original error: ${error.message}`);
    console.error('\x1b[31m═══════════════════════════════════════════════════════\x1b[0m\n');
    return {
      message: 'D1 dev database not migrated. Run: pnpm db:migrate:local',
      code: 503,
      hint: 'pnpm db:migrate:local'
    } as any;
  }
  console.error('Server error:', error, 'at', event.url.pathname);
  return { message: 'An error occurred. Please try again.', code: 500 };
};