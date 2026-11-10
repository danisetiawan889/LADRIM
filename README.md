# LADRIM

Decoupled e-commerce platform.

```
ladrim/
├── frontend/   Next.js 14 (App Router) · Tailwind · TypeScript · Framer Motion
├── backend/    Express · TypeScript · PostgreSQL (parameterized queries via pg)
└── docs/IMPLEMENTATION_PLAN.md
```

## 🧭 Panduan Alur Sistem Lengkap
Untuk memahami diagram alur komunikasi antar-file, relasi database, dan siklus transaksi secara mendalam, silakan baca:
👉 **[ALUR_SISTEM.md](file:///home/jeydome/New%20Folder/ladrim/ALUR_SISTEM.md)**

---

## ⚡ Cara Cepat Menjalankan (1-Klik Runner)
Anda dapat langsung menjalankan database, backend, frontend, dan terowongan Cloudflare Tunnel dengan satu perintah:
```bash
./start-cloudflare.sh
```

---

## 🛠️ Menjalankan Manual
```bash
# 1. database
createdb ladrim && psql ladrim -f backend/src/db/schema.sql
# 2. backend
cd backend && cp .env.example .env && npm i && npm run dev     # :4000
# 3. frontend
cd frontend && cp .env.example .env.local && npm i && npm run dev   # :3000
```
The browser only calls `/api/*` on the Next origin; `next.config.mjs` proxies to Express, so auth and CSRF cookies stay first-party.

## What is built vs. stubbed
Built: design system, deep-nav (3 tiers), search overlay, cart context, security middleware stack,
JWT cookie auth + admin 2FA, RBAC, audit trail, checkout state machine, signed/idempotent payment webhook, full DB schema.
Stubbed (marked TODO): courier API calls, product thumbnails, admin module handlers, notifications, loyalty points.

