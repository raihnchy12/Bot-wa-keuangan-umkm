# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Aplikasi Laporan Keuangan & Kas Berbasis WhatsApp

**Versi:** 1.0
**Status:** Draft / MVP
**Platform:** WhatsApp Bot
**Target Pengembangan:** 30 Hari
**Bahasa:** Bahasa Indonesia
**Backend:** Node.js + Express.js
**Database:** PostgreSQL / Neon
**ORM:** Prisma ORM
**AI/NLP:** OpenAI API
**WhatsApp:** WhatsApp Business Platform / Cloud API

---

# 1. Ringkasan Produk

Aplikasi **Laporan Keuangan & Kas Berbasis WhatsApp** adalah aplikasi pencatatan keuangan sederhana untuk UMKM, warung, toko kecil, pedagang, dan usaha rumahan yang memungkinkan pengguna mencatat transaksi hanya melalui WhatsApp.

Pengguna tidak perlu membuka aplikasi khusus atau memahami istilah akuntansi.

Pengguna cukup mengirim pesan seperti:

> "Tadi jualan dapat 350 ribu"

Bot akan memahami pesan tersebut, mengubahnya menjadi data transaksi, meminta konfirmasi, kemudian menyimpan transaksi ke database.

Pengguna juga dapat mengirim voice note:

> 🎤 "Tadi beli gas dua puluh lima ribu sama beli plastik sepuluh ribu."

Sistem akan melakukan:

```text
Voice Note
    ↓
Speech-to-Text
    ↓
AI/NLP
    ↓
Transaction Parser
    ↓
Validation
    ↓
Confirmation
    ↓
Database
```

Pengguna juga dapat meminta laporan melalui WhatsApp:

> "Laporan hari ini"

Bot akan memberikan:

```text
📊 Laporan Keuangan Hari Ini

Pemasukan : Rp1.250.000
Pengeluaran: Rp450.000
────────────────────
Selisih    : Rp800.000

Transaksi:
🟢 5 pemasukan
🔴 7 pengeluaran
```

---

# 2. Problem Statement

Banyak UMKM masih melakukan pencatatan keuangan secara manual melalui:

- buku catatan
- Excel
- notes di HP
- chat pribadi
- atau bahkan tidak mencatat sama sekali

Aplikasi keuangan yang tersedia sering kali memiliki terlalu banyak fitur dan menggunakan istilah akuntansi yang sulit dipahami oleh pengguna awam.

Masalah utama:

1. Pengguna malas membuka aplikasi khusus hanya untuk mencatat satu transaksi.
2. Pengguna tidak memahami pembukuan secara formal.
3. Pencatatan sering dilakukan tidak konsisten.
4. Transaksi kecil sering terlupakan.
5. Pengguna sulit mengetahui total pemasukan dan pengeluaran.
6. Pengguna sulit mengetahui kondisi keuangan usaha secara sederhana.

---

# 3. Solusi

Sistem menyediakan pencatatan keuangan melalui WhatsApp.

Pengguna cukup mengirim pesan menggunakan bahasa sehari-hari.

Contoh:

```text
"jual kopi 50 ribu"
"tadi laku 300rb"
"beli gas 25 ribu"
"bayar listrik 150 ribu"
"modal beli bahan 100k"
```

AI akan mengubah bahasa natural tersebut menjadi struktur transaksi.

Contoh:

```json
{
  "type": "income",
  "amount": 50000,
  "category": "penjualan",
  "description": "Penjualan kopi",
  "transactionDate": "2026-10-07"
}
```

Sistem kemudian meminta konfirmasi sebelum menyimpan.

---

# 4. Tujuan Produk

## 4.1 Tujuan Utama

Membuat pencatatan keuangan UMKM menjadi semudah mengirim pesan WhatsApp.

## 4.2 Tujuan MVP

MVP harus mampu:

