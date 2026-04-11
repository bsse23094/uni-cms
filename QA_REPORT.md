# QA Test Report — uni-cms

**Date:** 2025-06-17  
**Stack:** Next.js 14.2.3 · TypeScript 5.4.5 · Supabase (hosted) · React Query 5 · Zod  
**Build Status:** `tsc --noEmit` — **0 errors**

---

## 1. Test Summary

| Category | Tests | Pass | Fail | Notes |
|----------|-------|------|------|-------|
| Authentication | 3 | 3 | 0 | super_admin, faculty, student |
| Page Rendering | 11 | 11 | 0 | All routes return 200 |
| API Endpoints | 6 | 6 | 0 | All tables accessible |
| CRUD Operations | 10 | 10 | 0 | Create/Read/Update/Upsert |
| RLS Security | 9 | 9 | 0 | All privilege escalation blocked |
| Performance | 17 | 17 | 0 | Pages <500ms, APIs <260ms |
| **Total** | **56** | **56** | **0** | |

---

## 2. Bugs Found & Fixed

### Bug 1: Assignment submission used wrong due_date (CRITICAL)
- **File:** `src/app/(dashboard)/dashboard/courses/[id]/assignments/[assignmentId]/page.tsx`
- **Problem:** `StudentSubmitForm` passed `new Date().toISOString()` as the `due_date` to `submitAssignment()`, making `is_late` always `false` regardless of actual deadline.
- **Fix:** Added `dueDate` prop from the assignment's actual `due_date`. Late detection now works correctly.

### Bug 2: No graded-submission guard (HIGH)
- **File:** Same as above
- **Problem:** Students could attempt to re-submit already-graded work. The RLS policy `status <> 'graded'` silently blocked the update, showing no error to the user.
- **Fix:** Added `useEffect` to check existing submission status on mount. If graded, shows "Graded" badge instead of form. Also catches the error in `handleSubmit` if the submission becomes graded between check and submit.

### Bug 3: No file upload in CreateAssignmentDialog (MEDIUM)
- **File:** `src/app/(dashboard)/dashboard/courses/[id]/page.tsx`
- **Problem:** Faculty had no way to attach files when creating assignments — the `FileUpload` component was missing from the dialog.
- **Fix:** Added `FileUpload` component, file upload logic via `uploadAssignmentFiles()`, and `useUpdateAssignment` to save `attachment_urls` after creation.

### Bug 4: No data refetch after submission (LOW)
- **File:** Same as Bug 1
- **Problem:** After student submitted, the submissions list (faculty view) wouldn't update until page refresh.
- **Fix:** Added `onSubmitted` callback prop that triggers React Query `refetch()`.

### Bug 5: Duplicate toast in useCreateAssignment (LOW)
- **File:** `src/hooks/useData.ts`
- **Problem:** `toast.success('Assignment created')` fired in both the hook's `onSuccess` and the dialog's `onSubmit`, showing two toasts.
- **Fix:** Removed the duplicate from the hook; the dialog now handles the toast after file upload completes.

---

## 3. Authentication Tests

| Test | Result |
|------|--------|
| Super admin login (`superadmin@university.edu`) | PASS |
| Faculty login (`drsmith@university.edu`) | PASS |
| Student login (`emma.johnson@students.university.edu`) | PASS |
| Authenticated redirect (logged-in user hits `/login`) | PASS (redirects to `/dashboard`) |
| Deactivated account detection | PASS (middleware checks `is_active` & `deleted_at`) |

---

## 4. Page Rendering (All HTTP 200)

| Route | Time | Status |
|-------|------|--------|
| `/login` | 119ms | PASS |
| `/register` | 167ms | PASS |
| `/dashboard` | 161ms | PASS |
| `/dashboard/courses` | 161ms | PASS |
| `/dashboard/assignments` | 159ms | PASS |
| `/dashboard/announcements` | 483ms | PASS |
| `/dashboard/enrollments` | 142ms | PASS |
| `/dashboard/grades` | 141ms | PASS |
| `/dashboard/attendance` | 176ms | PASS |
| `/dashboard/profile` | 156ms | PASS |
| `/dashboard/users` | 157ms | PASS |

---

## 5. API Performance (Supabase REST)

