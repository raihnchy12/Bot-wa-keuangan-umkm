# BACKLOG — WhatsApp Finance Bot

## 1. Product Goal

**WhatsApp Finance Bot** (Aplikasi Laporan Keuangan & Kas Berbasis WhatsApp untuk UMKM) bertujuan untuk membantu pemilik Usaha Mikro, Kecil, dan Menengah (UMKM) mencatat transaksi keuangan harian (pemasukan dan pengeluaran) secara praktis dan otomatis.

Melalui percakapan bahasa alami (pesan teks dan pesan suara / voice note) di WhatsApp, sistem memanfaatkan AI/NLP untuk mengekstrak data transaksi terstruktur, meminta konfirmasi pengguna, menyimpan data ke database PostgreSQL/Neon, dan menyediakan laporan keuangan kas sederhana secara instan tanpa membebani UMKM dengan kerumitan sistem akuntansi konvensional.

---

## 2. MVP Scope

Scope MVP (Minimum Viable Product) dirancang untuk diselesaikan dalam kurun waktu **30 hari** oleh **1 developer (beginner/intermediate)** dengan fitur utama:

1. **User & Business Management (Onboarding Otomatis):**
   - Registrasi pengguna otomatis berdasarkan nomor WhatsApp.
   - Pembuatan profil usaha (Business) otomatis untuk pengguna baru.
   - Isolasi data antar bisnis (Multi-tenant data isolation).

2. **Pencatatan Transaksi Keuangan (Teks & Voice Note):**
   - Transaksi Pemasukan (Income) dan Pengeluaran (Expense).
   - Ekstraksi otomatis data nominal, kategori, deskripsi, dan tanggal dari teks atau pesan suara.
   - Dukungan pencatatan banyak transaksi dalam satu pesan (Multiple Transactions).

3. **AI/NLP Processing & Alur Konfirmasi (Confirmation Flow):**
   - Integrasi OpenAI API (Structured Output / JSON Schema).
   - Validasi data transaksi (penanganan nominal hilang `amount: number | null`, ambiguitas, dll).
   - State konfirmasi transaksi (`WAITING_CONFIRMATION`) sebelum data disimpan ke database.

4. **Laporan Keuangan Kas Sederhana (Financial Report):**
   - Laporan Harian, Mingguan, dan Bulanan.
   - Kalkulasi Total Pemasukan, Total Pengeluaran, dan Selisih (Laba/Rugi Sederhana).
   - Format laporan ramah WhatsApp.

5. **Manajemen Transaksi (Transaction Management):**
   - Riwayat transaksi terbaru.
   - Pembatalan / penghapusan transaksi terakhir.
   - Pengeditan transaksi.

6. **Infrastruktur & Produksi:**
   - Webhook WhatsApp Cloud API dengan verifikasi keamanan & penanganan duplikasi.
   - Deployment ke environment production (Cloud Server / Serverless Database).

---

## 3. Tech Stack

| Komponen           | Teknologi / Library        | Keterangan                                     |
| ------------------ | -------------------------- | ---------------------------------------------- |
| **Runtime**        | Node.js (v18+)             | Environment eksekusi JavaScript/TypeScript     |
| **Framework**      | Express.js                 | Framework HTTP web server                      |
| **Language**       | TypeScript                 | Type-safe programming language                 |
| **ORM**            | Prisma ORM                 | Type-safe Object-Relational Mapping            |
| **Database**       | PostgreSQL / Neon          | Relational database host (Serverless Cloud DB) |
| **WhatsApp API**   | WhatsApp Cloud API         | Official WhatsApp Business Platform API        |
| **AI / NLP**       | OpenAI API (`gpt-4o-mini`) | Structured Output JSON extraction              |
| **Speech-to-Text** | OpenAI Whisper API         | Transkripsi audio voice note ke teks           |
| **HTTP Client**    | Axios                      | HTTP client untuk komunikasi API external      |
| **Configuration**  | `dotenv`                   | Environment variable manager                   |

---

## 4. Definition of Done

Sebuah task dianggap **Completed** (`[x]`) apabila memenuhi syarat berikut:

- [ ] Implementasi fungsi sesuai dengan requirement pada `PRD.md` dan deskripsi task.
- [ ] Seluruh **Acceptance Criteria** pada task terpenuhi.
- [ ] Pengecekan tipe TypeScript berhasil tanpa error (`npm run typecheck`).
- [ ] Tidak ada error major / crash runtime yang belum ditangani.
- [ ] Kode telah diuji secara manual maupun otomatis sesuai kebutuhan unit/integration test.
- [ ] Tidak menyebabkan _regression_ atau merusak fungsi/scope fitur lain yang sudah berjalan.
- [ ] Environment variables dan konfigurasi terkait telah didokumentasikan dengan benar.
- [ ] Status task pada `BACKLOG.md` diperbarui.

---

## 5. Status Legend

- `[ ]` **Not Started:** Task belum mulai dikerjakan.
- `[-]` **In Progress:** Task sedang aktif dikerjakan.
- `[x]` **Completed:** Task selesai dan memenuhi Definition of Done.
- `[!]` **Blocked:** Task terhambat oleh dependency atau kendala teknis.

---

## 6. Priority Legend

- **P0 (Mandatory MVP):** Fitur krusial yang wajib ada untuk keberhasilan MVP 30 hari.
- **P1 (Important):** Fitur penting untuk kestabilan, handling error, dan kenyamanan pengguna.
- **P2 (Nice to Have / Post-MVP):** Fitur opsional atau pengembangan tahap selanjutnya.

---

## 7. Sprint Overview

### Timeline Sprint

```text
Sprint 1 = Day 1–7   : Backend & Database
Sprint 2 = Day 8–14  : WhatsApp Integration
Sprint 3 = Day 15–21 : AI/NLP & Confirmation Flow
Sprint 4 = Day 22–30 : Voice Note, Reporting, Testing & Production
```

### Tabel Ringkasan Sprint

| Sprint       | Durasi    | Fokus Utama                                | Status          |
| ------------ | --------- | ------------------------------------------ | --------------- |
| **Sprint 1** | Day 1–7   | Backend & Database Foundation              | [ ] Not Started |
| **Sprint 2** | Day 8–14  | WhatsApp Cloud API Integration             | [ ] Not Started |
| **Sprint 3** | Day 15–21 | AI/NLP Engine & Transaction Confirmation   | [ ] Not Started |
| **Sprint 4** | Day 22–30 | Voice Note, Financial Reports & Production | [ ] Not Started |

### Progress Summary

| Metric                  |  Value |
| ----------------------- | -----: |
| **Total Tasks**         |     73 |
| **Completed (`[x]`)**   |      0 |
| **In Progress (`[-]`)** |      0 |
| **Blocked (`[!]`)**     |      0 |
| **Not Started (`[ ]`)** |     73 |
| **Progress Percentage** | **0%** |

---

## Sprint 1 — Backend & Database

**Sprint Goal:** Menyiapkan fondasi backend Node.js + Express + TypeScript, schema database Prisma PostgreSQL, serta service dasar untuk User, Business, Transaction, dan Calculation Engine.

---

### Epic 1 — Project Setup

#### BE-001 — Initialize TypeScript Express Project

- **Priority:** P0
- **Sprint:** Sprint 1
- **Estimate:** 2h
- **Dependencies:** None
- **Status:** [ ] Not Started

**Description:**
Membuat struktur dasar project Node.js, memasang dependency Express.js, TypeScript, ts-node, nodemon, dan konfigurasi skrip `package.json`.

**Acceptance Criteria:**