- menerima pesan WhatsApp
- menerima voice note
- memahami transaksi sederhana
- mencatat pemasukan
- mencatat pengeluaran
- mengategorikan transaksi
- meminta konfirmasi
- menyimpan transaksi
- menampilkan transaksi
- menghitung pemasukan
- menghitung pengeluaran
- menghitung selisih/laba sederhana
- memberikan laporan melalui WhatsApp

---

# 5. Target User

## Primary User

UMKM dengan skala kecil seperti:

- warung
- toko kelontong
- pedagang makanan
- penjual online
- usaha rumahan
- jasa kecil
- pedagang kaki lima

## Karakteristik

Pengguna:

- terbiasa menggunakan WhatsApp
- tidak selalu memahami akuntansi
- membutuhkan pencatatan cepat
- lebih nyaman menggunakan bahasa sehari-hari
- menggunakan smartphone sebagai perangkat utama

---

# 6. User Journey

## 6.1 Registrasi

Pengguna mengirim:

```text
DAFTAR
```

Bot:

```text
👋 Selamat datang di KasKu!

Untuk mulai menggunakan layanan,
silakan kirim nama usaha Anda.

Contoh:
Warung Berkah
```

User:

```text
Warung Berkah
```

Bot:

```text
Berhasil! 🎉

Usaha: Warung Berkah

Sekarang Anda bisa mencatat transaksi
langsung melalui WhatsApp.

Contoh:
"Jualan hari ini 500 ribu"
```

---

# 7. Core Flow

## 7.1 Pencatatan Transaksi

```text
User
 ↓
WhatsApp
 ↓
Webhook
 ↓
Express.js
 ↓
Identifikasi User
 ↓
AI/NLP Parser
 ↓
Transaction Object
 ↓
Validation
 ↓
Confirmation
 ↓
Prisma ORM
 ↓
PostgreSQL
 ↓
WhatsApp Response
```

---

# 8. Contoh Transaksi

## Pemasukan

User:

```text
Tadi jualan dapat 500 ribu
```

Bot:

```text
💰 Transaksi ditemukan

Jenis      : Pemasukan
Jumlah     : Rp500.000
Kategori   : Penjualan
Keterangan: Hasil jualan

Simpan transaksi ini?

1️⃣ Ya
2️⃣ Tidak
```

---

## Pengeluaran

User:

```text
Beli gas 25 ribu
```

Bot:

```text
💸 Transaksi ditemukan

Jenis      : Pengeluaran
Jumlah     : Rp25.000
Kategori   : Operasional
Keterangan: Pembelian gas

Simpan transaksi ini?

1️⃣ Ya
2️⃣ Tidak
```

---

# 9. Multiple Transaction

Sistem harus dapat memahami beberapa transaksi dalam satu pesan.

User:

```text
Tadi beli gas 25 ribu dan beli plastik 10 ribu
```

AI menghasilkan:

```json
{
  "transactions": [
    {
      "type": "expense",
      "amount": 25000,
      "category": "operasional",
      "description": "Pembelian gas"
    },
    {
      "type": "expense",
      "amount": 10000,
      "category": "operasional",
      "description": "Pembelian plastik"
    }
  ]
}
```

Bot:

```text
💸 Saya menemukan 2 transaksi:

1. Gas — Rp25.000
2. Plastik — Rp10.000

Total: Rp35.000

Simpan semua transaksi?

1️⃣ Ya
2️⃣ Tidak
```

---

# 10. Voice Note

User mengirim voice note.

```text
🎤 Voice Note
       ↓
WhatsApp API
       ↓
Download Audio
       ↓
Speech-to-Text
       ↓
Text
       ↓
AI/NLP
       ↓
Transaction Parser
```

Contoh hasil Speech-to-Text:

```text
"Tadi beli bahan baku seratus ribu"
```

AI:

```json
{
  "type": "expense",
  "amount": 100000,
  "category": "bahan_baku",
  "description": "Pembelian bahan baku"
}
```

