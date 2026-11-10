# Prompt untuk Agent AI

Cara pakai:
1. Letakkan `ALUR_SISTEM.md` (versi revisi) di root proyek.
2. Tempel **Aturan Global** sebagai instruksi tetap agent (system prompt, `CLAUDE.md`, `AGENTS.md`, atau `.cursorrules`).
3. Kerjakan prompt satu per satu sesuai urutan. Jangan gabungkan beberapa prompt dalam satu sesi.
4. Setelah tiap prompt selesai, minta agent menjalankan build, lint, dan tes, lalu commit.

---

## Aturan Global (tempel sekali, berlaku untuk semua tugas)

```
Proyek: LADRIM, e-commerce fashion Indonesia. Acuan utama: ALUR_SISTEM.md.
Baca file itu sebelum mulai. Jika implementasi harus berbeda dari dokumen,
perbarui dokumen di perubahan yang sama.

ATURAN KODE
- Stack: Next.js 14 (App Router), Express + TypeScript, PostgreSQL, Prisma.
- Prisma adalah sumber skema tunggal. Gunakan migrasi. Raw SQL hanya untuk
  kasus khusus (misalnya FOR UPDATE), dan beri komentar alasannya.
- Uang selalu integer rupiah. Jangan pakai float.
- Harga, ongkir, diskon, pajak, dan stok tidak pernah dipercaya dari frontend.
  Semua dihitung di backend (pricing.service).
- Status order hanya boleh diubah lewat order.service. Dilarang UPDATE status
  langsung dari controller.
- Controller tipis. Logika ada di services. Validasi input dengan Zod.
- Semua aksi admin yang sensitif masuk audit_logs.
- Jangan menambah dependensi baru tanpa alasan. Sebutkan jika menambah.
- Tulis tes untuk logika bisnis (pricing, reservasi stok, transisi status,
  webhook). Tes membuat datanya sendiri dan membersihkannya.

ATURAN TAMPILAN (penting)
Hasil tampilan harus terlihat seperti dirancang manusia, bukan template AI.
- Sederhana dan bersih. Sedikit elemen, banyak ruang kosong.
- Teks seminim mungkin. Label 1 sampai 3 kata. Tidak ada paragraf penjelasan,
  tidak ada kalimat sambutan, tidak ada slogan, tidak ada deskripsi fitur di
  halaman.
- Tanpa emoji di mana pun (UI, tombol, toast, email, komentar kode).
- Tanpa ikon dekoratif. Ikon hanya jika benar-benar menggantikan teks
  (keranjang, cari, tutup).
- Tanpa gradien, glow, bayangan tebal, glassmorphism, animasi berlebihan.
  Animasi hanya transisi halus fungsional (buka laci, modal).
- Tanpa kartu di dalam kartu, tanpa badge warna-warni, tanpa judul section
  yang berlebihan.
- Warna, font, dan spasi hanya dari tailwind.config.ts. Jangan hardcode warna.
  Maksimal satu warna aksen.
- Gunakan komponen dasar bersama di components/ui. Jangan membuat gaya baru
  per halaman.
- Bahasa Indonesia, huruf kapital hanya di awal kalimat. Pesan error pendek
  dan spesifik ("Stok tidak cukup"), bukan basa-basi.
- Halaman admin: padat dan fungsional, tabel rapi, tanpa dekorasi.
- Responsif: mobile dulu.

ATURAN DATA
- DILARANG membuat data dummy: tidak ada produk contoh, nama palsu, lorem
  ipsum, gambar placeholder, angka karangan, atau seed produk.
- Semua tampilan membaca dari database atau API. Jika data kosong, tampilkan
  keadaan kosong yang singkat ("Belum ada pesanan") dan, di admin, tombol
  untuk menambah data.
- Satu-satunya data awal yang boleh dibuat: akun owner dari variabel
  lingkungan, role/permission bawaan, dan setting default. Tanpa data lain.
- Jangan menulis angka atau teks palsu "sementara" di komponen.

CARA KERJA
- Kerjakan hanya yang diminta di prompt. Jangan menambah fitur lain.
- Jika ada ambiguitas, tanya satu pertanyaan singkat, jangan menebak.
- Di akhir, laporkan dalam daftar pendek: berkas yang diubah, migrasi baru,
  cara menguji, dan hal yang belum selesai.
```

