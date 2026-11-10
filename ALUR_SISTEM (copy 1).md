# Alur Sistem & Arsitektur LADRIM (Revisi)

Dokumen acuan untuk struktur, alur data, dan aturan bisnis LADRIM. Setiap fitur baru harus mengikuti dokumen ini. Jika implementasi berbeda dari dokumen, perbarui dokumen ini di commit yang sama.

## Daftar Isi
1. Arsitektur global
2. Struktur berkas
3. Menjalankan aplikasi
4. Komunikasi frontend dan backend
5. Model status order
6. Checkout, stok, dan pembayaran
7. Webhook Midtrans
8. Fulfillment dan tracking
9. Pembatalan, retur, dan refund
10. Autentikasi dan keamanan
11. Storefront
12. Panel admin
13. Hubungan storefront dan admin
14. Skema database
15. Notifikasi
16. Cakupan pengiriman
17. Referensi berkas
18. Prioritas dan status

---

## 1. Arsitektur global

```
Browser
   | HTTPS
Cloudflare Tunnel (dev/demo) atau domain tetap (produksi)
   | :3000
Frontend Next.js 14 (App Router)
   | rewrite /api/* -> :4000
Backend Express (TypeScript)
   |-- PostgreSQL :5432   (satu-satunya sumber kebenaran)
   |-- Worker/cron        (rilis reservasi stok, pengingat bayar, auto-complete order)
   |-- Midtrans           (pembayaran, refund)
   |-- Biteship/RajaOngkir (ongkir, booking kurir, webhook tracking)
   |-- Brevo              (email transaksional)
   |-- Penyimpanan file   (gambar produk, foto retur)
```

Browser hanya berbicara ke satu origin. Cookie sesi dan token CSRF tetap first-party.

Prinsip yang tidak boleh dilanggar:
- Database adalah sumber kebenaran. Frontend tidak pernah dipercaya untuk harga, ongkir, diskon, atau stok.
- Semua uang disimpan sebagai integer rupiah.
- Semua perubahan status, stok, dan harga tercatat (event atau audit log).
- Semua endpoint yang mengubah data idempotent atau dilindungi idempotency key.

## 2. Struktur berkas

```text
ladrim/
  start-cloudflare.sh
  ALUR_SISTEM.md
  PROMPTS_AGENT.md
  README.md
  bin/cloudflared
  docs/IMPLEMENTATION_PLAN.md

  frontend/
    next.config.mjs            rewrite /api/* ke backend
    tailwind.config.ts         token desain (satu-satunya sumber warna, spasi, font)
    context/
      CartContext.tsx          keranjang (tamu: localStorage, login: server)
    lib/
      api.ts                   fetcher + CSRF + idempotency key
      format.ts                format rupiah, tanggal
    components/
      ui/                      tombol, input, modal, tabel (komponen dasar tunggal)
      layout/                  Header, Footer, CartDrawer, SearchOverlay
      product/                 kartu produk, galeri, pemilih varian
      checkout/                form alamat, pilihan kurir, ringkasan
      tracking/OrderTracker.tsx
    app/
      layout.tsx
      page.tsx                 homepage (data dari banner/koleksi di DB)
      shop/[...path]/          katalog, filter, sort, pagination
      product/[slug]/
      cart/
      checkout/                + /checkout/success (polling status)
      account/                 profil, alamat, riwayat order, retur
      account/orders/[id]/     detail, invoice, lacak, batal, retur
      tracking/                lacak tanpa login (nomor order + email)
      auth/                    login, daftar, lupa dan reset password
      pages/[slug]/            halaman statis (syarat, privasi, retur, pengiriman)
      admin/                   lihat bagian 12
        login/
        dashboard/
        products/
        inventory/
        orders/
        payments/
        returns/
        customers/
        coupons/
        shipping/
        content/
        reports/
        staff/
        audit/
        settings/

  backend/
    prisma/
      schema.prisma            sumber skema tunggal
      migrations/
    src/
      server.ts
      app.ts
      config/                  env.ts, prisma.ts
      middlewares/
        security.ts            Helmet, CORS, CSRF, sanitasi (webhook dikecualikan)
        auth.ts                sesi pelanggan
        adminAuth.ts           sesi admin terpisah + 2FA
        rbac.ts                izin per modul
        validate.ts            Zod
        idempotency.ts
        rateLimit.ts
        audit.ts
      routes/
        index.ts
        auth.routes.ts
        catalog.routes.ts
        cart.routes.ts
        address.routes.ts
        shipping.routes.ts
        checkout.routes.ts
        order.routes.ts
        return.routes.ts
        webhook.routes.ts      /api/webhooks/midtrans dan /api/webhooks/tracking
        admin/*.routes.ts      satu berkas per modul admin
      controllers/             tipis, memanggil services
      services/
        order.service.ts       state machine status
        inventory.service.ts   reservasi, movement
        payment.service.ts     Midtrans, refund
        shipping.service.ts    ongkir, booking, resi
        tracking.service.ts    normalisasi event kurir
        coupon.service.ts
        email.service.ts
        otp.service.ts
        pricing.service.ts     satu-satunya tempat menghitung total
      jobs/
        releaseReservations.ts
        paymentReminder.ts
        autoComplete.ts
      db/schema.sql            hanya referensi, bukan sumber utama
```