Bot kemudian meminta konfirmasi.

---

# 11. Laporan Keuangan

Pengguna dapat meminta laporan menggunakan bahasa natural.

Contoh:

```text
laporan hari ini
```

atau:

```text
hari ini gimana?
```

atau:

```text
berapa pemasukan saya hari ini?
```

---

## 11.1 Laporan Harian

```text
📊 LAPORAN HARI INI

Tanggal:
7 Oktober 2026

🟢 Pemasukan
Rp1.500.000

🔴 Pengeluaran
Rp600.000

━━━━━━━━━━━━━━

💰 Selisih
Rp900.000

Jumlah transaksi:
12
```

---

# 12. Laporan Mingguan

User:

```text
laporan minggu ini
```

Bot:

```text
📊 LAPORAN MINGGUAN

Pemasukan:
Rp8.500.000

Pengeluaran:
Rp3.200.000

━━━━━━━━━━━━━━

💰 Selisih:
Rp5.300.000

Transaksi:
68
```

---

# 13. Laporan Bulanan

User:

```text
laporan bulan ini
```

Bot:

```text
📊 LAPORAN OKTOBER 2026

Pemasukan
Rp15.500.000

Pengeluaran
Rp7.250.000

━━━━━━━━━━━━━━

💰 Selisih
Rp8.250.000

Total transaksi:
124
```

---

# 14. Kategori Transaksi

## Income

Kategori default:

- Penjualan
- Jasa
- Modal
- Pendapatan lain

## Expense

Kategori default:

- Bahan Baku
- Operasional
- Transportasi
- Listrik
- Air
- Internet
- Gaji
- Sewa
- Pembelian
- Lainnya

Kategori dapat dikembangkan pada versi berikutnya.

---

# 15. Fitur MVP

## Authentication / User Identification

WhatsApp nomor telepon digunakan sebagai identitas awal user.

Sistem akan menyimpan:

```text
WhatsApp Number
       ↓
User
       ↓
Business
```

Satu user dapat memiliki satu usaha pada MVP.

---

# 16. Multi-Tenant Architecture

Walaupun MVP hanya menggunakan satu nomor WhatsApp Bot, sistem harus dirancang agar banyak UMKM dapat menggunakan bot yang sama.

Contoh:

```text
WhatsApp Bot
│
├── 081xxx
│     └── Warung Berkah
│
├── 082xxx
│     └── Toko Makmur
│
└── 083xxx
      └── Kedai Jaya
```

Data transaksi harus selalu memiliki:

```text
business_id
```

sehingga data antar-UMKM tidak tercampur.

---

# 17. Database Design

Database menggunakan PostgreSQL dan Prisma ORM.

## User

```text
users
```

Fields:

```text
id
name
phone_number
created_at
updated_at
```

---

## Business

```text
businesses
```

Fields:

```text
id
user_id
name
created_at
updated_at
```

---

## Transaction

```text
transactions
```

Fields:

```text
id
business_id
type
amount
category
description
transaction_date
created_at
updated_at
```

---

## Conversation State

Digunakan untuk menyimpan proses percakapan sementara.

```text
conversation_states
```

Fields:

```text
id
user_id
state
payload
expires_at
created_at
updated_at
```

Contoh:

```text
state:
WAITING_CONFIRMATION
```

Payload:

```json
{
  "type": "expense",
  "amount": 25000,
  "category": "operasional",
  "description": "Pembelian gas"
}
```

---

# 18. Prisma Schema Konsep

Contoh struktur:

```prisma
model User {
  id           Int        @id @default(autoincrement())
  name         String
  phoneNumber  String     @unique
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  businesses   Business[]
}

model Business {
  id           Int           @id @default(autoincrement())
  userId       Int
  name         String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Transaction {
  id              Int      @id @default(autoincrement())
  businessId      Int
  type            String
  amount          Decimal
  category        String
  description     String?
  transactionDate DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business @relation(fields: [businessId], references: [id])
}
```