---

## Prompt 1: Fondasi data dan status order

```
Baca ALUR_SISTEM.md bagian 5, 6.1, dan 14.

Tugas:
1. Rapikan skema ke Prisma sebagai sumber tunggal. Buat migrasi untuk tabel
   di bagian 14 yang belum ada: product_variants, inventory_movements,
   stock_reservations, order_events, payment_events (transaction_id unik),
   refunds, shipments, tracking_events, idempotency_keys, notifications,
   addresses, user_sessions, email_otps, password_resets.
2. Ubah tabel orders: pisahkan payment_status, fulfillment_status,
   order_status sesuai bagian 5. Tambah kolom idempotency_key dan snapshot
   alamat. Pastikan order_items menyimpan snapshot nama, sku, varian, harga.
3. Ubah semua kolom uang menjadi integer rupiah.
4. Buat services/order.service.ts dengan tabel transisi bagian 5. Transisi
   tidak valid ditolak dan setiap transisi menulis order_events.
5. Hapus pemakaian pg Pool untuk query biasa. Pindahkan ke Prisma.
   schema.sql dijadikan referensi saja.
6. Tulis tes untuk semua transisi valid dan invalid.

Jangan menyentuh UI di tugas ini.
```

## Prompt 2: Varian dan inventori

```
Baca ALUR_SISTEM.md bagian 6.1 dan 12 (Produk, Inventori).

Tugas:
1. Buat inventory.service: reserve, commit (paid), release, adjust manual.
   Setiap perubahan menulis inventory_movements (delta, alasan, aktor, ref).
2. Stok tersedia = on_hand - reserved. API katalog hanya mengembalikan
   available.
3. Buat job releaseReservations yang berjalan tiap menit dan melepas
   reservasi kedaluwarsa. Jalankan lewat start-cloudflare.sh.
4. Reservasi memakai transaksi database dan penguncian baris untuk mencegah
   oversell saat banyak request bersamaan.
5. Tes konkurensi: 20 request bersamaan untuk stok 1 hanya menghasilkan satu
   reservasi berhasil.

Tanpa UI. Tanpa data produk contoh.
```

## Prompt 3: Pricing, kupon, dan checkout

```
Baca ALUR_SISTEM.md bagian 6.2 dan 10 (CSRF).

Tugas:
1. Buat pricing.service sebagai satu-satunya penghitung total: subtotal,
   diskon kupon, ongkir, pajak, total. Semua integer.
2. Buat coupon.service: validasi, kuota total dan per user, konsumsi atomik,
   pelepasan saat order gagal atau expired.
3. Buat middleware idempotency. POST /api/checkout wajib header
   Idempotency-Key. Key yang sama mengembalikan order yang sama.
4. Refactor POST /api/checkout sesuai alur: satu transaksi yang menghitung
   ulang harga, reservasi stok, membuat order (unpaid), snapshot item dan
   alamat, konsumsi kupon, lalu minta Snap Token dan set pending.
5. Endpoint bayar ulang untuk order pending selama reservasi masih berlaku.
6. Tes: manipulasi harga dari klien diabaikan, klik ganda tidak membuat
   order ganda, total ke Midtrans sama dengan total database.
```

## Prompt 4: Webhook Midtrans

```
Baca ALUR_SISTEM.md bagian 7.

Tugas:
1. Pindahkan route ke POST /api/webhooks/midtrans. Pakai raw body. Kecualikan
   dari CSRF dan sanitasi.
2. Verifikasi signature SHA512(order_id + status_code + gross_amount +
   ServerKey) dan cocokkan gross_amount dengan database.
3. Konfirmasi lewat Status API sebelum mengubah order.
4. Simpan payment_events dengan transaction_id unik. Duplikat dijawab 200
   tanpa efek.
5. Tangani: capture (fraud_status challenge), settlement, pending, deny,
   cancel, expire, refund, chargeback. Gunakan order.service. Notifikasi
   tidak berurutan tidak boleh menurunkan status.
6. Saat paid: commit stok, jadwalkan email konfirmasi.
7. Halaman /checkout/success membaca status dari GET /api/orders/:id dan
   polling sampai status final atau batas waktu. Tampilan: satu baris status
   dan nomor order, tanpa teks tambahan.
8. Tes untuk tiap status, duplikat, out-of-order, signature salah, amount
   tidak cocok.
```

