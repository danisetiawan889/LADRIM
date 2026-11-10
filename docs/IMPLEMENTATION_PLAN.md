# LADRIM implementation plan

Order matters: each phase unblocks the next, and money-touching code lands before the admin panel that manages it.

## Phase 0 · Foundations (week 1)
- Repo, linting, CI, environments (dev / staging / prod), secrets management.
- Postgres schema (`backend/src/db/schema.sql`), migration tool (node-pg-migrate or Prisma Migrate), seed script for categories.
- Decide payment gateway (Midtrans assumed) and courier aggregator (RajaOngkir or Biteship; one API for JNE, J&T, SiCepat).
- **Done when:** both apps boot locally and CI is green.

## Phase 1 · Storefront shell (weeks 1–2)
- Design tokens, fonts, ambient gradient, motion easing (done in scaffold).
- Header, DeepNav (pillar → major → sub-category gallery), SearchOverlay.
- Product listing page `/shop/[...path]` driven by `/api/categories`; product detail page with variant picker.
- **Done when:** a visitor can browse three levels deep and search on mobile and desktop.

## Phase 2 · Accounts and guest mode (week 3)
- Register / login with bcrypt + httpOnly JWT cookie; refresh-token rotation (add before launch).
- Guest checkout needs only email + address (already modelled: `orders.guest_email`).
- Account area: order history, address book, loyalty balance. Offer "create an account" on the success page using the guest's order.
- **Done when:** both paths reach the same checkout and a guest order can be claimed by a new account.

## Phase 3 · Checkout pipeline (weeks 3–5)
State machine: `cart_verified → address_validated → payment_pending → paid | failed`.
1. Cart verification: server re-prices and locks stock rows (done).
2. Address + courier: validate against courier API, compute tariff from weight and destination (stub).
3. Payment: create Snap transaction, redirect (done for Midtrans).
4. Webhook: verify SHA-512 signature, idempotent insert into `payment_events`, mark paid, decrement stock (done).
5. Success page: read the order from the DB, never trust the redirect URL.
- Add: expiry job for unpaid orders (release reservation), refund endpoint, email + WhatsApp confirmations.
- **Done when:** a sandbox payment of each channel (VA, e-wallet, card, retail outlet) flips an order to paid with no manual step.

## Phase 4 · Security hardening (parallel, finish before launch)
Helmet + HSTS, CORS allow-list, rate limits (tighten on auth routes), hpp, input sanitization, Zod validation, double-submit CSRF, parameterized SQL, TLS at the proxy.
Add: account lockout, secure refresh tokens, dependency audit in CI, WAF at the edge, penetration test on checkout and admin.

## Phase 5 · Admin core (weeks 5–7)
Admin login with mandatory TOTP, RBAC (super / chat / warehouse), audit trail on every mutation (done).
Then in this order: **Products & inventory → Orders → Shipping**, because these are needed to fulfil the first sale.
- Products: CRUD, rich-text (sanitize with an allow-list such as sanitize-html), variants matrix, CSV/Excel import and export, low-stock alerts.
- Orders: pipeline grid, status transitions, bulk labels and invoices (PDF), tracking ID capture + customer notification, returns and refunds.
- Shipping: live rates, resi tracking.

## Phase 6 · Admin growth modules (weeks 7–10)
CRM and segments → Promotions (coupons, flash sale scheduler, wholesale tiers, banners/pop-ups) → Analytics (revenue, net margin from `unit_cost`, top sellers, abandoned carts, GA + Meta Pixel) → Comms (live chat, click-to-WhatsApp, transactional email/WA) → Store setup (branding, opening hours, info-page CMS).

## Phase 7 · Launch readiness (weeks 10–12)
Load test checkout, backups and restore drill, error monitoring, uptime alerts, legal pages, cookie consent, accessibility pass, staged rollout.

## Risks to settle early
- **Stock oversell:** reserve stock at payment creation, release on expiry; decrement only on paid.
- **COD:** needs its own state (no webhook); confirm via courier remittance.
- **Refunds:** "instant digital refunds" depend on gateway support per payment channel; wallets and cards can, VAs and bank transfer usually cannot.
- **WhatsApp notifications:** requires an approved business API provider and templates.