## 3. Menjalankan aplikasi

`start-cloudflare.sh`: cek PostgreSQL, bebaskan port 3000 dan 4000, jalankan migrasi Prisma, jalankan backend, worker, frontend, lalu tunnel. Catatan: URL quick tunnel berubah tiap start, sehingga Notification URL Midtrans harus diperbarui manual. Produksi wajib memakai domain tetap.

## 4. Komunikasi frontend dan backend

1. `frontend/lib/api.ts` memanggil `/api/...` pada origin yang sama.
2. Header `x-csrf-token` disisipkan untuk POST, PUT, PATCH, DELETE. Untuk checkout dan aksi yang membuat resource, header `Idempotency-Key` ikut dikirim.
3. Next.js me-rewrite ke backend port 4000.
4. Backend: security, rate limit, auth, validasi Zod, route, controller, service, database.
5. Cookie sesi: `httpOnly; secure; sameSite=lax`. Nilai `strict` tidak dipakai karena cookie tidak terkirim saat user kembali dari halaman Midtrans atau bank, sehingga user tampak logout.
6. Webhook tidak melalui CSRF dan tidak melalui sanitasi body. Verifikasi memakai raw body.

Cache:
- Katalog dan konten boleh di-cache (ISR) dan di-revalidate saat admin mengubah data.
- Harga dan stok di keranjang dan checkout tidak boleh di-cache.

## 5. Model status order

Tiga dimensi terpisah. Tracking pelanggan hanya tampilan turunan.

| Dimensi | Nilai | Diubah oleh |
|---|---|---|
| `payment_status` | `unpaid`, `pending`, `paid`, `failed`, `expired`, `challenge`, `partially_refunded`, `refunded` | Webhook Midtrans, admin (refund) |
| `fulfillment_status` | `unfulfilled`, `packing`, `shipped`, `delivered`, `returned` | Admin, webhook kurir |
| `order_status` | `open`, `completed`, `cancelled` | Sistem, admin, pelanggan (terbatas) |

Aturan transisi utama (semua lewat `order.service.ts`, tidak ada UPDATE status langsung dari controller):

| Dari | Ke | Syarat |
|---|---|---|
| unpaid | pending | Snap token berhasil dibuat |
| pending | paid | Webhook settlement valid, amount cocok |
| pending | expired / failed | Webhook expire/deny/cancel, atau worker melewati batas waktu |
| pending | challenge | Webhook capture dengan fraud_status challenge |
| challenge | paid / failed | Keputusan admin |
| paid | partially_refunded / refunded | Refund tercatat |
| unfulfilled | packing | Admin, hanya jika payment_status = paid |
| packing | shipped | Resi terisi |
| shipped | delivered | Event kurir atau admin |
| delivered | returned | Retur diterima gudang |
| open | cancelled | Sebelum shipped (pelanggan atau admin) |
| open | completed | Delivered + N hari tanpa retur aktif (worker) |

Setiap transisi menulis baris ke `order_events` (status lama, baru, aktor, waktu, alasan). Transisi yang tidak ada di tabel ditolak.

Tampilan tracking pelanggan (5 tahap) diturunkan: Dipesan (paid), Dikirim (shipped), Transit (event kurir hub), Diantar (out for delivery), Diterima (delivered).