- [x] Project Node.js terinisialisasi (`package.json` tersedia)
- [x] Dependency `express`, `typescript`, `@types/node`, `@types/express`, `ts-node-dev` terpasang
- [x] File `tsconfig.json` dikonfigurasi dengan aturan strict type checking
- [x] Struktur folder src (`src/controllers`, `src/services`, `src/routes`, `src/utils`, `src/config`) terbentuk
- [x] HTTP Server Express dasar berjalan pada port lokal
- [x] Skrip `npm run dev`, `npm run build`, dan `npm run typecheck` berfungsi tanpa error

---

#### BE-002 — Configure Environment Variables & Config Module

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 1h
|- **Dependencies:** BE-001
|- **Status:** [x] Completed

**Description:**
Menyediakan modul utilitas konfigurasi terpusat untuk membaca environment variables menggunakan `dotenv` dan TypeScript interface.

**Acceptance Criteria:**
|- [x] Dependency `dotenv` terpasang
|- [x] File `.env.example` dibuat dengan variabel standar (`PORT`, `NODE_ENV`, `DATABASE_URL`, `WHATSAPP_TOKEN`, `OPENAI_API_KEY`)
|- [x] Modul `src/config/env.ts` membaca variabel lingkungan dengan Type Validation
|- [x] Server memberikan error fatal dan berhenti jika variabel lingkungan wajib tidak diset

---

#### BE-003 — Implement Centralized Error Handler Middleware

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** BE-001
|- **Status:** [ ] Not Started

**Description:**
Membuat Express middleware terpusat untuk menangani async errors, kustom HTTP AppError, dan mencegah server crash akibat unhandled error.

**Acceptance Criteria:**

- [x] Class custom error (`AppError`) dibuat dengan properti `statusCode` dan `isOperational`
- [x] Middleware error handling terpasang di rute Express paling bawah
- [x] Respon JSON error memiliki struktur konsisten (`{ status: 'error', message: '...' }`)
- [x] Internal error 500 disembunyikan detail stack trace-nya saat `NODE_ENV=production`

---

#### BE-004 — Setup Logger Middleware

- **Priority:** P1
- **Sprint:** Sprint 1
- **Estimate:** 1h
- **Dependencies:** BE-001
- **Status:** [x] Completed

**Description:**
Membuat middleware logging HTTP request untuk mencatat request method, URL, status code, dan response time.

**Acceptance Criteria:**

- [x] Logger middleware dibuat menggunakan `morgan` atau utilitas console logger terstruktur
- [x] Setiap incoming HTTP request mencatat timestamp, HTTP Method, URL, dan Response Status Code
- [x] Sensitif data (seperti token / authorization header) tidak ditampilkan dalam log

---

#### BE-005 — Setup Health Check Endpoint

- **Priority:** P0
- **Sprint:** Sprint 1
- **Estimate:** 1h
- **Dependencies:** BE-001
- **Status:** [x] Completed

**Description:**
Membuat endpoint HTTP `GET /health` untuk memverifikasi status operasional server dan waktu aktif (uptime).

**Acceptance Criteria:**

- [x] Endpoint `GET /health` mengembalikan status HTTP 200 OK
- [x] Payload respon berisi `{ status: 'ok', timestamp: '...', uptime: 123 }`
- [x] Endpoint dapat diakses secara publik tanpa autentikasi

---

### Epic 2 — Database

#### DB-001 — Setup PostgreSQL / Neon Database Connection & Prisma CLI

- **Priority:** P0
- **Sprint:** Sprint 1
- **Estimate:** 2h
- **Dependencies:** BE-002
- **Status:** [x] Completed

**Description:**
Menghubungkan project Node.js ke database PostgreSQL / Neon menginstal Prisma CLI dan menginisialisasi folder Prisma.

**Acceptance Criteria:**

- [x] Package `@prisma/client` dan `prisma` dev dependency terpasang
- [x] Berhasil menjalankan `npx prisma init` (folder `prisma/` dan `prisma/schema.prisma` terbentuk)
- [x] `DATABASE_URL` pada `.env` dikonfigurasi menuju instance PostgreSQL / Neon
- [x] Database connection test berhasil

---

#### DB-002 — Define Prisma Schema for User Model

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** DB-001
|- **Status:** [x] Completed

**Description:**
Mendefinisikan skema Prisma untuk entitas `User` yang menyimpan identitas pengguna bot WhatsApp.

**Acceptance Criteria:**

- [x] Model `User` dibuat di `prisma/schema.prisma`
- [x] Properti: `id` (UUID/String, PK), `name` (String), `phoneNumber` (String, Unique), `createdAt` (DateTime), `updatedAt` (DateTime)
- [x] Constraint unique dipasang pada `phoneNumber`
- [x] Index dipasang pada field `phoneNumber` untuk query cepat

---

#### DB-003 — Define Prisma Schema for Business Model & User-Business Relation

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** DB-002
|- **Status:** [x] Completed

**Description:**
Mendefinisikan skema Prisma untuk entitas `Business` (profil UMKM) dan relasi Foreign Key dengan `User` sesuai model PRD.

**Acceptance Criteria:**

- [x] Model `Business` dibuat di `prisma/schema.prisma`
- [x] Properti: `id` (UUID/String, PK), `userId` (FK), `name` (String), `createdAt` (DateTime), `updatedAt` (DateTime)
- [x] Relasi Foreign Key dipasang menunjuk ke `User.id`
- [x] Index dipasang pada `userId` untuk pencarian data bisnis cepat

---

#### DB-004 — Define Prisma Schema for Transaction Model

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** DB-003
|- **Status:** [x] Completed

**Description:**
Mendefinisikan skema Prisma untuk entitas `Transaction` dengan penanganan presisi nominal `Decimal`.

**Acceptance Criteria:**

- [x] Model `Transaction` dibuat di `prisma/schema.prisma`
- [x] Properti: `id` (UUID, PK), `businessId` (FK), `type` (Enum: `INCOME`, `EXPENSE`), `amount` (Decimal(15,2)), `category` (String), `description` (String?), `transactionDate` (DateTime), `createdAt` (DateTime), `updatedAt` (DateTime)
- [x] Tipe data `amount` menggunakan Prisma `Decimal` untuk menghindari floating-point rounding issue
- [x] Index komposit dipasang pada `(businessId, transactionDate)` dan `(businessId, type)`

---

#### DB-005 — Define Prisma Schema for ConversationState Model

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** DB-002
|- **Status:** [x] Completed

**Description:**
Mendefinisikan skema Prisma untuk entitas `ConversationState` guna menyimpan state percakapan WhatsApp (misal: penanganan konfirmasi transaksi).

**Acceptance Criteria:**

- [x] Model `ConversationState` dibuat di `prisma/schema.prisma`
- [x] Properti: `id` (UUID, PK), `userId` (FK, Unique), `state` (String), `payload` (Json?), `expiresAt` (DateTime?), `createdAt` (DateTime), `updatedAt` (DateTime)
- [x] Relasi FK menunjuk ke `User.id`
- [x] Field `payload` mendukung tipe JSON bervariasi

---

#### DB-006 — Run Prisma Migrations & Generate Client

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 1h
|- **Dependencies:** DB-004, DB-005
|- **Status:** [x] Completed

**Description:**
Menjalankan Prisma migration untuk membuat tabel-tabel di database PostgreSQL dan men-generate Prisma Client TypeScript.

**Acceptance Criteria:**

|- [x] Perintah `npx prisma db push` berhasil dieksekusi tanpa error
|- [x] Tabel `User`, `Business`, `Transaction`, dan `ConversationState` terbentuk di database
|- [x] Perintah `npx prisma generate` berhasil men-generate tipe TypeScript terkini
|- [x] `npm run typecheck` passed tanpa error

---

#### DB-007 — Create Database Seed Script & Test Database Queries

|- **Priority:** P1
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** DB-006
|- **Status:** [x] Completed

