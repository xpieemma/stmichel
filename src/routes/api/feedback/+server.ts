import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Public endpoint — anyone on the internet can POST. Defense:
//   - Reject malformed payloads with 400 before any DB write
//   - Cap field lengths so an attacker can't fill the DB with one
//     1 GB comment that breaks D1's per-row limit
//   - Range-check rating so we don't end up with NaN, -1, or 99
//   - eventTitle is stored verbatim but capped — used downstream as
//     plain text (admin analytics page reads it for display)

const MAX_TITLE  = 200;
const MAX_COMMENT = 2000;

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env?.DB;
  if (!db) return json({ error: 'Database unavailable' }, { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { eventId, eventTitle, rating, comment } = body || {};

  // eventId: optional but if present must be a positive integer
  if (eventId != null) {
    if (typeof eventId !== 'number' || !Number.isInteger(eventId) || eventId < 1) {
      return json({ error: 'eventId must be a positive integer' }, { status: 400 });
    }
  }

  // eventTitle: optional string, capped at 200 chars
  let safeTitle: string | null = null;
  if (eventTitle != null) {
    if (typeof eventTitle !== 'string') {
      return json({ error: 'eventTitle must be a string' }, { status: 400 });
    }
    safeTitle = eventTitle.slice(0, MAX_TITLE);
  }

  // rating: required, integer 1-5
  if (
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return json({ error: 'rating must be an integer 1-5' }, { status: 400 });
  }

  // comment: optional string, capped at 2000 chars
  let safeComment: string = '';
  if (comment != null) {
    if (typeof comment !== 'string') {
      return json({ error: 'comment must be a string' }, { status: 400 });
    }
    safeComment = comment.slice(0, MAX_COMMENT);
  }

  await db
    .prepare(
      `INSERT INTO feedback (event_id, event_title, rating, comment, created_at)
       VALUES (?, ?, ?, ?, unixepoch())`
    )
    .bind(eventId ?? null, safeTitle, rating, safeComment)
    .run();

  return json({ success: true });
};
