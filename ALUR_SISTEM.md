# 🧭 Panduan Alur Sistem & Arsitektur LADRIM

Dokumen ini menjelaskan struktur berkas, peran setiap komponen, serta alur data (*data flow*) antar-file di dalam ekosistem aplikasi e-commerce **LADRIM**.

---

## 📌 Daftar Isi
1. [Arsitektur Global (Decoupled Architecture)](#1-arsitektur-global-decoupled-architecture)
2. [Peta Struktur Berkas Lengkap](#2-peta-struktur-berkas-lengkap)
3. [Alur Menjalankan Aplikasi (`start-cloudflare.sh`)](#3-alur-menjalankan-aplikasi-start-cloudflaresh)
4. [Alur Komunikasi Antara Frontend & Backend (Proxy Gateway)](#4-alur-komunikasi-antara-frontend--backend-proxy-gateway)
5. [Alur Transaksi & Pembelian (Checkout State Machine)](#5-alur-transaksi--pembelian-checkout-state-machine)
6. [Alur Autentikasi & Keamanan (OTP, JWT & CSRF)](#6-alur-autentikasi--keamanan-otp-jwt--csrf)
7. [Alur Pelacakan Logistik & Kurir](#7-alur-pelacakan-logistik--kurir)
8. [Tabel Referensi Berkas Penting](#8-tabel-referensi-berkas-penting)

---

## 1. Arsitektur Global (Decoupled Architecture)

Aplikasi LADRIM terbagi menjadi 3 lapisan utama:

```
[ Pelanggan / Browser ]
           │
           ▼ (HTTPS)
┌────────────────────────────────────────┐
│  Cloudflare Tunnel (*.trycloudflare)   │  ◄── Dijalankan dari bin/cloudflared
└──────────────────┬─────────────────────┘
                   │
                   ▼ (Port 3000)
┌────────────────────────────────────────┐
│  Frontend: Next.js 14 (App Router)     │  ◄── UI, State Keranjang, Komponen
│  Proxy Internal: next.config.mjs       │  ◄── Meneruskan /api/* ke port 4000
└──────────────────┬─────────────────────┘
                   │
                   ▼ (Port 4000)
┌────────────────────────────────────────┐
│  Backend: Express.js (TypeScript)      │  ◄── Logika Bisnis, Keamanan, Auth
└──────────────────┬─────────────────────┘
                   │
                   ▼ (Port 5432)
┌────────────────────────────────────────┐
│  Database: PostgreSQL                  │  ◄── Data Relasional (Tabel & Enums)
└────────────────────────────────────────┘
```

> **Keuntungan Arsitektur Ini:**  
> Browser hanya berbicara ke satu origin (Frontend port 3000). Permintaan ke `/api/*` diteruskan (*rewrite*) oleh Next.js ke Express port 4000. Dengan demikian, **cookie sesi JWT (`httpOnly`) dan token CSRF tetap berstatus *first-party*** tanpa masalah CORS atau pemblokiran cookie pihak ketiga dari browser modern.

---

## 2. Peta Struktur Berkas Lengkap

```text
ladrim/
├── 📄 start-cloudflare.sh        # Skrip otomatis peluncur backend, frontend & tunnel
├── 📄 ALUR_SISTEM.md             # Dokumen panduan ini
├── 📄 README.md                  # Dokumentasi ringkas proyek
├── 📁 bin/
│   └── ⚙️ cloudflared            # Executable binary Cloudflare Tunnel
├── 📁 docs/
│   └── 📄 IMPLEMENTATION_PLAN.md # Rencana tahapan pengerjaan modul e-commerce
│
├── 📁 frontend/                  # Next.js 14, React 18, Tailwind CSS, Framer Motion
│   ├── 📄 next.config.mjs        # REWRITE PROXY: /api/* -> http://localhost:4000/api/*
│   ├── 📄 package.json           # Dependensi frontend
│   ├── 📄 tailwind.config.ts     # Konfigurasi token desain dan palet warna
│   ├── 📁 context/
│   │   └── 📄 CartContext.tsx    # State management keranjang belanja global
│   ├── 📁 lib/
│   │   ├── 📄 api.ts             # Client fetcher: auto inject CSRF token & cookie
│   │   ├── 📄 taxonomy.ts        # Data hierarki navigasi (Men, Women, Accessories)
│   │   └── 📄 catalogData.ts     # Mapper data produk & formatter mata uang
│   ├── 📁 components/            # Komponen tampilan modular
│   │   ├── 📄 Header.tsx         # Navbar atas (Logo, Menu, Search, & Cart Drawer toggle)
│   │   ├── 📄 Footer.tsx         # Footer informasi brand & kontak
│   │   ├── 📄 DeepNav.tsx        # Navigasi katalog 3 level (Pillar -> Major -> Sub)
│   │   ├── 📄 CartDrawer.tsx     # Laci geser keranjang belanja
│   │   └── 📄 SearchOverlay.tsx  # Pop-up pencarian produk instan
│   └── 📁 app/                   # Rute halaman (App Router)
│       ├── 📄 layout.tsx         # Root layout (Provider keranjang, font, stylesheet)
│       ├── 📄 page.tsx           # Homepage (Hero visual, etalase koleksi pilihan)
│       ├── 📁 shop/              # Halaman katalog barang (/shop/[...path])
│       ├── 📁 product/           # Halaman detail produk (/product/[slug])
│       ├── 📁 checkout/          # Halaman pengisian alamat & pembayaran (/checkout)
│       ├── 📁 account/           # Halaman profil & riwayat transaksi (/account)
│       ├── 📁 tracking/          # Halaman pelacakan paket kurir (/tracking)
│       └── 📁 admin/             # Portal operasional staf (/admin)
│
└── 📁 backend/                   # Node.js, Express.js, TypeScript, PostgreSQL
    ├── 📄 package.json           # Dependensi backend
    ├── 📁 prisma/
    │   └── 📄 schema.prisma      # Skema pemodelan database untuk Prisma ORM
    └── 📁 src/
        ├── 📄 server.ts          # Titik masuk utama: app.listen(PORT: 4000)
        ├── 📄 app.ts             # Inisialisasi Express & registrasi middleware keamanan
        ├── 📁 config/
        │   ├── 📄 env.ts         # Validasi variabel lingkungan (.env)
        │   ├── 📄 db.ts          # Koneksi pool PostgreSQL (pg Pool)
        │   └── 📄 prisma.ts      # Instansiasi PrismaClient
        ├── 📁 db/
        │   └── 📄 schema.sql     # Skrip DDL tabel relasional PostgreSQL murni
        ├── 📁 middlewares/
        │   ├── 📄 security.ts    # Proteksi Helmet, CORS, XSS Sanitize, Double CSRF
        │   ├── 📄 auth.ts        # Verifikasi cookie JWT (optionalAuth & requireAuth)
        │   ├── 📄 rbac.ts        # Pengecekan hak akses (Role-Based Access Control)
        │   ├── 📄 validate.ts    # Validasi payload request body menggunakan Zod
        │   └── 📄 audit.ts       # Pencatatan riwayat aktivitas staf ke audit_logs
        ├── 📁 routes/
        │   ├── 📄 index.ts       # Router induk yang menyatukan seluruh sub-rute
        │   ├── 📄 auth.routes.ts # Rute register OTP, login, profil (/api/auth)
        │   ├── 📄 checkout.routes.ts # Rute checkout & webhook gateway (/api/checkout)
        │   ├── 📄 tracking.routes.ts # Rute status kurir & resi (/api/tracking)
        │   └── 📄 admin.routes.ts# Rute kendali data operasional (/api/admin)
        ├── 📁 controllers/
        │   ├── 📄 auth.controller.ts     # Logika verifikasi OTP & pembuatan sesi JWT
        │   ├── 📄 checkout.controller.ts # Logika checkout state machine & Midtrans
        │   └── 📄 tracking.controller.ts # Logika linimasa pelacakan pesanan
        └── 📁 services/
            ├── 📄 email.service.ts    # Pengiriman email OTP register via Brevo SMTP
            └── 📄 tracking.service.ts # Mapper status kurir ke 5 tahapan Gymshark-style
```

---

## 3. Alur Menjalankan Aplikasi (`start-cloudflare.sh`)

Ketika Anda mengeksekusi `./start-cloudflare.sh`, skrip ini menjalankan orkestrasi berantai berikut:

```
[start-cloudflare.sh]
        │
        ├─► 1. Cek PostgreSQL (pg_isready)
        │       └─ Jika mati, nyalakan via systemctl.
        │
        ├─► 2. Bersihkan Port Lama
        │       └─ Matikan proses di port 3000, 4000, dan cloudflared sebelumnya.
        │
        ├─► 3. Jalankan Backend (Port 4000)
        │       └─ Masuk ke /backend, jalankan `npm run dev` (tsx watch src/server.ts).
        │
        ├─► 4. Jalankan Frontend (Port 3000)
        │       └─ Masuk ke /frontend, jalankan `npm run dev` (next dev).
        │
        ├─► 5. Jalankan Cloudflare Tunnel
        │       └─ Jalankan `./bin/cloudflared tunnel --url http://127.0.0.1:3000`.
        │       └─ Tunggu dan ambil URL publik (contoh: https://xxx.trycloudflare.com).
        │
        └─► 6. Keep-Alive & Trap Shutdown
                └─ Menjaga proses tetap hidup dan membersihkan semua proses jika ditekan Ctrl+C.
```

---

## 4. Alur Komunikasi Antara Frontend & Backend (Proxy Gateway)

Bagaimana sebuah klik di browser sampai ke database?

```text
1. Browser Pengguna
   └─ Mengklik tombol "Beli" atau membuka halaman.
   └─ Memanggil fungsi fetch di: frontend/lib/api.ts

2. Fetch ke Endpoint Sama (First-Party)
   └─ Contoh URL yang dipanggil browser: "http://localhost:3000/api/checkout"
   └─ Token CSRF disisipkan pada header: "x-csrf-token"

3. Diterima oleh Next.js Server
   └─ Dibaca oleh aturan rewrite di: frontend/next.config.mjs
   └─ Next.js membelokkan URL secara diam-diam ke Backend:
      "http://localhost:4000/api/checkout"

4. Masuk ke Pintu Backend (Express)
   └─ Entry point: backend/src/server.ts -> backend/src/app.ts
   └─ Melewati saringan keamanan di: backend/src/middlewares/security.ts
      (Cek CSRF token, sanitasi karakter XSS jahat, batasi rate limit)
   └─ Melewati pembacaan token sesi: backend/src/middlewares/auth.ts
      (Mengekstrak data user dari cookie JWT httpOnly)

5. Pengarah Rute (Routing)
   └─ Masuk ke: backend/src/routes/index.ts
   └─ Diarahkan ke rute spesifik, misal: backend/src/routes/checkout.routes.ts

6. Eksekusi Logika Bisnis
   └─ Dijalankan oleh: backend/src/controllers/checkout.controller.ts
   └─ Memanggil fungsi database di: backend/src/config/db.ts atau prisma.ts

7. Database PostgreSQL
   └─ Eksekusi query SQL ke tabel PostgreSQL (backend/src/db/schema.sql).
   └─ Hasil dikembalikan ke Controller -> Route -> Next.js -> Tampil di Browser.
```

---

## 5. Alur Transaksi & Pembelian (Checkout State Machine)

Proses pemesanan barang menerapkan mesin status (*State Machine*) 5 tahap untuk memastikan data harga valid dan mencegah barang terjual melebihi stok (*oversell*):

```
[ Keranjang Belanja ]
        │
        ▼ (POST /api/checkout)
[ 1. Tahap: cart_verified ]
  - Backend menghitung ulang harga barang dari database (tidak mempercayai harga dari frontend).
  - Mengunci baris stok produk di PostgreSQL agar tidak direbut pembeli lain.
        │
        ▼
[ 2. Tahap: address_validated ]
  - Validasi data penerima dan alamat pengiriman.
  - Hitung bobot total barang dan kalkulasi ongkos kirim kurir.
  - Hitung potongan kupon diskon (jika ada).
  - Buat baris transaksi baru di tabel `orders` dengan status 'pending'.
        │
        ▼
[ 3. Tahap: payment_pending ]
  - Backend meminta Snap Token transaksi ke Payment Gateway (Midtrans).
  - Frontend menampilkan pop-up pembayaran ke pembeli (Virtual Account / QRIS / Kartu).
        │
        ├────────────────────────────────┐
        ▼ (Pembayaran Sukses)            ▼ (Batal / Expired)
[ 4. Tahap: paid ]              [ 5. Tahap: failed ]
  - Midtrans kirim Webhook        - Batalkan pesanan.
    ke /api/webhooks/midtrans.    - Lepaskan kunci stok produk.
  - Verifikasi Signature SHA-512.
  - Simpan log ke `payment_events`.
  - Ubah status order jadi 'processing'.
  - Kurangi stok barang di database.
        │
        ▼
[ Halaman Sukses ]
  - Browser diarahkan ke /checkout/success.
  - Frontend membaca status order langsung dari database (bukan dari URL).
```

---

## 6. Alur Autentikasi & Keamanan (OTP, JWT & CSRF)

LADRIM menerapkan sistem keamanan ketat setara standar industri:

### A. Registrasi Pelanggan (Email OTP)
1. Pembeli mengisi nama, email, dan kata sandi di formulir registrasi.
2. `backend/src/controllers/auth.controller.ts` membuat kode OTP acak 6 digit dan menyimpannya di memori sementara (TTL 10 menit).
3. `backend/src/services/email.service.ts` mengirim kode ke kotak masuk email pembeli melalui **Brevo SMTP**.
4. Pembeli memasukkan 6 digit OTP di layar untuk verifikasi.
5. Jika cocok, password di-hash menggunakan algoritma **Bcrypt (12 rounds)** dan akun disimpan di tabel `users`.
6. Server menerbitkan cookie `access_token` berisi **JWT (JSON Web Token)** bertipe `httpOnly; sameSite=strict; secure`.

### B. Proteksi Form dari Pembajakan (Double-Submit CSRF)
- Setiap kali browser memuat halaman, frontend memanggil endpoint `GET /api/csrf`.
- Backend (`backend/src/middlewares/security.ts`) mengirimkan token acak terenkripsi dan menanamkan cookie `ladrim.csrf`.
- Setiap permintaan yang mengubah data (`POST`, `PUT`, `PATCH`, `DELETE`) wajib menyertakan header `x-csrf-token`. Jika tidak cocok dengan cookie, server langsung menolak request dengan kode `403 Forbidden`.

---

## 7. Alur Pelacakan Logistik & Kurir (Domestik & Internasional)

Modul pelacakan paket di LADRIM menggunakan arsitektur **5 Macro-States Universal** (*Gymshark-style*). Sistem secara otomatis mendeteksi negara tujuan melalui `orders.shipping_address.country` untuk menyesuaikan teks, status, dan istilah logistik secara dinamis (*context-aware*):

```text
[ ORDERED ]           Pesanan berhasil dibayar dan dikonfirmasi warehouse
    │
    ▼
[ SHIPPED ]           Gudang mengemas barang & diserahkan ke pihak kurir/kargo
    │
    ▼
[ IN_CUSTOMS ]        Paket di Hub Sortir Transit (Domestik) / Bea Cukai Negara Tujuan (Internasional)
    │
    ▼
[ OUT_FOR_DELIVERY ]  Kurir lokal sedang dalam perjalanan menuju alamat penerima
    │
    ▼
[ DELIVERED ]         Paket telah diterima dengan aman oleh pelanggan
```

### A. Tabel Komparasi Status: Domestik vs Luar Negeri

| Tahap (*State*) | 🇮🇩 Pengiriman Domestik (Indonesia) | ✈️ Pengiriman Luar Negeri (Singapura, Malaysia, Global) |
|---|---|---|
| **1. `ORDERED`** | **Pesanan Dikonfirmasi & Disiapkan**<br>Warehouse mengemas pesanan dan mencetak label resi lokal. | **Pesanan Dikonfirmasi & Siap Ekspor**<br>Warehouse menyiapkan barang bersama dokumen faktur ekspor (*commercial invoice*). |
| **2. `SHIPPED`** | **Diserahkan ke Kurir Ekspedisi**<br>Paket diserahkan ke kurir domestik (JNE, SiCepat, J&T) menuju drop-point awal. | **Penerbangan Kargo Internasional**<br>Paket diserahkan ke kargo internasional (DHL Express, FedEx, EMS Pos Indonesia) dan diterbangkan via udara (*in-flight*). |
| **3. `IN_CUSTOMS`** | **Pusat Sortir Gateway / Hub Transit**<br>Paket tiba di *Distribution Center* / Hub antar-provinsi (tidak ada bea cukai antarnegara). Label: `Hub Transit`. | **Pemeriksaan Bea Cukai di Negara Tujuan**<br>Paket tiba di bandara negara tujuan (*Singapore Customs/ICA*, Kastam Malaysia) untuk inspeksi kepabeanan & pajak impor. Label: `Customs`. |
| **4. `OUT_FOR_DELIVERY`** | **Kurir Menuju Alamat Anda**<br>Kurir lokal terdekat sedang dalam perjalanan mengantar ke pintu rumah pembeli. | **Kurir Lokal Negara Tujuan Mengantar**<br>Paket lolos *clearance* dan diserahkan ke kurir *last-mile* lokal (SingPost, NinjaVan SG, Pos Laju) untuk diantar ke alamat penerima. |
| **5. `DELIVERED`** | **Paket Berhasil Diterima**<br>Paket sukses diterima oleh penerima di alamat tujuan di Indonesia. | **Paket Berhasil Diterima di Negara Tujuan**<br>Paket sukses diterima oleh penerima di negara tujuan (Singapura, Malaysia, dll). |

### B. Mekanisme Adaptasi Dinamis di Sistem
- **Deteksi Negara Tujuan:** Fungsi `getOrderTracking` membaca data JSON `shipping_address.country` pada pesanan.
- **Wording Otomatis:** Jika negara tujuan bukan Indonesia (misal: *Singapore*), fungsi `getTrackingUiDetails(state, country)` otomatis menyisipkan nama negara tujuan pada judul dan deskripsi pelacakan secara *real-time*.
- **Integrasi Webhook Multi-Kurir:** Endpoint `POST /api/webhook/tracking` otomatis mendeteksi dan menormalisasi format webhook dari AfterShip, 17TRACK, Biteship, atau kurir custom ke dalam 5 status universal di atas.

- **File Pengolah:** [`backend/src/controllers/tracking.controller.ts`](file:///home/jeydome/New%20Folder/ladrim/backend/src/controllers/tracking.controller.ts) & [`backend/src/services/tracking.service.ts`](file:///home/jeydome/New%20Folder/ladrim/backend/src/services/tracking.service.ts).
- **Komponen Tampilan:** [`frontend/components/tracking/OrderTracker.tsx`](file:///home/jeydome/New%20Folder/ladrim/frontend/components/tracking/OrderTracker.tsx), [`frontend/app/tracking/page.tsx`](file:///home/jeydome/New%20Folder/ladrim/frontend/app/tracking/page.tsx) & [`frontend/app/account/page.tsx`](file:///home/jeydome/New%20Folder/ladrim/frontend/app/account/page.tsx).

---

## 8. Tabel Referensi Berkas Penting

| Nama Berkas | Lokasi | Tanggung Jawab / Fungsi Utama |
|---|---|---|
| **`start-cloudflare.sh`** | Root | Skrip otomatis menyalakan PostgreSQL, Backend, Frontend, dan Cloudflare Tunnel. |
| **`next.config.mjs`** | `frontend/` | Mengatur rewrite proxy dari frontend `/api/*` ke backend `http://localhost:4000`. |
| **`CartContext.tsx`** | `frontend/context/` | Menyimpan dan memperbarui item keranjang belanja di memori browser. |
| **`api.ts`** | `frontend/lib/` | Wrapper fetcher yang otomatis meminta CSRF token dan menyertakan cookie kredensial. |
| **`server.ts`** | `backend/src/` | Titik masuk Express yang membuka port listen HTTP (port 4000). |
| **`app.ts`** | `backend/src/` | Mendaftarkan middleware keamanan, rute webhook, dan error handler. |
| **`security.ts`** | `backend/src/middlewares/` | Menerapkan Helmet, CORS, proteksi CSRF, dan sanitasi input dari serangan XSS. |
| **`auth.controller.ts`** | `backend/src/controllers/` | Mengatur registrasi OTP Brevo, login user & admin, serta manajemen cookie JWT. |
| **`checkout.controller.ts`** | `backend/src/controllers/` | Menjalankan state machine checkout dan menangani webhook Midtrans secara idempotent. |
| **`schema.sql`** | `backend/src/db/` | Struktur tabel PostgreSQL (users, admins, categories, products, orders, coupons, dll). |
| **`schema.prisma`** | `backend/prisma/` | Pemodelan ORM Prisma untuk kemudahan query database dengan TypeScript. |