## 6. Checkout, stok, dan pembayaran

### 6.1 Stok dengan reservasi

```
stock_on_hand      stok fisik
stock_reserved     tertahan order belum dibayar
available          on_hand - reserved   (ditampilkan di storefront)
```

Stok dikelola per varian. `SELECT ... FOR UPDATE` hanya mengunci selama transaksi database, jadi tidak cukup untuk menahan stok selama pembeli membayar. Gunakan reservasi dengan `expires_at`.

- Checkout dibuat: `reserved += qty`, simpan `stock_reservations` dengan `expires_at` sama dengan batas bayar.
- Paid: `reserved -= qty`, `on_hand -= qty`.
- Failed, expired, cancel: `reserved -= qty`.
- Worker `releaseReservations` berjalan tiap menit dan melepas reservasi kedaluwarsa.
- Semua perubahan tercatat di `inventory_movements`.

### 6.2 Alur checkout

```
Keranjang (validasi ulang harga dan stok)
  -> pilih alamat (buku alamat)
  -> pilih kurir dan layanan (ongkir dari API, dihitung ulang server)
  -> kupon (validasi server)
POST /api/checkout  [Idempotency-Key]
  Transaksi database:
   - pricing.service menghitung subtotal, diskon, ongkir, pajak, total
   - reservasi stok
   - buat order (unpaid, unfulfilled, open)
   - snapshot order_items (nama, SKU, varian, harga saat beli)
   - snapshot alamat
   - konsumsi kuota kupon secara atomik
  -> minta Snap Token, payment_status = pending
  -> frontend membuka Snap
```

Aturan:
- Idempotency-Key sama mengembalikan order yang sama, bukan membuat order baru.
- Total yang dikirim ke Midtrans harus sama dengan jumlah item + ongkir + pajak - diskon.
- Order pending bisa dibayar ulang selama reservasi belum kedaluwarsa.
- Kupon dilepas jika order failed atau expired.

## 7. Webhook Midtrans

Endpoint: `POST /api/webhooks/midtrans`.

1. Ambil raw body, tanpa CSRF dan tanpa sanitasi.
2. Verifikasi `SHA512(order_id + status_code + gross_amount + ServerKey)`.
3. Pastikan `gross_amount` sama dengan total order di database.
4. Panggil Status API Midtrans untuk konfirmasi sebelum mengubah order.
5. Simpan ke `payment_events` dengan `transaction_id` unik. Duplikat diabaikan dan dijawab 200.
6. Terapkan transisi lewat `order.service`. Notifikasi tidak berurutan tidak boleh menurunkan status (`paid` tidak ditimpa `pending`).
7. Status ditangani: capture (cek fraud_status), settlement, pending, deny, cancel, expire, refund, chargeback.
8. Setelah `paid`: kurangi stok, kirim email konfirmasi, order muncul di admin "Perlu diproses".

Halaman `/checkout/success` membaca status dari API order, bukan dari URL. Jika masih pending, polling tiap beberapa detik dengan batas waktu.

## 8. Fulfillment dan tracking

```
Admin: Perlu diproses -> Packing -> Input resi / booking kurir -> Shipped
                                         |
                                         v  email dan WhatsApp berisi resi
Webhook kurir (bertanda tangan) -> tracking_events -> Diantar -> Diterima
   |- gagal antar / alamat salah -> exception, ditandai di admin
   |- delivered + N hari -> order completed
```

- `shipments` menyimpan kurir, layanan, resi, biaya, berat, status.
- Webhook tracking: `POST /api/webhooks/tracking`, wajib memakai secret atau signature, dinormalisasi ke event internal.
- Pelanggan melihat linimasa dari `tracking_events`. Tanpa login: nomor order + email.
- Admin dapat menginput resi manual jika tidak memakai booking otomatis.

## 9. Pembatalan, retur, dan refund

Pembatalan:
- Belum dibayar: pelanggan batal, reservasi dan kupon dilepas.
- Sudah dibayar, belum shipped: pelanggan mengajukan atau admin membatalkan, refund penuh otomatis, stok kembali.
- Sudah shipped: lewat retur.

