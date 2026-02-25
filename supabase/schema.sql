-- ============================================================
-- University CMS – Supabase SQL Schema
-- Run this entire file in the Supabase SQL editor.
-- Sections:
--   1. Extensions & Helpers
--   2. Enum Types
--   3. Core Tables
--   4. Indexes
--   5. Row Level Security Policies
--   6. Storage Buckets
--   7. Realtime
-- ============================================================

-- ============================================================
-- 1. Extensions & Helper Functions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- Automatically update updated_at on any table that has it
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- When a new auth.users row is created, create a matching profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Helper: return the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Helper: check if current user is super_admin or admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('super_admin', 'admin')
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Helper: check if current user is faculty, admin, or super_admin
CREATE OR REPLACE FUNCTION public.is_faculty_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('super_admin', 'admin', 'faculty')
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- 2. Enum Types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'faculty', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'dropped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'graded', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.announcement_audience AS ENUM ('all', 'students', 'faculty', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. Core Tables
-- ============================================================

-- ----------------------------------------------------------
-- 3.1 Profiles (extends auth.users 1:1)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT          NOT NULL,
  full_name       TEXT          NOT NULL DEFAULT '',
  avatar_url      TEXT,
  role            public.user_role NOT NULL DEFAULT 'student',
  student_id      TEXT          UNIQUE,          -- university-issued ID
  faculty_id      TEXT          UNIQUE,
  phone           TEXT,
  department      TEXT,
  bio             TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------
-- 3.2 Courses
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code     TEXT          NOT NULL UNIQUE,
  title           TEXT          NOT NULL,
  description     TEXT,
  credits         SMALLINT      NOT NULL DEFAULT 3 CHECK (credits BETWEEN 1 AND 12),
  semester        TEXT          NOT NULL,          -- e.g. "Fall 2025"
  academic_year   TEXT          NOT NULL,          -- e.g. "2025-2026"
  department      TEXT,
  max_enrollment  INTEGER       NOT NULL DEFAULT 40,
  status          public.course_status NOT NULL DEFAULT 'active',
  cover_image_url TEXT,
  deleted_at      TIMESTAMPTZ,
  created_by      UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 3.3 Course Faculty Assignments (faculty can teach multiple courses)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_faculty (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID  NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id  UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID  REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (course_id, faculty_id)
);

-- ----------------------------------------------------------
-- 3.4 Enrollments
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID  NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id  UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      public.enrollment_status NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID  REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID  REFERENCES public.profiles(id) ON DELETE SET NULL,
  dropped_at  TIMESTAMPTZ,
  notes       TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);

CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 3.5 Assignments
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id              UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id       UUID      NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by      UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT      NOT NULL,
  description     TEXT,
  instructions    TEXT,
  due_date        TIMESTAMPTZ NOT NULL,
  max_points      NUMERIC(6,2) NOT NULL DEFAULT 100,
  allow_late      BOOLEAN   NOT NULL DEFAULT FALSE,
  late_penalty_pct NUMERIC(5,2) DEFAULT 0,     -- percent deducted for late submit
  attachment_urls TEXT[],                        -- Supabase storage paths
  is_published    BOOLEAN   NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 3.6 Assignment Submissions
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id              UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID      NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id      UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         TEXT,
  attachment_urls TEXT[],
  status          public.submission_status NOT NULL DEFAULT 'draft',
  submitted_at    TIMESTAMPTZ,
  is_late         BOOLEAN   NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, student_id)
);

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 3.7 Grades
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grades (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID      NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  graded_by     UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points        NUMERIC(6,2) NOT NULL,
  feedback      TEXT,
  graded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id)   -- only one grade record per submission (update in place)
);

CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grade history (append-only audit)
CREATE TABLE IF NOT EXISTS public.grade_history (
  id            UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id      UUID      NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  submission_id UUID      NOT NULL,
  points        NUMERIC(6,2) NOT NULL,
  feedback      TEXT,
  changed_by    UUID      NOT NULL REFERENCES public.profiles(id),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Capture grade changes in history automatically
CREATE OR REPLACE FUNCTION public.handle_grade_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.points <> NEW.points OR OLD.feedback IS DISTINCT FROM NEW.feedback) THEN
    INSERT INTO public.grade_history (grade_id, submission_id, points, feedback, changed_by)
    VALUES (OLD.id, OLD.submission_id, OLD.points, OLD.feedback, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER grades_history_trigger
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_grade_history();

-- ----------------------------------------------------------
-- 3.8 Announcements
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID      REFERENCES public.courses(id) ON DELETE CASCADE, -- NULL = global
  title       TEXT      NOT NULL,
  content     TEXT      NOT NULL,
  audience    public.announcement_audience NOT NULL DEFAULT 'all',
  is_pinned   BOOLEAN   NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- 3.9 Attendance
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID      NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id  UUID      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recorded_by UUID      NOT NULL REFERENCES public.profiles(id),
  session_date DATE     NOT NULL,
  is_present  BOOLEAN   NOT NULL DEFAULT TRUE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, student_id, session_date)
);

-- ----------------------------------------------------------
-- 3.10 Audit Logs
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID      REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT      NOT NULL,
  table_name  TEXT      NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. Indexes
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_fts ON public.profiles USING gin(to_tsvector('english', full_name || ' ' || COALESCE(email, '')));

-- courses
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_semester ON public.courses(semester, academic_year) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_courses_fts ON public.courses USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || course_code));

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status) WHERE deleted_at IS NULL;

-- assignments
CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_published ON public.assignments(is_published) WHERE deleted_at IS NULL;

-- submissions
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status) WHERE deleted_at IS NULL;

-- grades
CREATE INDEX IF NOT EXISTS idx_grades_graded_by ON public.grades(graded_by);

-- announcements
CREATE INDEX IF NOT EXISTS idx_announcements_course ON public.announcements(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_author ON public.announcements(author_id) WHERE deleted_at IS NULL;

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON public.attendance(course_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- 5. Row Level Security Policies
-- ============================================================

-- Enable RLS
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_faculty  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----

-- Anyone authenticated can read non-deleted profiles (limited fields via view)
CREATE POLICY "profiles: authenticated read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Users can update their own profile (except role)
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can insert / update / soft-delete any profile
CREATE POLICY "profiles: admin full access"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- courses ----

CREATE POLICY "courses: public read active"
  ON public.courses FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "courses: admin write"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "courses: admin update"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "courses: admin delete"
  ON public.courses FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Faculty can update courses they are assigned to
CREATE POLICY "courses: faculty update own"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'faculty'
    AND id IN (SELECT course_id FROM public.course_faculty WHERE faculty_id = auth.uid())
  );

-- ---- course_faculty ----

CREATE POLICY "course_faculty: authenticated read"
  ON public.course_faculty FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "course_faculty: admin write"
  ON public.course_faculty FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- enrollments ----

-- Students see their own enrollments; admins/faculty see all
CREATE POLICY "enrollments: student read own"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      student_id = auth.uid()
      OR public.is_admin()
      OR (
        public.current_user_role() = 'faculty'
        AND course_id IN (SELECT course_id FROM public.course_faculty WHERE faculty_id = auth.uid())
      )
    )
  );

-- Students can enroll themselves
CREATE POLICY "enrollments: student insert"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_user_role() = 'student'
  );

-- Students can drop their own enrollment; admins can change any
CREATE POLICY "enrollments: student/admin update"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (
    (student_id = auth.uid() AND public.current_user_role() = 'student')
    OR public.is_admin()
  );

CREATE POLICY "enrollments: admin delete"
  ON public.enrollments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---- assignments ----

-- Published assignments visible to enrolled students in the course
CREATE POLICY "assignments: student read published"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_admin()
      OR (
        public.current_user_role() = 'faculty'
        AND course_id IN (SELECT course_id FROM public.course_faculty WHERE faculty_id = auth.uid())
      )
      OR (
        public.current_user_role() = 'student'
        AND is_published = TRUE
        AND course_id IN (
          SELECT course_id FROM public.enrollments
          WHERE student_id = auth.uid() AND status = 'approved'
        )
      )
    )
  );

-- Faculty can create assignments for their courses
CREATE POLICY "assignments: faculty insert"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('faculty', 'admin', 'super_admin')
    AND course_id IN (
      SELECT course_id FROM public.course_faculty WHERE faculty_id = auth.uid()
      UNION SELECT id FROM public.courses WHERE public.is_admin()
    )
  );