**Description:**
Membuat file seed database (`prisma/seed.ts`) untuk memasukkan data uji (mock user, business, dan transaksi) untuk pengujian.

**Acceptance Criteria:**

|- [x] File `src/prisma/seed.ts` dibuat dan dikonfigurasi pada `package.json`
|- [x] Skrip dapat mengisi sampel 1 User, 1 Business, dan 5 Transaksi (Income & Expense)
|- [x] Perintah `npx prisma db seed` berjalan lancar
|- [x] `npm run typecheck` passed tanpa error

---

### Epic 3 — User & Business

#### BE-006 — Create User Repository & Service

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** DB-006
|- **Status:** [x] Completed

**Description:**
Membuat layer akses data (Repository) dan bisnis logika (Service) untuk operasi CRUD User berdasarkan nomor telepon WhatsApp.

**Acceptance Criteria:**

|- [x] Service `findUserByPhoneNumber(phoneNumber)` berhasil mengambil data User
|- [x] Service `createUser(data)` berhasil menyimpan User baru
|- [x] Penanganan error jika nomor telepon sudah terdaftar
|- [x] `npm run typecheck` passed tanpa error

---

#### BE-007 — Create Business Repository & Service with Multi-tenant Isolation

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 3h
|- **Dependencies:** DB-006, BE-006
|- **Status:** [x] Completed

**Description:**
Membuat Service untuk mengelola data bisnis UMKM dan memastikan isolasi data antar bisnis (_multi-tenant business isolation_).

**Acceptance Criteria:**

|- [x] Service `createBusinessForUser(userId, businessName)` terimplementasi
|- [x] Service `getBusinessByUserId(userId)` terimplementasi
|- [x] Fungsi pencarian data bisnis wajib menyertakan filter `userId` untuk mencegah kebocoran data antar UMKM
|- [x] Multi-tenant isolation verified dengan test script
|- [x] `npm run typecheck` passed tanpa error

---

#### BE-008 — Implement Automated User & Business Onboarding Logic

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 3h
|- **Dependencies:** BE-006, BE-007
|- **Status:** [x] Completed

**Description:**
Membuat logika alur otomatisasi registrasi pengguna dan bisnis saat pertama kali berinteraksi via WhatsApp sesuai ketentuan PRD.

**Acceptance Criteria:**

|- [x] Method `getOrCreateUserAndBusiness(phoneNumber, pushName)` terimplementasi
|- [x] Jika nomor telepon belum ada di database, buat entitas `User` baru dan entitas `Business` terkait secara atomik dalam 1 transaksi Prisma
|- [x] Menggunakan data profil pengguna/nama bisnis tanpa menambahkan format penamaan yang tidak ada pada PRD
|- [x] Jika nomor sudah terdaftar, kembalikan entitas `User` dan `Business` yang ada
|- [x] Atomic transaction verified dengan test script (BEGIN-COMMIT pattern)
|- [x] `npm run typecheck` passed tanpa error

---

### Epic 4 — Transaction

#### TRX-001 — Create Transaction Repository & Basic Service Layer

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 3h
|- **Dependencies:** DB-006, BE-007
|- **Status:** [x] Completed

**Description:**
Membuat repository & service layer dasar untuk mengelola transaksi keuangan di database.

**Acceptance Criteria:**

|- [x] Method `createTransaction(data)` terimplementasi
|- [x] Method `getTransactionsByBusinessId(businessId, filter)` terimplementasi
|- [x] Menerima dan mengubah nilai number/string menjadi format `Prisma.Decimal`
|- [x] Validasi amount > 0 dan tipe transaksi valid
|- [x] Filter support (type INCOME/EXPENSE, date range, category)
|- [x] Multi-tenant isolation dengan businessId guard
|- [x] `npm run typecheck` passed tanpa error

---

#### TRX-002 — Implement Single Transaction Creation Logic

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** TRX-001
|- **Status:** [x] Completed

**Description:**
Membuat service untuk memvalidasi dan menyimpan 1 entitas transaksi (Income / Expense) ke database dengan `businessId` terisolasi.

**Acceptance Criteria:**

|- [x] Menerima objek data transaksi terstruktur (`businessId`, `type`, `amount`, `category`, `description`, `transactionDate`)
|- [x] Memvalidasi bahwa `amount` > 0 dan `type` adalah `INCOME` atau `EXPENSE`
|- [x] Transaksi berhasil disimpan ke database dan mengembalikan record transaksi terformat
|- [x] Validasi error handling untuk amount invalid, tipe salah, zero/negative amount
|- [x] `npm run typecheck` passed tanpa error

---

#### TRX-003 — Implement Multi-tenant Isolation Guard for Transaction Access

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** TRX-001
|- **Status:** [x] Completed

**Description:**
Memastikan bahwa setiap query transaksi selalu terkunci berdasarkan `businessId` milik pengguna yang sedang aktif.

**Acceptance Criteria:**

|- [x] Query pencarian, pembacaan, pengeditan, dan penghapusan transaksi selalu menambahkan clause `WHERE businessId = activeBusinessId`
|- [x] Pengguna dari UMKM A tidak dapat melihat atau mengubah transaksi milik UMKM B
|- [x] Multi-tenant isolation tested dengan 7 comprehensive scenarios
|- [x] Update & Delete operations dengan businessId guard
|- [x] `npm run typecheck` passed tanpa error

---

### Epic 5 — Report

#### RPT-001 — Implement Income & Expense Aggregation Engine

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 3h
|- **Dependencies:** TRX-001
|- **Status:** [x] Completed

**Description:**
Membuat engine kalkulasi statistik keuangan yang melakukan penjumlahan (SUM) total pemasukan dan pengeluaran berdasarkan rentang tanggal.

**Acceptance Criteria:**

|- [x] Function `aggregateFinancials(businessId, startDate, endDate)` terimplementasi
|- [x] Menghitung `totalIncome` = SUM(amount) WHERE `type` = 'INCOME'
|- [x] Menghitung `totalExpense` = SUM(amount) WHERE `type` = 'EXPENSE'
|- [x] Mengembalikan jumlah total transaksi (`transactionCount`)
|- [x] Null values ditangani dengan benar (return 0, bukan null)
|- [x] Multi-tenant isolation enforced dengan businessId filter
|- [x] Decimal precision maintained untuk financial calculations
|- [x] `npm run typecheck` passed tanpa error

---

#### RPT-002 — Implement Net Financial Summary Calculation

|- **Priority:** P0
|- **Sprint:** Sprint 1
|- **Estimate:** 2h
|- **Dependencies:** RPT-001
|- **Status:** [x] Completed

**Description:**
Membuat perhitungan selisih pemasukan dan pengeluaran ("Selisih pemasukan-pengeluaran" / laba rugi sederhana).

**Acceptance Criteria:**

|- [x] Formula: `netAmount` = `totalIncome` - `totalExpense`
|- [x] Menggunakan penamaan istilah "Selisih pemasukan-pengeluaran" atau "Laba sederhana" (bukan istilah akuntansi kompleks)
|- [x] Mengembalikan status arus kas: Positif (Surplus), Negatif (Defisit), atau Seimbang

---

## Sprint 2 — WhatsApp Integration

**Sprint Goal:** Bot dapat menerima webhook pesan masuk dari WhatsApp Cloud API, memverifikasi webhook, menangani State percakapan, dan mengalirkan pesan balik ke pengguna.

---

### Epic 6 — WhatsApp Setup

#### WA-001 — Configure WhatsApp Cloud API Credentials & Axios Client

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 2h
|- **Dependencies:** BE-002
|- **Status:** [x] Completed

**Description:**
Membuat HTTP Client terkonfigurasi (Axios instance) khusus untuk memanggil Graph API WhatsApp Cloud API dengan token autentikasi.

**Acceptance Criteria:**

