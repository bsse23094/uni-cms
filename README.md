# University CMS

A production-ready university/college content management system built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

> Designed to support 5,000+ concurrent users with row-level security, real-time updates, and role-based access control.

---

## Features

| Module | Roles |
|---|---|
| Authentication (email/password, OAuth-ready) | All |
| User Management (CRUD, soft-delete, restore) | Admin, Super Admin |
| Course Management (create, assign faculty, enroll) | Admin, Faculty, Student |
| Enrollment Workflow (request → approve/reject) | All |
| Assignments (create, file upload, submit) | Faculty, Student |
| Grading (grade submissions, feedback, GPA) | Faculty, Student |
| Announcements (pinned, audience-specific) | Faculty, Admin |
| Attendance (per-course, per-date) | Faculty |
| Role-specific Dashboards (stats + quick actions) | All |
| Profile Management (avatar upload, bio) | All |

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS, Realtime)
- **State:** TanStack Query v5 (React Query)
- **Forms:** react-hook-form + Zod
- **Icons:** Lucide React

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- npm or pnpm

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/uni-cms.git
cd uni-cms
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_AVATAR_BUCKET=avatars
NEXT_PUBLIC_STORAGE_ASSIGNMENT_BUCKET=assignments
NEXT_PUBLIC_STORAGE_SUBMISSION_BUCKET=submissions
```

Find these values in your Supabase dashboard → **Settings → API**.

### 3. Set up the database

In your Supabase dashboard → **SQL Editor**, paste and run:

1. The contents of `supabase/schema.sql` (full schema)
2. Optionally `supabase/seed.sql` (sample data)

Or via the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Default Seed Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@university.edu | password123 |
| Admin | admin@university.edu | password123 |
| Faculty | prof.smith@university.edu | password123 |
| Faculty | prof.jones@university.edu | password123 |
| Student | alice@student.university.edu | password123 |
| Student | bob@student.university.edu | password123 |
| Student | carol@student.university.edu | password123 |

---

## Project Structure

```
uni-cms/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, Register pages
│   │   ├── (dashboard)/        # All protected dashboard pages
│   │   │   ├── dashboard/      # Home dashboard (role-specific)
│   │   │   ├── users/          # User management + detail
│   │   │   ├── courses/        # Course cards + detail + assignments
│   │   │   ├── enrollments/    # Enrollment workflow
│   │   │   ├── assignments/    # Cross-course assignment list
│   │   │   ├── grades/         # Grades + GPA overview
│   │   │   ├── announcements/  # Pinned + recent announcements
│   │   │   ├── attendance/     # Per-course attendance marking
│   │   │   └── profile/        # User profile + avatar upload
│   │   └── auth/callback/      # Supabase OAuth callback
│   ├── components/
│   │   ├── layout/             # Sidebar, Header
│   │   ├── shared/             # DataTable, FileUpload, StatsCard, PageHeader, etc.
│   │   └── ui/                 # Button, Input, Card, Dialog, Badge, etc.
│   ├── context/                # AuthContext, ReactQueryProvider
│   ├── hooks/useData.ts        # All React Query hooks
│   ├── lib/
│   │   ├── api/                # users, courses, enrollments, assignments, grades, announcements, dashboard
│   │   ├── supabase/           # Browser + server Supabase clients
│   │   ├── utils.ts
│   │   └── validations.ts      # Zod schemas
│   ├── middleware.ts            # Auth + role-based route protection
│   └── types/index.ts
└── supabase/
    ├── schema.sql              # Full DB schema with RLS (run once)
    └── seed.sql                # Sample users, courses, enrollments
```

---

## User Roles & Access

| Role | Key Permissions |
|---|---|
| `super_admin` | Full platform access, manages admin accounts |
| `admin` | User CRUD, course management, enrollment approval, announcements |
| `faculty` | Assigned courses, create assignments, grade submissions, attendance |
| `student` | Browse/enroll courses, submit assignments, view grades |

Route protection is enforced server-side in `middleware.ts` and per-page via role checks.

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends Supabase auth users |
| `courses` | Course catalog |
| `course_faculty` | Faculty assigned to courses |
| `enrollments` | Student enrollment with status workflow |
| `assignments` | Course assignments |
| `submissions` | Student submissions |
| `grades` | Graded submissions |
| `grade_history` | Audit trail of grade changes |
| `announcements` | Platform/audience notices |
| `attendance` | Per-course per-date records |
| `audit_logs` | System audit trail |

All tables have full **Row Level Security** policies.

---

## Storage Buckets

| Bucket | Contents |
|---|---|
| `avatars` | User profile pictures |
| `assignments` | Faculty-uploaded assignment resources |
| `submissions` | Student submission files |

---

## Scripts

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript strict check
```

---

## Deployment

**Vercel (recommended)**
1. Push the repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set all env vars from `.env.local`
4. Deploy

**Self-hosted / Docker**
```bash
npm run build
npm run start
```

Set `NEXT_PUBLIC_APP_URL` to your production domain.

---

## License

MIT