CREATE POLICY "assignments: faculty/admin update"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.current_user_role() = 'faculty'
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "assignments: faculty/admin delete"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (public.current_user_role() = 'faculty' AND created_by = auth.uid())
  );

-- ---- submissions ----

-- Students see their own; faculty see submissions in their courses
CREATE POLICY "submissions: select"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      student_id = auth.uid()
      OR public.is_admin()
      OR (
        public.current_user_role() = 'faculty'
        AND assignment_id IN (
          SELECT a.id FROM public.assignments a
          JOIN public.course_faculty cf ON cf.course_id = a.course_id
          WHERE cf.faculty_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "submissions: student insert"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_user_role() = 'student'
    -- student must be enrolled and approved
    AND assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.enrollments e ON e.course_id = a.course_id
      WHERE e.student_id = auth.uid() AND e.status = 'approved' AND a.deleted_at IS NULL
    )
  );

CREATE POLICY "submissions: student update own"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND status <> 'graded');

-- ---- grades ----

CREATE POLICY "grades: select"
  ON public.grades FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.current_user_role() = 'faculty'
      AND graded_by = auth.uid()
    )
    OR (
      public.current_user_role() = 'student'
      AND submission_id IN (
        SELECT id FROM public.submissions WHERE student_id = auth.uid()
      )
    )
  );

CREATE POLICY "grades: faculty insert"
  ON public.grades FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty_or_admin()
    AND graded_by = auth.uid()
  );

CREATE POLICY "grades: faculty update"
  ON public.grades FOR UPDATE
  TO authenticated
  USING (public.is_faculty_or_admin() AND graded_by = auth.uid())
  WITH CHECK (public.is_faculty_or_admin());

-- ---- grade_history ----

CREATE POLICY "grade_history: faculty/admin read"
  ON public.grade_history FOR SELECT
  TO authenticated
  USING (public.is_faculty_or_admin());

-- ---- announcements ----

CREATE POLICY "announcements: read"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_admin()
      OR (
        -- global announcement for correct audience
        course_id IS NULL
        AND (
          audience = 'all'
          OR (audience = 'students' AND public.current_user_role() = 'student')
          OR (audience = 'faculty' AND public.current_user_role() = 'faculty')
        )
      )
      OR (
        -- course-level: only enrolled/teaching users
        course_id IS NOT NULL
        AND (
          course_id IN (SELECT course_id FROM public.course_faculty WHERE faculty_id = auth.uid())
          OR course_id IN (
            SELECT course_id FROM public.enrollments
            WHERE student_id = auth.uid() AND status = 'approved'
          )
        )
      )
    )
  );

CREATE POLICY "announcements: faculty/admin write"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty_or_admin()
    AND author_id = auth.uid()
  );

CREATE POLICY "announcements: author/admin update"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());

-- ---- attendance ----

CREATE POLICY "attendance: faculty/admin write"
  ON public.attendance FOR ALL
  TO authenticated
  USING (public.is_faculty_or_admin());

CREATE POLICY "attendance: student read own"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.is_faculty_or_admin());

-- ---- audit_logs ----

CREATE POLICY "audit_logs: admin only"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Service role inserts audit logs (bypasses RLS)

-- ============================================================
-- 6. Storage Buckets
-- (Run in supabase dashboard → Storage or via management API)
-- The SQL below is informational; use the Supabase dashboard or
-- management client to create buckets.
-- ============================================================

-- Bucket: avatars (public)
-- Bucket: assignments (private – faculty uploads)
-- Bucket: submissions (private – student uploads)

-- Storage RLS policies (requires Supabase storage.objects table)
-- These policies use the storage schema.

-- Allow authenticated users to read public avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "assignments: faculty upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assignments' AND public.is_faculty_or_admin());

CREATE POLICY "assignments: enrolled read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'assignments' AND public.is_faculty_or_admin()
    OR bucket_id = 'assignments' AND public.current_user_role() = 'student');

CREATE POLICY "submissions: student upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "submissions: faculty/admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'submissions'
    AND (
      public.is_faculty_or_admin()
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- ============================================================
-- 7. Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;

-- ============================================================
-- Grant privileges to service_role (already default in Supabase)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
