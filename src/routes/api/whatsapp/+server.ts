import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// GET — Meta's webhook verification handshake.

// Verify the webhook signature Meta attaches to every POST. The
// header is the hex HMAC-SHA256 of the raw request body keyed by
// the Meta app secret (WHATSAPP_APP_SECRET in env). Without this
// check, anyone on the internet who knows our URL can POST fake
// user messages and have the bot process them.
async function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !header.startsWith('sha256=')) return false;
  const expectedHex = header.slice('sha256='.length);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const actualHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Constant-time comparison
  if (actualHex.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHex.length; i++) {
    diff |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

export const GET: RequestHandler = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
};

// POST — incoming message handler.
//
// Cured for the "Ghost Webhook" crash:
//   WhatsApp sends webhooks for status updates (sent/delivered/read)
//   and for message reactions. These payloads have no `messages` array.
//   The previous code accessed `messages[0].text.body` and threw a
//   500, which made Meta retry the webhook in a loop, exhausting
//   worker CPU. We now silently 200-OK any non-message event.

// Defense-in-depth: WhatsApp from-numbers should be E.164 digits only
// (8-15 chars). Meta validates server-side, but a malformed value
// in our outbound to: would still be wasted work + a log line that
// makes incidents harder to read.
function isValidWhatsAppFrom(s: unknown): s is string {
  return typeof s === 'string' && /^\d{8,15}$/.test(s);
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ ok: true }); // 200 even on internal errors so Meta stops retrying

  // Read raw body first so we can verify signature AND parse it.
  const rawBody = await request.text();

  // Signature check. If WHATSAPP_APP_SECRET isn't set, we treat the
  // request as unverified and drop it with a 200 so Meta doesn't
  // retry — but log the misconfiguration loudly.
  const appSecret = env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error('[whatsapp] WHATSAPP_APP_SECRET not set — rejecting webhook');
    return json({ ok: true });
  }
  const sigHeader = request.headers.get('x-hub-signature-256');
  const signatureValid = await verifyMetaSignature(rawBody, sigHeader, appSecret);
  if (!signatureValid) {
    console.warn('[whatsapp] invalid signature — dropping webhook');
    return json({ ok: true });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: true }); // malformed payload: acknowledge and drop
  }

  const value = body?.entry?.[0]?.changes?.[0]?.value;
  // Status updates, reactions, message_template_status_update, etc.
  if (!value?.messages?.length) return json({ ok: true });

  const message = value.messages[0];
  const from = message.from;
  if (!isValidWhatsAppFrom(from)) {
    console.warn('[whatsapp] dropping message with invalid from-number:', from);
    return json({ ok: true });
  }
  const text = (message.text?.body || '').toLowerCase();

  let reply = 'Bonjou! Byenvini nan ST MICHEL. Voye "evènman" pou lis aktivite, "match" pou match foutbòl, oswa "vil" pou enfòmasyon sou St Michel.';

  try {
    if (text.includes('evènman') || text.includes('event')) {
      const events = await db
        .prepare(
          `SELECT title, date, time, location FROM events
           WHERE type='event' AND published=1 AND date >= date('now')
           ORDER BY date LIMIT 5`
        )
        .all();
      if (events.results.length) {
        reply = 'Evènman kap vini:\n' + events.results.map(
          (e: any) => `• ${e.title} – ${e.date} ${e.time || ''} @ ${e.location || 'St Michel'}`
        ).join('\n');
      } else {
        reply = 'Pa gen evènman pwograme kounye a.';
      }
    } else if (text.includes('match')) {
      const matches = await db
        .prepare(
          `SELECT home_team, away_team, match_date, match_time, location FROM matches
           WHERE status='upcoming' AND published=1 ORDER BY match_date LIMIT 5`
        )
        .all();
      if (matches.results.length) {
        reply = 'Match kap vini:\n' + matches.results.map(
          (m: any) => `• ${m.home_team} vs ${m.away_team} – ${m.match_date} ${m.match_time || ''} @ ${m.location || 'St Michel'}`
        ).join('\n');
      } else {
        reply = 'Pa gen match pwograme.';
      }
    } else if (text.includes('vil') || text.includes('city')) {
      reply = 'St Michel de l\'Attalaye – Kapital kleren an. Li te fonde an 1768. Festival 888 chak ane 8 me. Majistra: Dr. Gueillant Dorcinvil. Radyo lokal: RFP 95.1 FM.';
    }
  } catch (err) {
    console.error('[whatsapp] db query failed', err);
    // fall through with default reply
  }

  // Send reply — fire-and-forget. Don't await so Meta's 5s timeout is
  // never the bottleneck. waitUntil is exposed via platform.context
  // on Cloudflare Pages.
  const sendReply = async () => {
    const whatsappToken = env.WHATSAPP_TOKEN;
    const phoneId = env.WHATSAPP_PHONE_ID;
    if (!whatsappToken || !phoneId) return;
    try {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: from,
          text: { body: reply },
        }),
      });
    } catch (err) {
      console.error('[whatsapp] send reply failed', err);
    }
  };

  const ctx = (platform as any)?.context;
  if (ctx?.waitUntil) {
    ctx.waitUntil(sendReply());
  } else {
    // Fallback for environments without waitUntil — best-effort.
    void sendReply();
  }

  return json({ ok: true });
};