Untuk production, `type` dan kategori sebaiknya menggunakan enum Prisma.

---

# 19. Technology Stack

## Backend

```text
Node.js
Express.js
JavaScript
```

## Database

```text
PostgreSQL
Neon
```

## ORM

```text
Prisma ORM
```

## WhatsApp

```text
WhatsApp Business Platform
WhatsApp Cloud API
```

## AI

```text
OpenAI API
```

## Voice Processing

```text
Speech-to-Text API
```

## Environment

```text
dotenv
```

## HTTP Client

```text
Axios
```

## Development

```text
Nodemon
Postman
Git
GitHub
```

---

# 20. Backend Architecture

```text
src/
│
├── config/
│   ├── database.js
│   └── whatsapp.js
│
├── controllers/
│   └── webhookController.js
│
├── services/
│   ├── whatsappService.js
│   ├── aiService.js
│   ├── speechService.js
│   ├── transactionService.js
│   └── reportService.js
│
├── routes/
│   └── webhookRoutes.js
│
├── middleware/
│   └── errorHandler.js
│
├── utils/
│   ├── formatter.js
│   └── validator.js
│
├── app.js
└── server.js
```

---

# 21. Webhook

Express.js akan menyediakan endpoint untuk menerima event dari WhatsApp.

```http
GET /webhook
```

Digunakan untuk verifikasi webhook.

```http
POST /webhook
```

Digunakan untuk menerima:

- pesan teks
- voice note
- status pesan
- metadata pengirim

---

# 22. WhatsApp Service

Service bertanggung jawab terhadap:

- mengirim pesan
- menerima pesan
- mengambil media
- mengirim reply
- menangani WhatsApp API errors

Contoh:

```javascript
sendMessage(phoneNumber, message);
```

---

# 23. AI Service

AI Service bertanggung jawab mengubah bahasa natural menjadi structured data.

Input:

```text
"Beli bahan baku 100 ribu"
```

Output:

```json
{
  "transactions": [
    {
      "type": "expense",
      "amount": 100000,
      "category": "bahan_baku",
      "description": "Pembelian bahan baku"
    }
  ]
}
```

AI tidak boleh langsung menyimpan data ke database.

Flow:

```text
User Input
    ↓
AI
    ↓
Structured JSON
    ↓
Validation
    ↓
User Confirmation
    ↓
Database
```

---

# 24. AI Validation Rules

AI tidak boleh menebak nominal yang tidak diberikan.

Contoh:

User:

```text
Tadi beli gas
```

Bot:

```text
Saya belum mengetahui nominal pembelian gas.

Berapa jumlahnya?
Contoh:
25 ribu
```

---

User:

```text
Tadi jualan
```

Bot:

```text
Berapa hasil penjualannya?
```

---

# 25. Confidence Handling

AI dapat memberikan tingkat confidence.

Contoh:

```json
{
  "confidence": 0.95
}
```

Jika confidence rendah:

```text
Saya kurang yakin dengan transaksi tersebut.

Apakah maksud Anda:

💸 Pengeluaran Rp50.000
Kategori: Operasional

1️⃣ Ya
2️⃣ Koreksi
```

---

# 26. Conversation State

Bot harus mampu memahami konteks percakapan.

Contoh:

User:

```text
Beli gas
```

Bot:

```text
Berapa harganya?
```

User:

```text
25 ribu
```

Bot harus memahami bahwa:

```text
25 ribu
```

adalah nominal untuk transaksi sebelumnya.

Flow:

```text
Beli gas
   ↓
WAITING_AMOUNT
   ↓
25 ribu
   ↓
WAITING_CONFIRMATION
   ↓
Ya
   ↓
SAVE_TRANSACTION
```

---

# 27. Command System

Selain bahasa natural, bot menyediakan command sederhana.

```text
MENU
```

```text
LAPORAN HARI INI
```

