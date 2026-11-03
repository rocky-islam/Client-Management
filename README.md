# Rocky Business Manager

A production-grade, full-stack freelance business management system, revenue tracking, monthly planning, and analytics SaaS application built for modern freelancers, digital agencies, and independent consultants.

---

## 🌟 Key Features

### 1. Main Project Management
- **Exact Primary Columns Required**:
  1. Date
  2. Client Name
  3. Profile Name
  4. Order ID
  5. Value
  6. Order Status
  7. Delivery Statement Date
  8. Remark
  9. Project Deadline
  10. Time Left (dynamic, non-persistent, timezone-aware)
  11. Sales Type (New Order vs Repeat Order)
  12. Actions (View, Edit, Carry Forward, Duplicate, Archive, Delete)
- **TanStack Table** with global search, column visibility toggle, sorting, pagination, and instant CSV export.
- Dynamic overdue alerts calculated on the fly without overwriting user business status.

### 2. Monthly Project Planning (Core Feature)
- Dedicated `/monthly` dashboard displaying clickable cards for all twelve months (January through December) of any selected year.
- Individual `/monthly/[year]/[month]` workspace showing:
  - Monthly project value & cleared revenue
  - Original projects count vs. Carry forward projects count
  - Target tracking with live progress bar
  - New orders vs. Repeat clients breakdown

### 3. Carry Forward Engine (Database Integrity)
- Projects can be seamlessly carried forward across months (e.g., January → February → March) without duplicating the underlying project record.
- Preserves complete historical audit trail and original dates.
- Safe assignment removal leaves main projects intact.

### 4. Client Directory & CRM
- Tracks lifetime contract value, total orders, completed payments, and outstanding balances per client.
- Distinguishes between new clients and repeat clients.
- Quick inline client creation from the Add Project form.

### 5. Revenue & Payment Ledger
- Strictly separates contracted project values from cleared cashflow.
- Separate `Payment` records with multi-channel support (Bank Transfer, Payoneer, Wise, PayPal, bKash, Nagad, Cash, Other).
- Automatic outstanding balance calculations: `Value - Net Completed Payments`.

### 6. Targets & Benchmarks
- Set monthly and yearly targets with real-time achievement percentages.
- Historical target preservation (changing current month never affects past months).

### 7. Expense & Profit Tracking
- Log operational business expenses across Software, Hosting, Hardware, Marketing, and Subscriptions.
- Real-time Net Profit computation (`Revenue - Expenses`).

### 8. Backup & Disaster Recovery
- 1-Click portable JSON database export.
- Smart JSON restore with automatic duplicate Order ID detection.
- Native PostgreSQL `pg_dump` and `pg_restore` guides for production Neon databases.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React, Server Actions & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: Lucide React
- **Database**: PostgreSQL / [Neon Serverless PostgreSQL](https://neon.tech)
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **Charts**: Recharts
- **Data Tables**: TanStack Table
- **Forms & Validation**: React Hook Form + Zod
- **Authentication**: Secure JWT Cookie Sessions with bcrypt hashing

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested with Node.js 20+ and 25)
- npm or pnpm
- A free PostgreSQL database on [Neon.tech](https://neon.tech) (or a local PostgreSQL instance)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/rocky-business-manager.git
cd rocky-business-manager
npm install
```

### 3. Environment Variables Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your PostgreSQL connection string in `.env`:
```env
# Neon Serverless PostgreSQL connection string
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Secure random secret (min 32 characters)
AUTH_SECRET="rocky-business-manager-production-secret-auth-key-2026-super-secure"

# Initial Administrator Credentials
INITIAL_ADMIN_EMAIL="admin@rockybusiness.com"
INITIAL_ADMIN_PASSWORD="AdminPassword123!"
INITIAL_ADMIN_NAME="Rocky Freelancer"

# Application Settings
NEXT_PUBLIC_APP_NAME="Rocky Business Manager"
NEXT_PUBLIC_DEFAULT_CURRENCY="USD"
NEXT_PUBLIC_DEFAULT_TIMEZONE="Asia/Dhaka"
```

### 4. Database Setup & Migrations
Generate the Prisma Client and apply migrations:
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to your PostgreSQL / Neon database
npx prisma migrate deploy

# (Optional) Seed the database with default admin & starter demo data
npx ts-node prisma/seed.ts
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

Sign in with the administrator credentials:
- **Email**: `admin@rockybusiness.com`
- **Password**: `AdminPassword123!`

---

## ☁️ Neon Database Setup Guide

1. Sign up for a free account at [neon.tech](https://neon.tech).
2. Create a new project (e.g. `rocky-business-manager`).
3. Under the **Dashboard**, locate your **Connection Details**.
4. Select **Prisma** or **PostgreSQL** connection string with pooling enabled.
5. Paste the connection string as `DATABASE_URL` in `.env`.
6. Run `npx prisma migrate deploy` to create the normalized tables and indexes.

---

## 🚢 Vercel Deployment Instructions

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New** → **Project** and import your repository.
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your pooled Neon connection string.
   - `DIRECT_URL`: Your direct Neon connection string.
   - `AUTH_SECRET`: A secure 32+ character string.
   - `INITIAL_ADMIN_EMAIL`: `admin@rockybusiness.com`
   - `INITIAL_ADMIN_PASSWORD`: Your chosen secure password.
   - `INITIAL_ADMIN_NAME`: `Rocky Freelancer`
4. Set the **Build Command** to:
   ```bash
   prisma generate && next build
   ```
5. Click **Deploy**.

---

## 🔒 Security Best Practices

- **Zero Client Credential Exposure**: `DATABASE_URL`, password hashes, and session secrets are never bundled into client scripts.
- **Strict Data Isolation**: Every business record is scoped to the authenticated `userId`.
- **Soft Deletion**: Accidental project deletions can be recovered without database loss.
- **Audit Logging**: All creation, updates, and carry-forward operations are written to `ActivityLog`.

---

## 📄 License
MIT License. Created for Rocky Business Management.