Retur (RMA):
```
Pelanggan ajukan (item, alasan, foto) dalam jendela retur
 -> Admin setujui atau tolak (dengan alasan)
 -> Barang dikirim balik
 -> Gudang terima dan periksa
 -> Stok dikembalikan jika layak (movement tercatat)
 -> Refund (penuh atau parsial) lewat Midtrans Refund API atau manual tercatat
 -> payment_status = refunded / partially_refunded
```

Refund selalu tercatat di tabel `refunds` dengan aktor, jumlah, alasan, dan referensi Midtrans.

## 10. Autentikasi dan keamanan

Pelanggan:
- Registrasi dengan OTP email. OTP di-hash dan disimpan di tabel `email_otps` (bukan memori), masa berlaku 10 menit, maksimal 5 percobaan, cooldown kirim ulang 60 detik, rate limit per email dan IP.
- Password Bcrypt 12 rounds.
- Lupa dan reset password lewat token sekali pakai berkedaluwarsa. Ganti password dan logout semua perangkat.
- Cookie `access_token` JWT `httpOnly; secure; sameSite=lax`, dengan refresh dan revokasi lewat tabel sesi.

Admin:
- Sesi dan cookie terpisah dari pelanggan.
- 2FA TOTP wajib, rate limit login, opsi batas IP.
- RBAC granular: owner, admin, gudang, CS, finance. Izin per modul dan per aksi.
- Aksi berisiko (refund, ubah harga massal, ubah stok manual, hapus) meminta konfirmasi ulang dan tercatat di `audit_logs`.

CSRF: double-submit token via `GET /api/csrf`, wajib pada semua metode pengubah data kecuali webhook.

## 11. Storefront

Wajib:
- Katalog dengan varian (ukuran, warna), SKU, stok per varian, filter, sort, pagination, pencarian lewat backend.
- Keranjang persisten (tamu: localStorage; login: server; digabung saat login), validasi ulang harga dan stok.
- Checkout: login atau guest checkout, buku alamat Indonesia (provinsi, kota, kecamatan, kelurahan, kode pos), ongkir real-time, kupon.
- Akun: profil, alamat, riwayat order, detail order, invoice PDF, batal, bayar ulang, ajukan retur.
- Lacak pesanan, termasuk tanpa login.
- Halaman legal: syarat, privasi, retur, pengiriman.

Berikutnya: wishlist, notifikasi stok kembali, review pembeli terverifikasi, SEO (meta, sitemap, structured data), PPN.

## 12. Panel admin

| Modul | Isi |
|---|---|
| Dashboard | Perlu diproses, stok menipis, pembayaran bermasalah, omzet hari ini |
| Produk | CRUD, varian dan SKU, gambar, harga, harga coret, draft/published/archived, kategori, berat dan dimensi |
| Inventori | Stok per varian, penyesuaian dengan alasan, riwayat movement, ambang stok menipis |
| Order | Daftar dan filter, detail, ubah fulfillment, resi atau booking kurir, packing slip dan label, catatan internal, batal |
| Pembayaran | payment_events, challenge, refund penuh dan parsial |
| Retur | Setujui atau tolak, terima barang, stok kembali, refund |
| Pelanggan | Daftar, riwayat order, blokir |
| Kupon | Tipe (persen, nominal, gratis ongkir), minimal belanja, kuota total dan per user, masa berlaku |
| Pengiriman | Alamat gudang, kurir aktif, aturan gratis ongkir |
| Konten | Banner, koleksi unggulan, halaman statis, menu |
| Laporan | Penjualan, terlaris, kupon, refund |
| Staf | Akun, peran, izin, reset 2FA |
| Audit | Riwayat aksi sensitif |
| Pengaturan | Info toko, batas waktu bayar, jendela retur, pajak, template email |

## 13. Hubungan storefront dan admin

| Aksi di admin | Efek di storefront | Jika tidak ada |
|---|---|---|
| Publish atau unpublish produk | Muncul atau hilang dari katalog dan pencarian | Barang salah tidak bisa ditarik cepat |
| Ubah harga | Harga baru di katalog dan checkout | Tanpa snapshot, riwayat order ikut berubah |
| Penyesuaian stok | Label tersedia, menipis, habis | Stok sistem berbeda dari gudang, oversell |
| Input resi | Linimasa tracking bergerak, email dikirim | Pelanggan melihat "dikonfirmasi" berminggu-minggu |
| Setujui retur atau refund | Status order dan uang sinkron | Refund manual di Midtrans tidak tercatat |
| Buat kupon | Valid di checkout | Kupon tak terbatas atau tak bisa dipakai |
| Atur banner dan koleksi | Homepage berubah | Setiap perubahan butuh deploy |
| Atur gudang dan kurir | Ongkir di checkout | Ongkir salah, toko rugi |
| Tangani challenge | Order lanjut atau batal | Order tersangkut, stok tertahan |
| Peran dan audit | Tidak terlihat | Tidak ada jejak perubahan |