```text
LAPORAN MINGGU INI
```

```text
LAPORAN BULAN INI
```

```text
TRANSAKSI TERAKHIR
```

```text
BANTUAN
```

```text
PROFIL
```

---

# 28. Edit Transaction

User dapat memperbaiki transaksi.

Contoh:

```text
ubah transaksi terakhir jadi 50 ribu
```

Bot:

```text
Transaksi terakhir:

Pengeluaran
Rp25.000
Pembelian gas

Ubah menjadi:
Rp50.000?

1️⃣ Ya
2️⃣ Tidak
```

---

# 29. Delete Transaction

User:

```text
hapus transaksi terakhir
```

Bot:

```text
Apakah Anda yakin ingin menghapus:

💸 Pembelian gas
Rp25.000

1️⃣ Ya
2️⃣ Tidak
```

---

# 30. Transaction History

User:

```text
transaksi terakhir
```

Bot:

```text
📋 TRANSAKSI TERAKHIR

1. 🟢 Penjualan
   +Rp350.000

2. 🔴 Beli gas
   -Rp25.000

3. 🔴 Beli plastik
   -Rp10.000
```

---

# 31. Business Rules

## Rule 1

Semua transaksi harus memiliki:

```text
business_id
type
amount
transaction_date
```

## Rule 2

Amount harus lebih besar dari 0.

## Rule 3

Transaction type hanya:

```text
income
expense
```

## Rule 4

AI tidak boleh langsung menyimpan transaksi tanpa confirmation.

## Rule 5

Data UMKM tidak boleh dapat diakses oleh UMKM lain.

## Rule 6

Semua nomor WhatsApp harus dinormalisasi.

Contoh:

```text
+628123456789
```

disimpan dalam format standar.

---

# 32. Security

MVP harus menerapkan:

- webhook verification
- WhatsApp signature verification jika tersedia
- environment variables
- database connection menggunakan environment variable
- validasi input
- rate limiting
- error handling
- sanitasi input
- tidak menyimpan API key dalam source code
- tidak menyimpan token WhatsApp di database tanpa kebutuhan
- HTTPS pada production

Environment:

```env
DATABASE_URL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
OPENAI_API_KEY=
```

---

# 33. Error Handling

Jika AI gagal:

```text
Maaf, saya belum bisa memahami transaksi tersebut.

Coba gunakan contoh:

"Jualan 100 ribu"
atau
"Beli gas 25 ribu"
```

Jika database error:

```text
Maaf, transaksi belum dapat disimpan.
Silakan coba beberapa saat lagi.
```

Jika WhatsApp API error:

Sistem mencatat error pada server log dan tidak menampilkan informasi teknis kepada user.

---

# 34. Logging

Backend harus mencatat:

```text
Incoming WhatsApp message
User identification
AI processing
Transaction validation
Database operation
WhatsApp response
Errors
```

Contoh:

```text
[INFO] Incoming message from 628123456789
[INFO] AI transaction detected
[INFO] Transaction confirmed
[INFO] Transaction saved: #123
[INFO] Response sent
```

Jangan mencatat API key, password, atau data sensitif.

---

# 35. API Internal

Walaupun MVP berfokus pada WhatsApp, backend tetap menggunakan struktur service/API yang terorganisir.

Contoh:

```http
GET /health
```

Health check.

```http
GET /api/transactions
```

Mengambil transaksi.

```http
GET /api/transactions/:id
```

Detail transaksi.

```http
POST /api/transactions
```

Membuat transaksi.

```http
PUT /api/transactions/:id
```

Mengubah transaksi.

```http
DELETE /api/transactions/:id
```

Menghapus transaksi.

Webhook:

```http
GET /webhook
POST /webhook
```

---

# 36. Report Calculation

Laporan sederhana menggunakan:

```text
Total Income
=
SUM(income)

Total Expense
=
SUM(expense)

Net
=
Income - Expense
```

Contoh:

```text
Income  = 5.000.000
Expense = 3.000.000

Net = 2.000.000
```

Pada MVP istilah yang digunakan sebaiknya:

> **Selisih pemasukan dan pengeluaran**

atau

> **Laba sederhana**

Karena sistem belum merupakan sistem akuntansi penuh.

---

# 37. Non-Functional Requirements

## Performance

Bot harus memberikan respons secepat mungkin.

Target MVP:

```text
Text → Response
< 5 detik
```

Tidak termasuk kondisi API eksternal yang sedang lambat.

## Availability

Backend harus dapat berjalan 24/7 pada production environment.

## Scalability

Database dan architecture harus dapat dikembangkan menjadi multi-tenant SaaS.

## Maintainability

Business logic tidak boleh diletakkan seluruhnya di webhook controller.

Gunakan:

```text
Controller
    ↓
Service
    ↓
Repository / Prisma
```

---

# 38. MVP Scope

## Included

- WhatsApp text message
- WhatsApp voice note
- user identification
- business creation
- income transaction
- expense transaction
- AI transaction extraction
- multiple transactions
- confirmation
- transaction history
- edit transaction
- delete transaction
- daily report
- weekly report
- monthly report
- PostgreSQL
- Prisma ORM
- logging
- basic error handling

## Not Included

Untuk menjaga scope 30 hari, MVP tidak mencakup:

- web dashboard
- mobile application
- payment gateway
- subscription
- accounting double-entry
- invoice generator
- tax calculation
- payroll
- inventory
- advanced analytics
- bank integration
- marketplace integration
- multi-number WhatsApp onboarding
- advanced user roles

---

# 39. 30-Day Development Plan

## Sprint 1 — Backend & Database

### Day 1

Project setup:

```text
Node.js
Express.js
Prisma
PostgreSQL
Git
```

### Day 2

Database schema.

### Day 3

Prisma migration.

### Day 4

User & business service.

### Day 5

Transaction CRUD.

### Day 6

Report calculation.

### Day 7

Testing backend.

---

# Sprint 2 — WhatsApp Integration

### Day 8

Setup WhatsApp Business Platform.

### Day 9

Webhook verification.

### Day 10

Receive incoming messages.

### Day 11

Send WhatsApp responses.

### Day 12

User identification berdasarkan nomor WhatsApp.

### Day 13

Conversation state.

### Day 14

End-to-end WhatsApp transaction flow.

---

# Sprint 3 — AI/NLP

### Day 15

AI service.

### Day 16

Income parser.

### Day 17

Expense parser.

### Day 18

Category detection.

### Day 19

Multiple transaction parser.

### Day 20

Validation & confidence handling.

### Day 21

Confirmation flow.

---

# Sprint 4 — Voice & Reporting

### Day 22

Voice note detection.

### Day 23

Download WhatsApp media.

### Day 24

Speech-to-text.

### Day 25

Voice → AI → Transaction.

### Day 26

Daily report.

### Day 27

Weekly/monthly report.

### Day 28

Edit/delete transaction.

### Day 29

Testing & bug fixing.

### Day 30

Deployment & documentation.

---

# 40. Testing Scenarios

## Text

Input:

```text
Jualan 100 ribu
```

Expected:

```text
income
100000
```

---

## Expense

Input:

```text
Beli gas 25 ribu
```

Expected:

```text
expense
25000
```

---

## Multiple

Input:

```text
Beli gas 25 ribu dan plastik 10 ribu
```

Expected:

```text
2 transactions
```

---

## Missing Amount

Input:

```text
Beli gas
```

Expected:

```text
Bot asks amount
```

---

## Voice

Input:

```text
Voice note
```

Expected:

```text
Speech-to-text
→ AI
→ confirmation
→ database
```

---

## Report

Input:

```text
Laporan hari ini
```

Expected:

```text
Income
Expense
Net
Transaction count
```

---

# 41. Success Metrics