- [x] Variabel `.env` terkonfigurasi: `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_VERIFY_TOKEN`
- [x] Axios client terkonfigurasi dengan base URL `https://graph.facebook.com/v19.0/` dan Authorization Bearer token header
- [x] Modul helper terpisah untuk menangani error response dari Meta API

---

#### WA-002 — Implement WhatsApp Phone Number Normalization Utility

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 2h
|- **Dependencies:** BE-001
|- **Status:** [x] Completed

**Description:**
Membuat fungsi utilitas untuk menormalisasi format nomor WhatsApp dari pengguna ke format standar internasional (misal: `0812xxx` -> `62812xxx`).

**Acceptance Criteria:**

- [x] Utility `normalizePhoneNumber(phone)` dibuat
- [x] Mengubah `08123456789` menjadi `628123456789`
- [x] Mengapus karakter non-digit (spasi, strip, tanda tambah)
- [x] Mengembalikan format string bersih siap simpan di DB

---

### Epic 7 — Webhook

#### WA-003 — Implement Webhook Verification Endpoint (`GET /webhook`)

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 2h
|- **Dependencies:** BE-001, WA-001
|- **Status:** [x] Completed

**Description:**
Membuat endpoint `GET /webhook` untuk menangani tantangan verifikasi webhook (_Verification Request_) dari Meta WhatsApp Cloud API.

**Acceptance Criteria:**

- [x] Endpoint `GET /webhook` membaca query params `hub.mode`, `hub.verify_token`, `hub.challenge`
- [x] Membandingkan `hub.verify_token` dengan `WA_VERIFY_TOKEN` pada `.env`
- [x] Jika valid & mode `subscribe`, respon dengan status HTTP 200 dan mengembalikan string `hub.challenge`
- [x] Jika tidak valid, mengembalikan status HTTP 403 Forbidden

---

#### WA-004 — Implement Webhook Receiver Endpoint (`POST /webhook`)

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 2h
|- **Dependencies:** WA-003
|- **Status:** [x] Completed

**Description:**
Membuat endpoint `POST /webhook` untuk menerima notifikasi payload event dari WhatsApp (pesan masuk, status kirim).

**Acceptance Criteria:**

- [x] Endpoint `POST /webhook` menerima payload JSON dari Meta
- [x] Segera mengembalikan HTTP status 200 OK ke Meta untuk mencegah _webhook timeout_
- [x] Meneruskan payload ke service pemroses pesan secara asynchronous

---

#### WA-005 — Implement Webhook Deduplication & Signature Verification Middleware

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 3h
|- **Dependencies:** WA-004
|- **Status:** [x] Completed

**Description:**
Membuat middleware untuk memverifikasi `x-hub-signature-256` dari Meta (HMAC SHA256) dan mencegah pemrosesan ulang pesan duplikat (_duplicate webhook delivery_).

**Acceptance Criteria:**

|- [x] Verifikasi HMAC SHA256 signature pada header request menggunakan App Secret Meta
|- [x] Menyimpan `message_id` WhatsApp dalam cache / in-memory set sementara
|- [x] Jika `message_id` yang sama masuk kembali, abaikan pemrosesan dan langsung respon 200 OK

---

#### WA-006 — Handle WhatsApp Webhook Errors & Retries

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 2h
|- **Dependencies:** WA-004
|- **Status:** [x] Completed

**Description:**
Membuat mekanisme penanganan error pada webhook agar masalah teknis pada internal bot tidak menyebabkan pembatalan webhook oleh Meta.

**Acceptance Criteria:**

|- [x] Seluruh error internal saat memproses pesan ditangkap oleh block `try-catch`
|- [x] HTTP status 200 OK tetap dikembalikan ke Meta meski terjadi error internal bot
|- [x] Error internal dicatat dalam log terstruktur tanpa menghentikan process listener

---

### Epic 8 — Message Processing

#### WA-007 — Parse Incoming WhatsApp Message Payload

|- **Priority:** P0
|- **Sprint:** Sprint 2
|- **Estimate:** 3h
|- **Dependencies:** WA-004
|- **Status:** [x] Completed 

**Description:**
Mengekstrak informasi penting dari payload webhook WhatsApp (tipe pesan: text, audio, button, sender phone, push name, message body/media ID).

**Acceptance Criteria:**

|- [x] Extractor utility dapat membaca pesan tipe `text` dan `audio`
|- [x] Mengambil `from` (nomor pengirim), `name` (pushName), `msgId`, dan `timestamp`
|- [x] Mengabaikan status update notification (misal: read/delivered receipt)

---

#### WA-008 — Implement Outgoing WhatsApp Text Message Sender Service

- **Priority:** P0
- **Sprint:** Sprint 2
- **Estimate:** 3h
- **Dependencies:** WA-001
- **Status:** [x] Completed

**Description:**
Membuat service untuk mengirim pesan balasan berupa teks sederhana ke nomor pengguna WhatsApp via Meta Graph API.

**Acceptance Criteria:**

- [x] Function `sendTextMessage(toPhoneNumber, textMessage)` terimplementasi
- [x] Mengirim payload JSON `messaging_product: "whatsapp"`, `recipient_type: "individual"`, `type: "text"`
- [x] Menangani error gagal kirim (misal: nomor tidak terdaftar atau token kadaluarsa)

---

#### WA-009 — Implement Interactive Button Message Sender Utility

- **Priority:** P1
- **Sprint:** Sprint 2
- **Estimate:** 2h
- **Dependencies:** WA-008
- **Status:** [x] Completed

**Description:**
Membuat utilitas pengiriman pesan interaktif tombol (Quick Reply buttons) WhatsApp untuk respon konfirmasi (misal: tombol "Ya, Simpan" & "Batal").

**Acceptance Criteria:**

- [x] Function `sendInteractiveButtons(to, bodyText, buttons)` terimplementasi
- [x] Mengirim pesan dengan komponen tombol interaktif bawaan WhatsApp Cloud API
- [x] Menangani fallback ke balasan teks biasa jika pesan interaktif gagal

---

#### WA-010 — Integrate User Identification & Onboarding via Webhook

- **Priority:** P0
- **Sprint:** Sprint 2
- **Estimate:** 3h
- **Dependencies:** WA-007, BE-008
- **Status:** [x] Completed

**Description:**
Mencocokkan nomor WhatsApp pesan masuk dengan database User & Business, serta memicu proses registrasi otomatis untuk pengirim baru.

**Acceptance Criteria:**

- [x] Setiap pesan masuk mengidentifikasi `User` dan `Business` terkait menggunakan `getOrCreateUserAndBusiness`
- [x] Jika pengirim adalah pengguna baru, bot secara otomatis membalas dengan pesan salam pembuka (_welcome onboarding message_)

---

### Epic 9 — Conversation State

#### WA-011 — Create ConversationState Service & Repository

- **Priority:** P0
- **Sprint:** Sprint 2
- **Estimate:** 3h
- **Dependencies:** DB-006
- **Status:** [x] Completed

**Description:**
Membuat service untuk membaca, menyimpan, memperbarui, dan menghapus state percakapan aktif pengguna.

**Acceptance Criteria:**

- [x] Service `getState(userId)`, `setState(userId, state, payload, ttlSeconds)`, dan `clearState(userId)` dibuat
- [x] Data state tersimpan pada tabel `ConversationState`
- [x] Mampu menyimpan objek JSON arbitrer pada field `payload`

---

#### WA-012 — Implement Conversation State Expiration Logic

- **Priority:** P0
- **Sprint:** Sprint 2
- **Estimate:** 3h
- **Dependencies:** WA-011
- **Status:** [x] Completed

**Description:**
Membuat logika pengecekan waktu kadaluarsa (_expiration/TTL_) pada state percakapan (misal: konfirmasi transaksi hangus setelah 10 menit).

