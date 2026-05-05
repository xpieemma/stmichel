import { defineConfig } from 'vitest/config';

// Standalone vitest config: no SvelteKit / Vite / PostCSS pickup.
// Our test suite verifies architectural invariants, migration SQL,
// pure helpers, and configuration files — none of which need a
// browser-like Vite runtime.

export default defineConfig({
  // Override Vite's default config search so it doesn't pick up
  // svelte.config.js / postcss.config.js / etc.
  configFile: false,
  // Don't try to load the project's Vite config either.
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: true }
    },
    // Skip CSS / asset processing entirely.
    css: false,
    // Use the test-only tsconfig so we don't hit the project's
    // SvelteKit-specific tsconfig that extends a generated file.
    typecheck: { enabled: false }
  }
});
