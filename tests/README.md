# Tests

100 tests across 9 files, all passing.

```
$ pnpm test

 Test Files  9 passed (9)
      Tests  100 passed (100)
   Duration  ~2.3s
```

## What's covered

| File | Tests | What it verifies |
|------|------:|------------------|
| `stamp-idempotency.test.ts` | 6 | The central passport contract: same nonce twice → one row; different nonces same event → many rows; server timestamp is authoritative even with bad client clock. |
| `sync-watermark.test.ts` | 7 | Watermark advances to max observed `updatedAt` (never `Date.now()`); stripId helper removes id from update set. |
| `whatsapp-guard.test.ts` | 4 | The ghost-webhook guard ignores status events and reactions without throwing. |
| `whatsapp-bot.test.ts` | 13 | End-to-end bot reply behavior against real DB queries: events, matches, city info, empty states, language fallbacks, result caps. |
| `api-sync-behavior.test.ts` | 11 | The actual production SQL of `/api/events/sync`, `/api/passport/sync`, and `/api/feedback` — column aliasing, watermark filter, published filter, dedup, persistence. |
| `opfs-schema-evolution.test.ts` | 5 | The OPFS migration logic: detect missing `nonce`, ALTER, backfill legacy nonces, idempotency, no overwriting of real nonces. |
| `migrations-end-to-end.test.ts` | 6 | All 8 migrations run lex-order against in-memory SQLite; resulting schema matches what code expects; `nonce` is UNIQUE; all sync tables have `updated_at` indexes. |
| `config-consistency.test.ts` | 17 | Every config file is internally consistent and aligned with the code: wrangler.toml, .env.example, CSP, _headers, migration 008. |
| `architectural-invariants.test.ts` | 31 | Each silent-bug cure has a test pinning it: SW correctness, multi-tab lock, OPFS schema evolution, WebAuthn host fallback, KV-backed challenges, offline feedback queue, optional locals types, accessible cards, stripId usage in three places, updated-store subscription, plus regression tests for older fixes (Rounds 1–3). |

## How it runs

The runner is just `node scripts/run-tests.js`. It uses `vitest` and `sql.js` (pure-WASM SQLite, no native compilation), so it works anywhere Node runs. No Playwright, no browser, no CI infrastructure required.

The script briefly hides `tsconfig.json`, `vite.config.ts`, `postcss.config.js`, and `svelte.config.js` during the run so vitest doesn't try to bootstrap a SvelteKit dev server. The originals are always restored — even if tests fail or you Ctrl+C the run. After the run, the project is in exactly the state it started in.

## Why these tests, and not Playwright + everything?

The `eConvo.txt` proposal had Playwright, axe-core, Lighthouse CI, visual regression, cross-browser matrix, and more. Each of those is good. None of them catches the bugs we actually had.

The bugs we had were:
- Migration 008 was a no-op
- `wasm-unsafe-eval` missing from CSP
- Service worker imported a browser-only module
- Service worker was never registered
- `wrangler.toml` declared the wrong env var name
- `migrations/006` missed an index
- `processPendingQueue` didn't handle feedback ops
- WebAuthn endpoints had no host fallback
- `app.d.ts` lied about whether bindings were present

A Playwright suite would not catch any of these. A unit/contract test suite catches all of them — and it runs in 2 seconds, not 2 minutes.

If you want to add Playwright later, the recommendations in `eConvo.txt` are sound. But this suite is the necessary core: every cure has a test guarding it; mutate the cure, the test fails.

## Mutation tested

Verified by deliberately reverting fixes:

| Mutation | Failures |
|----------|---------:|
| Revert migration 008 to no-op `CREATE TABLE IF NOT EXISTS` | 16 |
| Remove `'wasm-unsafe-eval'` from CSP | 1 |
| (Restore) | 0 |

The suite is tight: small mutations cause specific, targeted failures.