## Prompt 5: Autentikasi

```
Baca ALUR_SISTEM.md bagian 10.

Tugas:
1. Pindahkan OTP dari memori ke tabel email_otps: simpan hash, kedaluwarsa
   10 menit, maksimal 5 percobaan, cooldown kirim ulang 60 detik, rate limit
   per email dan IP.
2. Ubah cookie ke sameSite=lax. Pastikan sesi tetap ada setelah kembali dari
   Midtrans.
3. Tambah lupa password dan reset password (token sekali pakai, kedaluwarsa),
   ganti password, logout semua perangkat (user_sessions).
4. Halaman auth: login, daftar, lupa password, reset. Form minimal: label
   singkat, satu tombol, pesan error pendek. Tanpa ilustrasi atau teks promosi.
5. Tes untuk batas percobaan OTP, kedaluwarsa, dan reuse token reset.
```

## Prompt 6: Alamat dan ongkir

```
Baca ALUR_SISTEM.md bagian 6.2 dan 11.

Tugas:
1. Buat buku alamat: beberapa alamat per user, satu default. Field:
   penerima, telepon, provinsi, kota, kecamatan, kelurahan, kode pos, detail.
2. Integrasikan Biteship atau RajaOngkir (tanya saya mana yang dipakai bila
   belum ditentukan). Kunci API dari env. Alamat gudang dari setting admin.
3. shipping.service menghitung tarif dari berat dan alamat, mengembalikan
   daftar kurir dan layanan. Server menghitung ulang ongkir yang dipilih saat
   checkout.
4. UI checkout: pilih alamat, pilih kurir, ringkasan. Maksimal tiga langkah
   di satu halaman, tanpa teks penjelas.
5. Tes: ongkir dari klien ditolak, layanan tidak tersedia ditangani.
```

## Prompt 7: Storefront katalog dan keranjang

```
Baca ALUR_SISTEM.md bagian 11 dan Aturan Tampilan.

Tugas:
1. Katalog /shop: filter, sort, pagination, pencarian lewat endpoint backend.
2. Halaman produk: galeri, pemilih varian (ukuran, warna), harga, status
   stok dari available. Tombol tambah ke keranjang. Tanpa deskripsi
   tambahan di luar data produk.
3. Keranjang: tamu di localStorage, user login di server, digabung saat
   login. Validasi ulang harga dan stok saat keranjang dibuka. Item yang
   stoknya habis ditandai singkat.
4. Semua data dari API. Jika belum ada produk, tampilkan keadaan kosong
   singkat. Jangan membuat produk contoh.
5. Cache: katalog boleh ISR dengan revalidasi tag. Keranjang dan checkout
   tanpa cache.
```

## Prompt 8: Akun, riwayat order, pembatalan

```
Baca ALUR_SISTEM.md bagian 9 dan 11.

Tugas:
1. /account: profil, alamat, riwayat order.
2. /account/orders/[id]: item, total, status pembayaran, linimasa tracking,
   resi, invoice PDF, tombol sesuai status (bayar, batal, lacak, ajukan retur).
3. Pembatalan: belum dibayar membatalkan dan melepas reservasi dan kupon.
   Sudah dibayar dan belum shipped memicu refund penuh lewat payment.service
   dan mengembalikan stok. Setelah shipped tombol batal tidak tersedia.
4. Lacak tanpa login di /tracking: nomor order dan email.
5. Halaman statis dari tabel pages: syarat, privasi, retur, pengiriman.
   Isi diisi lewat admin, jangan menulis isi karangan.
```

## Prompt 9: Admin dasar dan keamanan

```
Baca ALUR_SISTEM.md bagian 10 dan 12. Ikuti Aturan Tampilan (admin padat,
fungsional, tanpa dekorasi).

Tugas:
1. Sesi admin terpisah (cookie dan middleware adminAuth). Login dengan rate
   limit. 2FA TOTP wajib, termasuk setup dan kode pemulihan.
2. RBAC granular: roles dan permissions per modul dan aksi. Role bawaan:
   owner, admin, gudang, cs, finance. Middleware rbac memeriksa izin per
   route.
3. audit middleware untuk semua aksi sensitif. Halaman audit dengan filter.
4. Layout admin: sidebar teks saja, tabel dengan pencarian dan filter,
   komponen dari components/ui.
5. Akun owner dibuat dari env saat pertama jalan. Tidak ada seed lain.
```

