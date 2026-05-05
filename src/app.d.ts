// SvelteKit ambient types.
//
// `locals.db` and `locals.kv` are populated by the dbHandle in
// hooks.server.ts ONLY when Cloudflare bindings are present. They are
// undefined in `vite dev` without platformProxy configured. Typing
// them as required hides real null-deref bugs; making them optional
// surfaces them.

/// <reference types="@cloudflare/workers-types" />
declare module 'leaflet' {
  export function tileLayer(url: string, options?: Record<string, unknown>): Record<string, unknown>;
}
declare global {
  namespace App {
    interface Locals {
      db?: D1Database;
      kv?: KVNamespace;
      r2?: R2Bucket;
      admin?: string;
    }
    interface Platform {
      env?: {
        DB: D1Database;
        KV: KVNamespace;
        R2: R2Bucket;
      };
      // platform.context is exposed by adapter-cloudflare for Pages
      // Functions; provides waitUntil() and passThroughOnException().
      context?: {
        waitUntil: (promise: Promise<unknown>) => void;
        passThroughOnException: () => void;
      };
    }
  }
}

export {};