Revalidasi: perubahan produk, banner, dan koleksi memicu `revalidateTag` di Next.js.

## 14. Skema database

Tabel inti dan kolom kunci (semua uang integer rupiah, semua tabel punya `created_at`, `updated_at`):

- `users`, `addresses`, `user_sessions`, `email_otps`, `password_resets`
- `staff`, `roles`, `permissions`, `staff_totp`, `audit_logs`
- `categories`, `collections`, `products`, `product_variants` (sku, harga, stok_on_hand, stok_reserved, berat), `product_images`
- `inventory_movements` (variant_id, delta, alasan, aktor, ref)
- `stock_reservations` (order_id, variant_id, qty, expires_at, status)
- `carts`, `cart_items`
- `orders` (payment_status, fulfillment_status, order_status, subtotal, diskon, ongkir, pajak, total, snapshot alamat, idempotency_key)
- `order_items` (snapshot nama, sku, varian, harga, qty)
- `order_events`
- `payments`, `payment_events` (transaction_id unik)
- `refunds`
- `shipments`, `tracking_events`
- `returns`, `return_items`
- `coupons`, `coupon_redemptions`
- `idempotency_keys`
- `notifications`
- `banners`, `pages`, `settings`

## 15. Notifikasi

Email transaksional (Brevo): OTP, reset password, konfirmasi order, pengingat bayar, pembayaran diterima, dikirim (resi), diterima, retur disetujui, refund diproses. WhatsApp untuk resi dan pengingat bayar sebagai tahap berikutnya. Semua pengiriman dicatat di `notifications` dan dipicu dari event order, bukan dari controller.

## 16. Cakupan pengiriman

Saat ini hanya domestik Indonesia, mata uang IDR. Pengiriman internasional (mata uang, bea impor, kode HS, tarif kurir internasional, status customs) ditunda sampai diputuskan. Jangan tampilkan opsi internasional di storefront sebelum itu.

## 17. Referensi berkas

| Berkas | Tanggung jawab |
|---|---|
| `start-cloudflare.sh` | Menyalakan database, migrasi, backend, worker, frontend, tunnel |
| `next.config.mjs` | Rewrite `/api/*` ke backend |
| `lib/api.ts` | Fetcher, CSRF, idempotency key |
| `CartContext.tsx` | State keranjang, sinkron dengan server saat login |
| `security.ts` | Helmet, CORS, CSRF, sanitasi (kecuali webhook) |
| `order.service.ts` | Satu-satunya pintu perubahan status order |
| `inventory.service.ts` | Reservasi dan movement stok |
| `pricing.service.ts` | Satu-satunya tempat menghitung total |
| `payment.service.ts` | Snap, verifikasi webhook, refund |
| `shipping.service.ts` | Ongkir, booking, resi |
| `tracking.service.ts` | Normalisasi event kurir |
| `schema.prisma` | Sumber skema tunggal |

## 18. Prioritas dan status

P0 (sebelum menerima uang sungguhan)
- [ ] Tiga dimensi status + `order.service` + `order_events`
- [ ] Varian produk, reservasi stok, worker, inventory movements
- [ ] Webhook Midtrans lengkap, polling halaman sukses
- [ ] Idempotency-Key, sameSite lax, OTP di database
- [ ] Admin: produk, varian, stok, order, resi, refund
- [ ] Alamat Indonesia dan ongkir real-time
- [ ] Email transaksional
- [ ] Lupa password, riwayat order, batal order, halaman legal

P1
- [ ] Retur dan RMA, kupon atomik, laporan
- [ ] Role granular dan 2FA admin, audit lengkap
- [ ] Keranjang server-side, pencarian, invoice PDF, WhatsApp

P2
- [ ] Review, wishlist, notifikasi stok, SEO lanjutan, internasional
