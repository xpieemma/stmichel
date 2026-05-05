# Festen St Michel de l’Attalaye 2026  

<div align="center">
  <h1>Festen St Michel</h1>
  <p><strong>Offline‑first PWA for the 2026 St Michel Smart City Festival</strong></p>
  <p>
    <a href="https://learning.stmichel.workers.dev"><img src="https://img.shields.io/badge/Live_Demo-Festival_Site-brightgreen?style=for-the-badge" alt="Live Demo" /></a>
    <a href="https://learning.stmichel.workers.dev/admin/dashboard"><img src="https://img.shields.io/badge/Admin_Dashboard-Manage-181717?style=for-the-badge&logo=passkey" alt="Admin Dashboard" /></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/SvelteKit-2.0-FF3E00?logo=svelte" alt="SvelteKit" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflarepages" alt="Cloudflare Pages" />
    <img src="https://img.shields.io/badge/PWA-Offline_first-5A0FC8?logo=pwa" alt="PWA" />
    <img src="https://img.shields.io/badge/WebAuthn-Secure-orange?logo=webauthn" alt="WebAuthn" />
  </p>
</div>

---

## ✨ Features  

### Festival Experience 

- 📱 **Progressive Web App** – Install on any device; full offline support  
- 🗺️ **Offline Maps** – OpenStreetMap tiles stored locally, zoom levels 13‑16 around St Michel  
- 🔐 **Passwordless Authentication** – WebAuthn passkeys (fingerprint, Face ID, security keys)  
- 🔑 **Password Fallback** – Robust PBKDF2 password auth with admin‑approval workflow  
- 👁️ **Read‑only Demo Mode** – Explore every admin page without any risk of data changes  
- 👥 **Admin Management** – Self‑service access requests, admin review & approval from the dashboard  
- 📅 **Festival Content** – Events, POIs, matches, history items, photo albums (seeded for demo)  
- ⚡ **Edge‑Native** – Deployed on Cloudflare Pages, leveraging D1 (SQLite) and KV for lightning‑fast data  

### Developer Experience  

- 🧪 **248+ Unit Tests** – Full suite runs in ~3 seconds without a browser  
- 🔄 **Offline‑First Architecture** – OPFS‑backed SQLite in the browser for instant data, synced when connected  
- 🛠️ **One‑Command Setup** – Local environment with Miniflare D1 + KV, no separate Wrangler needed  
- 📦 **Comprehensive Migrations** – 13 migrations manage the entire database lifecycle  
- 🎨 **Svelte 5 Runes** – Modern reactivity with `$state()`, `$derived()` and fine‑grained updates  

---

## 🛠️ Tech Stack  

| Layer | Technologies |
|-------|--------------|
| **Framework** | SvelteKit 2 (Svelte 5 runes) |
| **Styling** | Tailwind CSS |
| **Database** | Cloudflare D1 (SQLite) + OPFS SQLite for offline |
| **Key‑Value** | Cloudflare KV |
| **Auth** | WebAuthn (passkeys), PBKDF2 password hashing |
| **PWA** | Service Worker, offline maps, install prompt |
| **Deployment** | Cloudflare Pages with Workers |
| **Testing** | Vitest, svelte‑check, TypeScript strict |

---

## 🚀 Quick Start  

```bash
pnpm install
pnpm setup        # Runs all 13 migrations against local D1
pnpm dev          # http://localhost:5173
```

`pnpm setup` is **mandatory** – it applies every migration to the local Miniflare D1 database.  
If you skip it, every API endpoint returns HTTP 503 with `dev_d1_not_migrated`.

`pnpm dev` launches SvelteKit with `platformProxy`, giving you real D1 + KV bindings that mirror production exactly – no separate Wrangler process needed.

---

## 🔐 First‑time Admin Setup  

After `pnpm setup`, a bootstrap `admin_allowlist` row exists for user `admin`.

### Option A – Use the bootstrap password  