**Acceptance Criteria:**

- [x] Pengecekan `expiresAt` dilakukan saat membaca state pengguna
- [x] Jika `now > expiresAt`, hapus state secara otomatis dan kembalikan state kosong (`IDLE`)
- [x] Mencegah konfirmasi transaksi lama yang tertunda terproses secara tidak sengaja

---

## Sprint 3 — AI/NLP

**Sprint Goal:** Bot mampu mengekstrak pesan bahasa alami menjadi data transaksi terstruktur menggunakan OpenAI API, memvalidasi data, dan menjalankan alur konfirmasi sebelum menyimpan ke database.

---

### Epic 10 — AI Service

#### AI-001 — Setup OpenAI API Client & Environment Configuration

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 1h
- **Dependencies:** BE-002
- **Status:** [x] Completed

**Description:**
Memasang SDK `openai` dan mengonfigurasi API Key serta instance client OpenAI.

**Acceptance Criteria:**

- [x] Package `openai` terpasang dalam project
- [x] Client OpenAI terinisialisasi dengan `OPENAI_API_KEY` dari environment variables
- [x] Wrapper service `src/services/ai/openai.service.ts` siap digunakan

---

#### AI-002 — Design System Prompt for Indonesian Financial Transaction Extraction

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-001
- **Status:** [x] Completed

**Description:**
Merancang dan melakukan prompt engineering untuk instruksi sistem (_System Prompt_) ekstraksi transaksi keuangan khas bahasa sehari-hari Indonesia.

**Acceptance Criteria:**

- [x] System prompt mampu mengenali istilah pemasukan ("dapat uang", "penjualan", "laku", "diterima", "transfer masuk")
- [x] System prompt mampu mengenali istilah pengeluaran ("beli", "bayar", "pengeluaran", "gaji", "sewa", "listrik")
- [x] System prompt dapat mengonversi singkatan angka (misal: "50k" -> 50000, "1,5rb" -> 1500, "2jt" -> 2000000)

---

#### AI-003 — Implement OpenAI Structured Output JSON Schema Parsing

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-002
- **Status:** [x] Completed

**Description:**
Mengonfigurasi OpenAI Structured Output (`response_format: { type: "json_schema" }`) menggunakan model `gpt-4o-mini` untuk mengekstrak data transaksi.

**Acceptance Criteria:**

- [x] Schema JSON didefinisikan dengan Zod atau JSON Schema terstruktur
- [x] Menggunakan fitur OpenAI Structured Output (`response_format`) untuk memvalidasi struktur respon JSON
- [x] Memiliki penanganan invalid output jika struktur JSON hasil respon tidak sesuai skema
- [x] Memiliki fallback / error handling jika API OpenAI mengembalikan error atau mengalami rate limit

---

### Epic 11 — Transaction Parser

#### AI-004 — Implement Single Transaction Extractor

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-003
- **Status:** [x] Completed

**Description:**
Membuat service parser yang menerima pesan teks pengguna dan menghasilkan objek transaksi tunggal (`type`, `amount: number | null`, `category`, `description`, `transactionDate`).

**Acceptance Criteria:**

- [x] Function `parseSingleTransaction(userText)` terimplementasi
- [x] Field `amount` bernilai `number | null`; jika nominal tidak ditemukan di teks, set `amount` menjadi `null` tanpa memaksa AI menebak angka
- [x] Mengembalikan objek `{ type: 'INCOME'|'EXPENSE', amount: number | null, category: string, description: string, transactionDate: string }`
- [x] Contoh: "Beli bensin 20rb" -> `{ type: 'EXPENSE', amount: 20000, category: 'Transportasi', description: 'Beli bensin' }`

---

#### AI-005 — Implement Category Normalization & Fallback Logic

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 2h
- **Dependencies:** AI-004
- **Status:** [x] Completed

**Description:**
Membuat logika kategorisasi otomatis ke daftar kategori standar yang didefinisikan pada PRD (Penjualan, Operasional, Bahan Baku, Gaji, Transportasi, Lain-lain).

**Acceptance Criteria:**

- [x] AI mengelompokkan pesan hanya ke daftar kategori standar yang tersedia di PRD
- [x] Jika deskripsi ambigu atau tidak cocok dengan kategori khusus, tetapkan kategori "Lain-lain"
- [x] Menghasilkan string kategori terformat rapi sesuai PRD

---

#### AI-006 — Implement Relative Transaction Date Parser

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 2h
- **Dependencies:** AI-004
- **Status:** [x] Completed

**Description:**
Membuat logika pengubah tanggal relatif (seperti "kemarin", "tadi pagi", "dua hari lalu") menjadi tanggal absolut (format ISO/DateTime).

**Acceptance Criteria:**

- [x] AI membaca konteks tanggal saat ini (current date)
- [x] "Kemarin beli beras 100k" dikonversi dengan `transactionDate` = H-1
- [x] Jika tidak disebutkan waktu, default `transactionDate` adalah waktu pesan diterima (HARI_INI)

---

### Epic 12 — Validation & Confirmation

#### AI-007 — Implement Transaction Validation Guard

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-004
- **Status:** [x] Completed

**Description:**
Membuat layer validasi untuk memeriksa kelengkapan data hasil ekstraksi AI sebelum masuk ke tahap konfirmasi.

**Acceptance Criteria:**

- [x] Menolak jika `amount` bernilai `null`, 0, atau negatif, lalu meminta pengguna melengkapi nominal transaksi
- [x] Menolak jika pesan pengguna tidak mengandung konteks keuangan (misal: "Halo bot apa kabar?")
- [x] Mengembalikan status pesan balasan ramah jika input tidak valid atau nominal tidak ditemukan

---

#### AI-008 — Implement Pending Transaction State Manager

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** WA-012, AI-007
- **Status:** [x] Completed

**Description:**
Membuat logika untuk menyimpan hasil ekstraksi transaksi yang belum terverifikasi ke tabel `ConversationState` dengan status `WAITING_CONFIRMATION`.

**Acceptance Criteria:**

- [x] Menyimpan objek draf transaksi ke dalam field `payload` di `ConversationState`
- [x] Mengubah `state` pengguna menjadi `WAITING_CONFIRMATION`
- [x] Menyetel waktu kadaluarsa state (TTL misal 10 menit)

---

#### AI-009 — Implement Confirmation Response Handler

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-008, WA-008
- **Status:** [x] Completed

**Description:**
Membuat parser respon balasan pengguna terhadap pesan konfirmasi (penanganan jawaban "YA", "TIDAK", "BATAL", dll).

**Acceptance Criteria:**

- [x] Mengirimkan pesan konfirmasi ringkasan transaksi ke pengguna WhatsApp
- [x] Jika pengguna membalas "YA" / "BENAR" / menekan tombol Ya, lanjutkan ke penyimpanan
- [x] Jika pengguna membalas "TIDAK" / "BATAL", bersihkan state dan batalkan transaksi
- [x] Jika pesan tidak relevan saat `WAITING_CONFIRMATION`, ingatkan pengguna untuk mengonfirmasi terlebih dahulu

---

#### AI-010 — Implement Confirmed Transaction Database Persistence Flow

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-009, TRX-002
- **Status:** [x] Completed

**Description:**
Membuat alur eksekusi simpan transaksi ke database setelah mendapatkan persetujuan konfirmasi dari pengguna.

**Acceptance Criteria:**

- [x] Mengambil payload draf transaksi dari `ConversationState`
- [x] Menyimpan data ke tabel `Transaction` melalui `createTransaction`
- [x] Menghapus `ConversationState` pengguna kembali ke `IDLE`
- [x] Mengirimkan pesan sukses simpan ke WhatsApp pengguna

---

