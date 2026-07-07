This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# PayGen — Payslip & Letter Generator

A modern, full-stack HR document generation tool built for internal admin use.
Generate professional payslips and employment letters in seconds.

---

## What This App Does

PayGen is an internal admin tool that allows HR/admin teams to:

- Manage employee records (add manually or bulk upload via Excel)
- Generate payslips with automatic salary breakdowns
- Generate Relieving Letters and Experience/Internship Letters
- Store company settings (logo, signature, contact info) once — reused everywhere
- Download/print all documents as PDF via browser print

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/Database:** Neon PostgreSQL + Prisma ORM
- **Auth:** NextAuth (credentials, admin + employee roles)
- **PDF Generation:** Browser window.print() with print CSS
- **Excel Parsing:** xlsx library
- **Icons:** lucide-react
- **Notifications:** react-hot-toast

---

## Features

### Employee Portal
- Login with admin-provided credentials
- Check-in / check-out attendance
- Submit leave requests (admin approves)

### Admin Panel
- Create employees with login email + password
- Generate payslips and letters
- Review attendance and approve/reject leave requests

### Employee Management
- Add employees manually with full details
- Bulk import via Excel upload (.xlsx / .xls)
- Edit and delete employee records

### Payslip Generator
- Search employee — all details auto-fill
- Pro-rata salary calculation based on From Date / To Date
- Auto salary breakdown:
  - Basic = 50% of Gross
  - HRA = 40% of Basic
  - Special Allowance = Remaining
  - PF = 12% of Basic (auto-calculated)
  - Custom deductions (admin can add any)
- LOP days support
- Amount in words (Indian format)
- 3 templates: Corporate Standard, Minimal Elegant, Modern Corporate
- Optional Tax Summary Page (Page 2)
- Download as PDF

### Letter Generator
- Relieving Letter + Experience/Internship Letter
- Employee details auto-fill
- Company letterhead auto-loaded
- Download as PDF

### Settings
- Company name, address, email, phone, website
- Signatory name and designation
- Logo and signature upload
- Stored once — used on all documents

---

## Salary Calculation

Gross Salary (per employee)
  Basic = Gross x 50%
  HRA = Basic x 40%
  Special Allowance = Gross - Basic - HRA

Pro-rata ratio = (Days in range - LOP) / Total calendar days in month
Actual Earnings = Standard x Pro-rata ratio
PF = Actual Basic x 12%
Net Pay = Actual Gross - PF - Custom Deductions

---

## Project Structure

/app
  /login           → Login page
  /employees       → Admin: employee management
  /payslip         → Admin: payslip generator
  /letters         → Admin: letter generator
  /settings        → Admin: company settings
  /admin           → Admin: attendance & leave approvals
  /employee        → Employee portal (dashboard, attendance, leaves)
  /api             → Server API routes

/lib
  prisma.ts         → Prisma client
  auth.ts           → NextAuth config
  salaryCalc.ts     → Salary logic
  numberToWords.ts  → Indian number to words
  utils.ts          → Helpers

/prisma
  schema.prisma     → Database schema
  seed.ts           → Admin user seed

---

## Database Setup (Neon PostgreSQL)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `.env` as `DATABASE_URL`
3. Run:

```bash
npm install
npx prisma db push
npm run db:seed
```

Default admin: `admin@company.com` / `Admin@123`

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000
```

---

## Getting Started

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in as admin.

---

## Deployment

Push to GitHub → Import on vercel.com → Add `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` → Deploy

---

## Workflow

**Admin**
1. Settings → Add logo, signature, company info
2. Employees → Add manually (with login email + password) or upload Excel
3. Payslip → Select template, search employee, generate, download PDF
4. Letters → Select type, search employee, generate, download PDF
5. Admin → Attendance / Leave Requests → Review employee activity

**Employee**
1. Login with credentials provided by admin
2. Dashboard → Check in / check out
3. My Leaves → Submit leave requests

---

## Notes

- Admin creates employee accounts with email + initial password
- Professional Tax (₹200) applied automatically on payslips
- All documents marked as system-generated
- PDF via browser print (Ctrl+P → Save as PDF)
- Logo/signature uploads stored in `public/uploads/company/` (use S3/R2 for production on Vercel)

---

Built by Purple Merit Technologies