MVP dianggap berhasil apabila:

### Transaction Accuracy

Minimal:

```text
90%
```

untuk pola transaksi yang sudah ditentukan.

### Bot Response

Minimal:

```text
95%
```

pesan valid mendapatkan response.

### Database Accuracy

Tidak boleh terjadi:

- transaksi masuk ke business yang salah
- duplikasi transaksi akibat webhook retry
- transaksi tanpa business_id

### User Experience

User dapat mencatat transaksi tanpa harus memahami istilah database atau akuntansi.

---

# 42. Future Development

Setelah MVP berhasil, aplikasi dapat dikembangkan menjadi SaaS.

## Phase 2

- web dashboard
- chart keuangan
- custom categories
- export Excel/PDF
- laporan otomatis
- reminder pencatatan

## Phase 3

- multi-user dalam satu bisnis
- owner
- admin
- employee
- role & permission

## Phase 4

- setiap UMKM dapat menggunakan nomor WhatsApp sendiri
- onboarding WhatsApp Business
- subscription
- payment gateway

## Phase 5

- inventory
- invoice
- supplier
- customer
- hutang/piutang
- cash flow
- advanced financial analytics

---

# 43. Final Architecture

```text
                         ┌─────────────────┐
                         │    UMKM User    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    WhatsApp     │
                         └────────┬────────┘
                                  │
                                  ▼
                  ┌───────────────────────────┐
                  │ WhatsApp Business / Cloud │
                  │           API             │
                  └────────────┬──────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │    Express.js    │
                     │     Webhook      │
                     └────────┬─────────┘
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
        ┌──────────┐    ┌───────────┐   ┌────────────┐
        │   User   │    │ AI Service│   │   Report   │
        │ Service  │    │           │   │  Service   │
        └──────────┘    └─────┬─────┘   └──────┬─────┘
                              │                │
                              ▼                │
                        ┌───────────┐          │
                        │Speech-to- │          │
                        │   Text    │          │
                        └───────────┘          │
                              │                │
                              └───────┬────────┘
                                      ▼
                              ┌──────────────┐
                              │ Transaction  │
                              │   Service    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Prisma ORM   │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ PostgreSQL   │
                              │    Neon      │
                              └──────────────┘
```

---

# 44. Prinsip Pengembangan

Project harus mengikuti prinsip:

1. **WhatsApp-first**
2. **Simple UX**
3. **AI sebagai parser, bukan pengambil keputusan**
4. **Semua transaksi harus dikonfirmasi sebelum disimpan**
5. **Data antar-UMKM harus terisolasi**
6. **Business logic dipisahkan dari webhook**
7. **Database menggunakan Prisma ORM**
8. **JavaScript, bukan TypeScript**
9. **MVP tidak menggunakan web dashboard**
10. **Architecture harus siap dikembangkan menjadi SaaS**

---

# 45. MVP Definition of Done

MVP dinyatakan selesai apabila seorang user dapat melakukan seluruh flow berikut:

```text
1. Chat bot
       ↓
2. Teridentifikasi sebagai user
       ↓
3. Kirim:
   "Tadi jualan dapat 500 ribu"
       ↓
4. AI memahami transaksi
       ↓
5. Bot meminta konfirmasi
       ↓
6. User menjawab "Ya"
       ↓
7. Prisma menyimpan transaksi
       ↓
8. User meminta:
   "Laporan hari ini"
       ↓
9. Bot menghitung data PostgreSQL
       ↓
10. Bot mengirim laporan
```

Dan untuk voice:

```text
Voice Note
    ↓
WhatsApp
    ↓
Express.js
    ↓
Speech-to-Text
    ↓
AI Parser
    ↓
Confirmation
    ↓
Prisma
    ↓
PostgreSQL
    ↓
WhatsApp Response
```

Jika kedua flow tersebut sudah berjalan dengan stabil, maka **MVP utama aplikasi telah tercapai**.