#### AI-011 — Implement Expired Confirmation State Cleanup & User Notification

- **Priority:** P1
- **Sprint:** Sprint 3
- **Estimate:** 2h
- **Dependencies:** AI-008
- **Status:** [x] Completed

**Description:**
Handling ketika pengguna tidak merespon konfirmasi hingga waktu kadaluarsa habis.

**Acceptance Criteria:**

- [x] Jika pesan baru masuk dan state `WAITING_CONFIRMATION` telah kadaluarsa, abaikan transaksi gantung sebelumnya
- [x] Kirim notifikasi bahwa konfirmasi sebelumnya telah hangus dan minta pengguna mengulangi pesan transaksi

---

### Epic 13 — Multiple Transactions

#### AI-012 — Implement Multi-Transaction Prompt & Schema Support

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 4h
- **Dependencies:** AI-003, AI-004
- **Status:** [x] Completed

**Description:**
Mengembangkan prompt AI dan skema JSON agar mampu mengekstrak banyak transaksi sekaligus dari satu pesan teks panjang.

**Acceptance Criteria:**

- [x] Contoh input: "Hari ini jual beras 100rb, minyak 50rb, lalu beli bensin 20rb"
- [x] AI mengembalikan array transaksi: 2 `INCOME` dan 1 `EXPENSE`
- [x] Masing-masing item transaksi memiliki nominal (`amount: number | null`), kategori, dan deskripsi terpisah

---

#### AI-013 — Implement Batch Confirmation & Multi-Transaction Persistence Logic

- **Priority:** P0
- **Sprint:** Sprint 3
- **Estimate:** 3h
- **Dependencies:** AI-012, AI-010
- **Status:** [x] Completed

**Description:**
Membuat alur konfirmasi ringkasan banyak transaksi sekaligus serta penyimpanan batch ke database dalam satu database transaction.

**Acceptance Criteria:**

- [x] Mengirimkan pesan konfirmasi daftar rincian transaksi (misal: "Ditemukan 3 transaksi: 1. Penjualan Beras (100k) ... Apakah benar?")
- [x] Saat pengguna menjawab "YA", simpan seluruh transaksi menggunakan `prisma.$transaction()` secara atomik
- [x] Mengirimkan respon total ringkasan transaksi yang berhasil disimpan

---

## Sprint 4 — Voice, Reporting & Production

**Sprint Goal:** Mengimplementasikan pengenalan transaksi via pesan suara (Voice Note), perintah laporan keuangan kas lengkap, manajemen transaksi, testing menyeluruh, keamanan, dan deployment ke lingkungan produksi.

---

### Epic 14 — Voice Note

#### VOICE-001 — Implement WhatsApp Voice Note / Audio Message Detector

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** WA-007
- **Status:** [x] Completed

**Description:**
Mendeteksi apakah tipe pesan WhatsApp yang masuk adalah audio / voice note (`type === 'audio'`).

**Acceptance Criteria:**

- [x] Webhook parser mengenali pesan tipe `audio`
- [x] Mengekstrak `media_id` dan `mime_type` dari payload audio Meta
- [x] Mengarahkan alur ke modul pengolah suara

---

#### VOICE-002 — Implement WhatsApp Media Download Service via Media ID

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** WA-001, VOICE-001
- **Status:** [x] Completed

**Description:**
Membuat service untuk mendapatkan URL media dari Meta API menggunakan `media_id` dan mengunduh file audio binary.

**Acceptance Criteria:**

- [] Step 1: Memanggil `GET /v19.0/{media_id}` untuk mendapatkan URL download file
- [] Step 2: Mengunduh file binary audio menggunakan Axios dengan header Authorization Bearer Token
- [] Menangani error jika file media tidak ditemukan atau kadaluarsa

---

#### VOICE-003 — Implement Temporary Audio File Storage

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** VOICE-002
- **Status:** [x] Completed

**Description:**
Menyimpan buffer audio yang diunduh ke folder penyimpanan sementara lokal (`tmp/audio/`) dengan nama file unik.

**Acceptance Criteria:**

- [x] Folder penyimpanan sementara `tmp/audio/` dibuat otomatis jika belum ada
- [x] Menulis file audio sementara dengan format extension yang valid (`.ogg`, `.m4a`, atau `.wav`)
- [x] Mengembalikan path absolut file audio sementara

--x

#### VOICE-004 — Integrate Speech-to-Text API (OpenAI Whisper) for Indonesian Audio

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** VOICE-003
- **Status:** [x] Completed

**Description:**
Mengirimkan file audio sementara ke OpenAI Whisper API (`transcriptions.create`) dengan set bahasa Indonesia (`language: 'id'`).

**Acceptance Criteria:**

- [x] Service `transcribeAudio(filePath)` dibuat
- [x] Berhasil mengonversi pesan suara berbahasa Indonesia menjadi teks string
- [x] Mampu mendeteksi dan mentranskripsikan ucapan angka dan nominal keuangan dengan baik

---

#### VOICE-005 — Implement Audio Transcription Error Handling & Retry Logic

- **Priority:** P1
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** VOICE-004
- **Status:** [x] Completed

**Description:**
Menangani kondisi kegagalan transkripsi audio (misal: suara tidak jelas, file rusak, atau format audio tidak didukung).

**Acceptance Criteria:**

- [x] Jika transkripsi menghasilkan teks kosong atau gagal, kirim balasan pesan ramah ke pengguna WhatsApp
- [x] Contoh balasan: "Maaf, suara tidak terdengar jelas. Silakan coba kirim ulang pesan suara atau ketik pesan teks."

---

#### VOICE-006 — Connect Speech Transcription Pipeline to AI Transaction Parser

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** VOICE-004, AI-004
- **Status:** [x] Completed

**Description:**
Menghubungkan hasil string transkripsi suara ke dalam pipeline ekstraksi AI & alur konfirmasi transaksi yang sudah ada.

**Acceptance Criteria:**

- [x] Teks hasil transkripsi diteruskan langsung ke `parseSingleTransaction` / `parseMultipleTransactions`
- [x] Pengguna menerima pesan balasan konfirmasi transaksi sama seperti menginput pesan teks

---

#### VOICE-007 — Implement Temporary File Cleanup Utility Post-Processing

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 1h
- **Dependencies:** VOICE-003
- **Status:** [x] Completed

**Description:**
Membuat mekanisme pembersihan file audio sementara setelah proses transkripsi selesai untuk mencegah kebocoran ruang penyimpanan disk server.

**Acceptance Criteria:**

- [x] Menghapus file di `tmp/audio/` dalam block `finally` setelah proses selesai (baik sukses maupun gagal)
- [x] Memastikan tidak ada sisa file audio di dalam disk server

---

### Epic 15 — Report

#### RPT-003 — Implement Daily Report Generator with WhatsApp Formatting

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** RPT-001, WA-008
- **Status:** [x] Completed

**Description:**
Membuat generator laporan keuangan harian (tanggal hari ini) terformat khusus dengan simbol WhatsApp bold/italic.

**Acceptance Criteria:**

- [x] Menghitung ringkasan transaksi dari pukul 00:00:00 hingga 23:59:59 hari ini
- [x] Menampilkan: Total Pemasukan, Total Pengeluaran, Selisih, dan Rincian Transaksi
- [x] Menggunakan format teks rapi dengan WhatsApp markdown (`*Bold*`, `_Italic_`)

---

#### RPT-004 — Implement Weekly Report Generator with Category Breakdown

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** RPT-001, WA-008
- **Status:** [x] Completed

**Description:**
Membuat generator laporan keuangan mingguan (7 hari terakhir) dilengkapi dengan rincian pengeluaran per kategori.

**Acceptance Criteria:**