## Prompt 10: Admin produk, inventori, order, pembayaran

```
Baca ALUR_SISTEM.md bagian 8, 9, dan 12.

Tugas:
1. Produk: CRUD, varian dan SKU, unggah gambar, harga dan harga coret,
   status draft/published/archived, kategori, berat dan dimensi. Perubahan
   memicu revalidateTag dan masuk audit.
2. Inventori: stok per varian, penyesuaian dengan alasan wajib, riwayat
   movement, ambang stok menipis.
3. Order: daftar dan filter, detail, ubah fulfillment lewat order.service,
   input resi atau booking kurir, cetak packing slip dan label, catatan
   internal, pembatalan.
4. Pembayaran: daftar payment_events, tangani challenge, refund penuh dan
   parsial dengan konfirmasi ulang. Refund masuk tabel refunds dan memanggil
   Midtrans Refund API.
5. Dashboard: perlu diproses, stok menipis, pembayaran bermasalah, omzet hari
   ini. Semua dari query, tanpa angka tetap.
```

## Prompt 11: Tracking dan notifikasi

```
Baca ALUR_SISTEM.md bagian 8 dan 15.

Tugas:
1. POST /api/webhooks/tracking dengan verifikasi secret atau signature.
   Normalisasi ke tracking_events dan perbarui fulfillment_status lewat
   order.service.
2. Komponen OrderTracker membaca tracking_events. Lima tahap turunan: Dipesan,
   Dikirim, Transit, Diantar, Diterima. Teks hanya nama tahap dan waktu.
3. Hapus semua logika dan teks internasional/customs dari tracking.service
   (domestik saja, lihat bagian 16).
4. email.service: konfirmasi order, pengingat bayar, pembayaran diterima,
   dikirim (resi), diterima, reset password, retur disetujui, refund diproses.
   Dipicu dari event order, dicatat di notifications. Template singkat,
   teks polos dan rapi, tanpa emoji, tanpa gambar dekoratif.
5. Job paymentReminder dan autoComplete.
```

## Prompt 12: Retur, kupon admin, konten, laporan

```
Baca ALUR_SISTEM.md bagian 9 dan 12.

Tugas:
1. Retur: pengajuan pelanggan (item, alasan, foto) dalam jendela retur dari
   setting. Admin setujui atau tolak, tandai barang diterima, stok
   dikembalikan jika layak, refund penuh atau parsial.
2. Admin kupon: tipe persen, nominal, gratis ongkir, minimal belanja, kuota
   total dan per user, masa berlaku.
3. Admin konten: banner, koleksi unggulan, halaman statis, menu. Homepage
   membaca dari sini dan ditampilkan seadanya jika kosong.
4. Admin pengiriman dan pengaturan: alamat gudang, kurir aktif, batas waktu
   bayar, jendela retur, pajak.
5. Laporan: penjualan per periode, produk terlaris, penggunaan kupon,
   refund. Ekspor CSV.
```

## Prompt 13: Audit akhir

```
Lakukan audit terhadap kode dibanding ALUR_SISTEM.md. Jangan mengubah kode
kecuali bug yang jelas. Laporkan dalam daftar pendek:
1. Bagian dokumen yang belum diimplementasi (centang checklist bagian 18).
2. Tempat yang mengubah status order tanpa order.service.
3. Tempat yang memakai float untuk uang atau mempercayai harga dari klien.
4. Endpoint pengubah data tanpa CSRF, validasi, atau audit (kecuali webhook).
5. Data dummy, teks placeholder, emoji, atau warna hardcode yang tersisa.
6. Halaman yang memakai teks berlebihan dan sebaiknya dipangkas.
Urutkan dari paling berbahaya.
```

---

## Tips

- Jika agent menghasilkan tampilan yang masih ramai, kirim: "Pangkas teks dan elemen dekoratif di halaman ini sesuai Aturan Tampilan. Hapus semua yang tidak dibutuhkan untuk menyelesaikan tugas pengguna."
- Jika agent membuat data contoh, kirim: "Hapus semua data dummy. Tampilkan keadaan kosong singkat sebagai gantinya."
- Selalu minta tes dijalankan sebelum lanjut ke prompt berikutnya.