| Endpoint | Time | Rows |
|----------|------|------|
| Courses | 212ms | 9 |
| Assignments | 238ms | 25 |
| Submissions | 255ms | 25 |
| Grades | 224ms | 25 |
| Enrollments | 235ms | 25 |
| Announcements | 249ms | 20 |

---

## 6. CRUD Operations

| Operation | Actor | Result |
|-----------|-------|--------|
| Create course | Admin | PASS |
| Update course | Admin | PASS |
| Create assignment (with file upload) | Faculty | PASS |
| Create submission (draft → upload → submit) | Student | PASS |
| Grade submission (upsert) | Faculty | PASS (85/100 pts) |
| Create announcement | Admin | PASS |
| Update announcement | Admin | PASS |
| Student self-enroll | Student | PASS (status=pending) |
| Admin approve enrollment | Admin | PASS (pending → approved) |
| Soft-delete via REST | Admin | Expected: RLS blocks (app uses service role for deletes) |

---

## 7. Security Audit

### 7.1 RLS (Row Level Security)

| Test | Result |
|------|--------|
| SEC1: Unauthenticated → profiles | **SAFE** (0 rows, anon key only) |
| SEC2: Student → modify other profile | **SAFE** (0 rows updated) |
| SEC3: Student → escalate role to super_admin | **SAFE** (403 Forbidden) |
| SEC4: Student → delete course | **SAFE** (0 rows deleted) |
| SEC5: Student → view audit_logs | **SAFE** (0 rows visible) |
| SEC6: Student → modify own grade | **SAFE** (0 rows updated) |
| SEC7: Student → view other student's submissions | **SAFE** (0 rows visible) |
| SEC8: No API key → any endpoint | **SAFE** (rejected) |
| SEC9: Invalid JWT → any endpoint | **SAFE** (rejected) |

### 7.2 Middleware & Application Security

| Feature | Status |
|---------|--------|
| Open redirect prevention (`sanitizeNextPath`) | PASS — rejects `//`, `:` in paths |
| Role excluded from registration | PASS — all self-registrations default to `student` |
| Route-level role enforcement (`/dashboard/users`) | PASS — students redirected |
| Deactivated account handling | PASS — force sign-out + redirect |
| Service role key not exposed to client | PASS — only in server/middleware |
| File upload size limits (20MB) | PASS — enforced in `uploadSubmissionFiles` |
| Filename sanitization | PASS — strips path separators, limits length |
| Cross-user file path scoping | PASS — `studentId/submissionId/` prefix |

### 7.3 Input Validation (Zod Schemas)

All forms validated with Zod: login, register, user, profile, course, assignment, grade, announcement, enrollment, attendance. String lengths, number ranges, email format, UUID format, and enum values all enforced.

---

## 8. Data Integrity

| Check | Result |
|-------|--------|
| Seed data: 8 courses, 24 assignments, 282 submissions, 252 grades, 108 enrollments, 19 announcements | PASS |
| Foreign key constraints enforced | PASS |
| Unique constraints (enrollment per student+course, grade per submission) | PASS (tested via 409/23505) |
| Soft-delete pattern (deleted_at IS NULL filters) | PASS |
| Enum constraints (enrollment_status, submission_status) | PASS |

---

## 9. Files Modified (3)

1. **`src/app/(dashboard)/dashboard/courses/[id]/assignments/[assignmentId]/page.tsx`** — Fixed 4 bugs in student submission flow
2. **`src/app/(dashboard)/dashboard/courses/[id]/page.tsx`** — Added file upload to CreateAssignmentDialog
3. **`src/hooks/useData.ts`** — Removed duplicate toast notification

---

## 10. Recommendations

1. **Add server-side API routes for mutations** — Currently, the client calls Supabase directly. Adding Next.js API routes (or Server Actions) for writes would add an extra validation layer and allow rate limiting.
2. **Add automated tests** — No test suite exists. Consider Vitest for unit tests on validation/API logic and Playwright for E2E flows.
3. **Fix npm audit vulnerabilities** — 9 vulnerabilities found during `npm install`. Run `npm audit fix` to address.
4. **Consider adding CSRF protection** — Supabase JWT mitigates this, but having `SameSite=Strict` cookies would add defense-in-depth.
5. **Add pagination to all list views** — Some queries (e.g., enrollments) fetch up to 50-100 rows per page. Ensure consistent server-side pagination is enforced.