- [x] Menghitung ringkasan transaksi 7 hari terakhir
- [x] Menyajikan breakdown pengeluaran berdasarkan kategori (misal: Bahan Baku, Operasional, Transportasi)
- [x] Mengirimkan pesan laporan mingguan ke WhatsApp

---

#### RPT-005 — Implement Monthly Report Generator with Cash Flow Summary

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** RPT-001, WA-008
- **Status:** [x]  Completed

**Description:**
Membuat generator laporan keuangan bulanan (bulan berjalan) dengan ringkasan arus kas sederhana.

**Acceptance Criteria:**

- [x] Menghitung ringkasan transaksi dari tanggal 1 hingga hari terakhir bulan berjalan
- [x] Menghitung total akumulasi pemasukan, pengeluaran, serta laba/rugi kas sederhana
- [x] Mengirimkan pesan laporan bulanan terstruktur ke WhatsApp

---

#### RPT-006 — Implement WhatsApp Report Command Parser

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** RPT-003, RPT-004, RPT-005
- **Status:** [x]  Completed

**Description:**
Membuat parser kata kunci perintah laporan dari pengguna (misal: "laporan harian", "laporan mingguan", "laporan bulanan", "cek kas").

**Acceptance Criteria:**

- [x] Mengenali kata kunci perintah laporan dari pesan pengguna
- [x] Memicu pembuatan generator laporan yang sesuai dengan perintah pengguna

---

### Epic 16 — Transaction Management

#### TRX-004 — Implement Get Transaction History Command Parser & Formatter

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** TRX-001, WA-008
- **Status:** [x] Completed

**Description:**
Membuat fungsi untuk mengambil daftar riwayat transaksi pengguna dan memformatnya dalam pesan WhatsApp.

**Acceptance Criteria:**

- [x] Perintah riwayat transaksi mengambil data transaksi dari database
- [x] Menampilkan daftar transaksi (Tanggal, Kategori, Nominal, Deskripsi)
- [x] Hanya menampilkan transaksi milik `businessId` pengguna yang meminta

---

#### TRX-005 — Implement Get Latest Transaction Details Service

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** TRX-001
- **Status:** [x] Completed

**Description:**
Membuat query service untuk mengambil 1 transaksi paling terakhir yang dimasukkan oleh pengguna berdasarkan urutan `createdAt` terbaru.

**Acceptance Criteria:**

- [x] Query `ORDER BY createdAt DESC LIMIT 1` terkunci pada `businessId` pengguna
- [x] Mengembalikan record transaksi terakhir beserta ID dan detail transaksi

---

#### TRX-006 — Implement Delete / Cancel Latest Transaction Command

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** TRX-005, WA-008
- **Status:** [x] Completed

**Description:**
Membuat fitur penghapusan / pembatalan 1 transaksi paling terakhir yang dicatat oleh pengguna berdasarkan urutan `createdAt` paling baru.

**Acceptance Criteria:**

- [x] Bot mengambil 1 transaksi paling terakhir milik `businessId` pengguna (`ORDER BY createdAt DESC LIMIT 1`)
- [x] Menghapus record transaksi tersebut dari database
- [x] Mengirimkan notifikasi konfirmasi ke WhatsApp bahwa transaksi terakhir berhasil dihapus

---

#### TRX-007 — Implement Edit / Update Transaction Service via WhatsApp

- **Priority:** P1
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** TRX-005, WA-008
- **Status:** [x] Completed

**Description:**
Membuat fitur pengeditan transaksi terakhir (seperti nominal, kategori, deskripsi, atau tanggal transaksi) via perintah WhatsApp.

**Acceptance Criteria:**

- [x] Menerima pembaruan field transaksi (nominal, kategori, deskripsi, atau tanggal transaksi) untuk transaksi terakhir pengguna
- [x] Memperbarui record transaksi di database dan memberikan konfirmasi pembaruan ke WhatsApp

---

### Epic 17 — Testing

#### TEST-001 — Write Unit Tests for Backend Express Infrastructure

- **Priority:** P1
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** BE-003
- **Status:** [x] Completed

**Description:**
Membuat unit test menggunakan Jest / Vitest untuk menguji middleware error handler, health check endpoint, dan utility fungsi.

**Acceptance Criteria:**

- [x] Test runner (Jest / Vitest + `supertest`) dikonfigurasi
- [x] Test coverage untuk `GET /health` mengembalikan status 200
- [x] Test coverage untuk error handler middleware mengembalikan format JSON error yang sesuai

---

#### TEST-002 — Write Unit Tests for Database Repositories & Business Isolation

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 4h
- **Dependencies:** BE-007, TRX-003
- **Status:** [x] Completed

**Description:**
Membuat unit & integration test untuk memastikan fitur isolasi data antar UMKM bekerja 100% aman.

**Acceptance Criteria:**

- [x] Pengujian membuat 2 bisnis terpisah (Bisnis A & Bisnis B)
- [x] Memverifikasi query transaksi Bisnis A tidak pernah mengembalikan data transaksi Bisnis B

---

#### TEST-003 — Write Integration Tests for WhatsApp Webhook

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** WA-005
- **Status:** [x] Completed

**Description:**
Membuat pengujian integrasi simulasi webhook verification (`GET /webhook`) dan penerimaan pesan (`POST /webhook`).

**Acceptance Criteria:**

- [x] Testing memverifikasi respon `hub.challenge` saat token valid
- [x] Testing memverifikasi penanganan payload pesan duplikat (deduplication check)

---

#### TEST-004 — Write Integration Tests for AI Transaction Parser & Edge Cases

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 4h
- **Dependencies:** AI-007, AI-012
- **Status:** [x] Completed

**Description:**
Membuat pengujian untuk menguji hasil parser AI pada berbagai variasi kalimat transaksi bahasa Indonesia.

**Acceptance Criteria:**

- [x] Pengujian kalimat nominal variasi ("50k", "1,5jt", "tiga puluh ribu")
- [x] Pengujian kalimat tanpa nominal (`amount: null`, harus memicu validasi error/minta nominal)
- [x] Pengujian kalimat multiple transactions

---

#### TEST-005 — Write End-to-End Tests for Voice Note Processing Pipeline

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** VOICE-006
- **Status:** [x] Completed

**Description:**
Membuat pengujian alur lengkap pengolahan voice note dari penerimaan audio hingga konfirmasi transaksi.

**Acceptance Criteria:**

- [x] Simulasi input file audio dummy menghasilkan teks transkripsi dan draf transaksi terkonfirmasi

---

### Epic 18 — Security

#### 
SEC-001 — Implement Environment Variable Secret Protection & Security Validation

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** BE-001
- **Status:** [x] Completed

**Description:**
Membuat mekanisme validasi dan perlindungan variabel rahasia (_secret protection_) pada aplikasi untuk menjamin token dan kredensial terlindungi aman.

**Acceptance Criteria:**

- [x] Memastikan seluruh API key, secret token, dan kredensial database dimuat melalui environment variable aman
- [x] Mencegah pemuatan nilai default berisiko tinggi saat `NODE_ENV=production`
---

#### SEC-002 — Implement Rate Limiting Middleware for Webhook Endpoints

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** BE-001
- **Status:** [x] Completed

**Description:**
Memasang rate-limiter middleware (`express-rate-limit`) untuk melindungi endpoint webhook dari serangan Denial of Service (DoS).

**Acceptance Criteria:**

- [x] Package `express-rate-limit` terpasang
- [x] Membatasi jumlah request per IP dalam jendela waktu tertentu
- [x] Mengembalikan status HTTP 429 Too Many Requests jika melebihi batas

---

#### SEC-003 — Sanitize Input Data & Mask Sensitive Secrets in Logs

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** BE-004
- **Status:** [x] Completed

**Description:**
Memastikan tidak ada API Key (OpenAI Key, WhatsApp Access Token, DB Password) atau data sensitif yang bocor pada log aplikasi.

