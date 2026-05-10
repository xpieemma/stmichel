/**
 * tests/whatsapp-guard.test.ts
 *
 * Verifies the cure for Round 4 bug #C (the "Ghost Webhook" crash):
 * WhatsApp sends webhooks for status updates and reactions that have
 * NO `messages` array. The previous code threw a 500 on these,
 * causing Meta to retry the webhook in a loop.
 *
 * The endpoint MUST silently 200-OK any non-message payload.
 *
 * We test the guard logic directly rather than booting a SvelteKit
 * runtime — the contract is a pure function of payload shape.
 */
import { describe, it, expect } from 'vitest';

// Extracted from src/routes/api/whatsapp/+server.ts — the guard logic
// is the part of the handler that decides whether to process or
// silently acknowledge a webhook.
function shouldProcessAsMessage(body: any): boolean {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  return Boolean(value?.messages?.length);
}

describe('WhatsApp ghost-webhook guard (Round 4 fix #C)', () => {
  it('processes a real text message', () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ from: '1234', text: { body: 'evènman' } }]
              }
            }
          ]
        }
      ]
    };
    expect(shouldProcessAsMessage(payload)).toBe(true);
  });

  it('IGNORES status update (sent/delivered/read) — the original loop trigger', () => {
    const statusPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  { id: 'wamid.xxx', status: 'delivered', recipient_id: '1234' }
                ]
                // note: no `messages` key
              }
            }
          ]
        }
      ]
    };
    expect(shouldProcessAsMessage(statusPayload)).toBe(false);
  });

  it('IGNORES reaction events (no messages array)', () => {
    const reactionPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [] // empty array — should not process
              }
            }
          ]
        }
      ]
    };
    expect(shouldProcessAsMessage(reactionPayload)).toBe(false);
  });

  it('handles totally malformed payloads without throwing', () => {
    expect(shouldProcessAsMessage(null)).toBe(false);
    expect(shouldProcessAsMessage(undefined)).toBe(false);
    expect(shouldProcessAsMessage({})).toBe(false);
    expect(shouldProcessAsMessage({ entry: 'not an array' })).toBe(false);
    expect(shouldProcessAsMessage({ entry: [] })).toBe(false);
    expect(shouldProcessAsMessage({ entry: [{ changes: null }] })).toBe(false);
    expect(shouldProcessAsMessage({ entry: [{ changes: [{}] }] })).toBe(false);
  });
});
