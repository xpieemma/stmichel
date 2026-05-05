import { copyFileSync, mkdirSync } from 'fs';

const dir = '.svelte-kit/cloudflare/_app/immutable/workers';
const src = 'node_modules/.pnpm/@sqlite.org+sqlite-wasm@3.53.0-build1/node_modules/@sqlite.org/sqlite-wasm/dist';

mkdirSync(dir, { recursive: true });
copyFileSync(`${src}/sqlite3.wasm`, `${dir}/sqlite3.wasm`);
copyFileSync(`${src}/sqlite3-opfs-async-proxy.js`, `${dir}/sqlite3-opfs-async-proxy.js`);
console.log('✅ sqlite3.wasm + opfs proxy copied to workers dir');