**Acceptance Criteria:**

- [x] Modul logger melakukan penyaringan (_masking_) pada field sensitif
- [x] Input string dipersihkan dari karakter berbahaya

---

#### SEC-004 — Audit Multi-Tenant Business Data Isolation

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** TRX-003
- **Status:** [x] Completed

**Description:**
Melakukan audit menyeluruh terhadap seluruh SQL / Prisma query pada codebase untuk menjamin `businessId` selalu menjadi bagian dari klausa query.

**Acceptance Criteria:**

- [x] Seluruh method repository diperiksa dan dipastikan menyertakan `businessId`
- [x] Mencegah celah _Indirect Object Reference (IDOR)_ pada transaksi

---

### Epic 19 — Deployment

#### DEP-001 — Create Production Build Script & Dockerfile / Config

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** BE-001
- **Status:** [x] Completed

**Description:**
Menyiapkan konfigurasi build produksi (`dist/`) dan `Dockerfile` atau deployment script untuk platform cloud (Vercel / Railway / Render).

**Acceptance Criteria:**

- [x] Perintah `npm run build` menghasilkan bundle JavaScript terkompilasi di folder `dist/`
- [x] File `Dockerfile` atau konfigurasi platform target tersedia dan siap digunakan

---

#### DEP-002 — Configure Production Database & Run Production Migrations

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** DB-006
- **Status:** [x] Completed

**Description:**
Menyiapkan instance PostgreSQL produksi di Neon / Cloud DB dan menjalankan migrasi skema database produksi.

**Acceptance Criteria:**

- [x] Connection string PostgreSQL produksi terkonfigurasi di lingkungan hosting
- [x] Perintah `npx prisma migrate deploy` berhasil dijalankan pada database produksi

---

#### DEP-003 — Configure Production Environment Variables & Webhook URL

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 2h
- **Dependencies:** DEP-001
- **Status:** [ ] Not Started

**Description:**
Mengatur seluruh environment variables produksi dan mengonfigurasi Webhook URL HTTPS domain publik pada dashboard Meta Developer.

**Acceptance Criteria:**

- [ ] Server publik berjalan menggunakan sertifikat HTTPS valid
- [ ] Webhook URL di Meta Developer diarahkan ke `https://domain-produksi.com/webhook` dan berstatus **Verified**

---

#### DEP-004 — Execute End-to-End Production Test on Live WhatsApp Number

- **Priority:** P0
- **Sprint:** Sprint 4
- **Estimate:** 3h
- **Dependencies:** DEP-003
- **Status:** [ ] Not Started

**Description:**
Melakukan pengujian akhir secara langsung (end-to-end) menggunakan nomor WhatsApp asli pada lingkungan produksi.

**Acceptance Criteria:**

- [ ] Berhasil melakukan transaksi via pesan teks & voice note pada nomor live WhatsApp
- [ ] Alur konfirmasi dan pembuatan laporan keuangan berjalan lancar pada server produksi

---

## 8. Post-MVP / Future Backlog

Fitur-fitur berikut berada di **luar scope MVP 30 hari** dan dipisahkan untuk rencana pengembangan versi selanjutnya (Post-MVP):

1. **Web Dashboard & Analytics:**
   - Web Interface admin/user untuk visualisasi grafik arus kas, chart pemasukan/pengeluaran, dan manajemen akun.
2. **Mobile Application:**
   - Aplikasi mobile native / cross-platform (Android & iOS) pendamping bot WhatsApp.
3. **Kategori Kustom (Custom Categories):**
   - Penambahan dan pengeditan nama kategori transaksi sesuai kebutuhan spesifik UMKM.
4. **Ekspor Data (Excel / CSV & PDF):**
   - Fitur mengunduh file laporan keuangan format Excel `.xlsx` dan dokumen PDF resmi.
5. **Sistem Langganan & Payment Gateway:**
   - Monetisasi bot dengan integrasi Midtrans / Xendit untuk pembayaran paket premium berlangganan.
6. **Manajemen Stok & Inventaris (Inventory Management):**
   - Pencatatan stok barang keluar-masuk otomatis terhubung dengan penjualan.
7. **Pembuatan Faktur & Nota (Invoice Generation):**
   - Pengiriman nota digital / invoice pelanggan format gambar atau PDF via WhatsApp.
8. **Manajemen Pemasok & Pelanggan (Supplier & Customer Tracking):**
   - Pencatatan kontak pelanggan tetap dan penyedia bahan baku.
9. **Pencatatan Hutang & Piutang (Debt / Receivable Tracking):**
   - Pencatatan dan pengingat tanggal jatuh tempo hutang/piutang ke pelanggan atau pemasok.
10. **Integrasi Perbankan (Bank Integration / Open Finance):**
    - Sinkronisasi otomatis mutasi rekening bank atau e-wallet (GoPay, OVO, ShopeePay).
11. **Multi-User / Akses Peran (Roles & Permissions):**
    - Dukungan akses karyawan / kasir dengan batasan hak akses tertentu.
12. **Multi-Number WhatsApp & Multi-Branch Support:**
    - Dukungan banyak nomor WhatsApp atau beberapa cabang usaha dalam satu akun.

---

## 9. PRD Coverage Validation

Tabel validasi berikut memastikan seluruh requirement utama MVP dari `PRD.md` telah ter-coverage oleh task teknis pada `BACKLOG.md`:

| Requirement PRD                                        | Task ID Terkait                                | Sprint             | Coverage Status |
| ------------------------------------------------------ | ---------------------------------------------- | ------------------ | :-------------: |
| User registration via WhatsApp                         | `BE-006`, `BE-008`, `WA-010`                   | Sprint 1, Sprint 2 |     Covered     |
| Business creation (UMKM Profile)                       | `BE-007`, `BE-008`                             | Sprint 1           |     Covered     |
| Income transaction recording                           | `TRX-001`, `TRX-002`, `AI-004`                 | Sprint 1, Sprint 3 |     Covered     |
| Expense transaction recording                          | `TRX-001`, `TRX-002`, `AI-004`                 | Sprint 1, Sprint 3 |     Covered     |
| AI transaction parsing (Structured Output)             | `AI-002`, `AI-003`, `AI-004`                   | Sprint 3           |     Covered     |
| Transaction confirmation flow (`WAITING_CONFIRMATION`) | `AI-008`, `AI-009`, `AI-010`                   | Sprint 3           |     Covered     |
| Multiple transactions in single message                | `AI-012`, `AI-013`                             | Sprint 3           |     Covered     |
| Voice note transaction recording (Speech-to-Text)      | `VOICE-001` s/d `VOICE-007`                    | Sprint 4           |     Covered     |
| Daily financial report                                 | `RPT-001`, `RPT-003`, `RPT-006`                | Sprint 1, Sprint 4 |     Covered     |
| Weekly financial report                                | `RPT-001`, `RPT-004`, `RPT-006`                | Sprint 1, Sprint 4 |     Covered     |
| Monthly financial report                               | `RPT-001`, `RPT-005`, `RPT-006`                | Sprint 1, Sprint 4 |     Covered     |
| Net calculation ("Selisih pemasukan-pengeluaran")      | `RPT-002`                                      | Sprint 1           |     Covered     |
| Transaction history & cancellation                     | `TRX-004`, `TRX-005`, `TRX-006`                | Sprint 4           |     Covered     |
| Business Data Isolation (Multi-tenant)                 | `TRX-003`, `TEST-002`, `SEC-004`               | Sprint 1, Sprint 4 |     Covered     |
| Production Webhook & Deployment                        | `WA-003` s/d `WA-006`, `DEP-001` s/d `DEP-004` | Sprint 2, Sprint 4 |     Covered     |