1. Go to [http://localhost:5173/admin/login](http://localhost:5173/admin/login)  
2. Method: “Use password”  |  Mode: “Login”  
3. Username: `admin`  |  Password: `festival-lakay-dev`  

### Option B – Register a passkey  

1. Go to [http://localhost:5173/admin/login](http://localhost:5173/admin/login)  
2. Method: “Passkey”  |  Mode: “Register”  
3. Username: `admin` (must match the allowlist row)  
4. Follow your browser’s passkey prompt  

> **Production:** Delete the bootstrap row and insert real admins.  
> See the **Admin Management** section below for the `grant-admin.js` script.

---

## 🌍 Production Deployment  

```bash
# One‑time setup
wrangler d1 create stmichel-festival-db          # copy the UUID into wrangler.toml
wrangler kv:namespace create KV                  # copy the ID into wrangler.toml
pnpm db:migrate                                  # runs all migrations against production D1

# Every deploy
pnpm build
pnpm deploy
pnpm verify                                      # post‑deploy smoke test
```

### Required Environment Variables  

Set these in **Cloudflare Pages → Settings → Environment variables → Production**:

| Variable | Description |
|----------|-------------|
| `PUBLIC_RP_ID` | Your production hostname (e.g. `stmichel.ht`) |
| `WHATSAPP_VERIFY_TOKEN` | From Meta App Dashboard |
| `WHATSAPP_PHONE_ID` | From Meta App Dashboard |
| `WHATSAPP_TOKEN` | From Meta App Dashboard |
| `WHATSAPP_APP_SECRET` | From Meta App Dashboard → Basic Settings |
| `ADMIN_BOOTSTRAP_PASSWORD` | *(optional)* Leave unset to disable password fallback |

---

## 🧪 Testing  

```bash
pnpm test              # 248+ tests, ~3s
pnpm test:watch        # watch mode
pnpm check             # svelte-check + TypeScript
```

The test suite runs entirely without a browser or Playwright – Vitest mocks the build chain so you get instant feedback.

---

## 🗺️ Offline Map Tiles  

```bash
pnpm tiles:download    # ~40 MB, OSM tiles for zoom 13–16 around St Michel
```

Populates `static/map-tiles/`. Required for `/map` to render offline; optional when online.

---

## 👥 Admin Management  

### Demo login  

Visit `/admin/login` and click **“Gade demo (read‑only)”**. You’ll log in as `demo` with full read access to every admin page, but all mutating endpoints return 403.  
Disabled in production unless `ADMIN_DEMO_ENABLED=1`.

### Engineer grants an admin  

```bash
# Approve a user (they register their own passkey or password later)
node scripts/grant-admin.js alice@example.com

# Pre‑set a password (user can change it after first login)
node scripts/grant-admin.js bob@example.com 'temporary-password-123'

# Run against production D1
node scripts/grant-admin.js carol@example.com 'pw' --remote
```

Hashing happens locally; only the salted PBKDF2 hash is sent to D1 – the clear‑text password never leaves your machine.

### Admins manage other admins  

Existing admins can review pending requests at `/admin/dashboard/admins`. Anyone can request access via the public form (POST to `/admin/api/request‑access`); admins approve or reject from the dashboard.

### Demo content  

Migration 013 seeds 4 demo events, 4 POIs, 2 history items, 2 matches (one with a score), and 2 photo albums – all with slugs prefixed `demo-`.  
Clear them before launch:

```bash
pnpm demo:clear           # production
# or run the SQL manually
```

---

## 🖼️ Placeholder Assets  

`static/icon-192.png`, `static/icon-512.png`, and `static/og-default.jpg` are solid Haitian‑blue placeholders generated at build time. **Replace them with real branded artwork** before public launch – the PWA install prompt and Open Graph previews will look much better.

---

## 🤝 Contributing  

Contributions, issues, and feature requests are welcome.  
The app is engineered for reliability – if you find a hidden bug, please open an issue.

---

<div align="center">
  <sub>Built for the St Michel community · Offline‑first, always fast</sub>
</div>