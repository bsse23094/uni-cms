-- ============================================================
-- Seed Data for University CMS
-- Run AFTER schema.sql
-- ============================================================
-- Note: Auth users must be created via Supabase Auth API or
--       the dashboard first. The UUIDs below are placeholders;
--       replace them with real auth.users IDs.
-- ============================================================

-- We use a DO block with variables so UUIDs are consistent
DO $$
DECLARE
  v_super_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_admin_id  UUID := 'a0000000-0000-0000-0000-000000000002';
  v_fac1_id   UUID := 'a0000000-0000-0000-0000-000000000003';
  v_fac2_id   UUID := 'a0000000-0000-0000-0000-000000000004';
  v_stu1_id   UUID := 'a0000000-0000-0000-0000-000000000005';
  v_stu2_id   UUID := 'a0000000-0000-0000-0000-000000000006';
  v_stu3_id   UUID := 'a0000000-0000-0000-0000-000000000007';
  v_course1   UUID := 'c0000000-0000-0000-0000-000000000001';
  v_course2   UUID := 'c0000000-0000-0000-0000-000000000002';
  v_course3   UUID := 'c0000000-0000-0000-0000-000000000003';
  v_assign1   UUID := 'd0000000-0000-0000-0000-000000000001';
  v_assign2   UUID := 'd0000000-0000-0000-0000-000000000002';
BEGIN

-- ---- Profiles (auth.users rows must exist) ----
INSERT INTO public.profiles (id, email, full_name, role, department, student_id, faculty_id) VALUES
  (v_super_id, 'superadmin@university.edu', 'Super Admin',     'super_admin', 'Administration', NULL,          NULL),
  (v_admin_id, 'admin@university.edu',      'John Admin',      'admin',       'Administration', NULL,          NULL),
  (v_fac1_id,  'drsmith@university.edu',    'Dr. Alice Smith', 'faculty',     'Computer Science', NULL,        'FAC-001'),
  (v_fac2_id,  'profbrown@university.edu',  'Prof. Bob Brown', 'faculty',     'Mathematics',      NULL,        'FAC-002'),
  (v_stu1_id,  'emma@students.university.edu', 'Emma Johnson', 'student',     'Computer Science', 'STU-2024-001', NULL),
  (v_stu2_id,  'liam@students.university.edu', 'Liam Davis',   'student',     'Computer Science', 'STU-2024-002', NULL),
  (v_stu3_id,  'sofia@students.university.edu','Sofia Martinez','student',    'Mathematics',      'STU-2024-003', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---- Courses ----
INSERT INTO public.courses (id, course_code, title, description, credits, semester, academic_year, department, max_enrollment, status, created_by) VALUES
  (v_course1, 'CS101', 'Introduction to Computer Science',
   'Fundamentals of programming and computational thinking.', 3, 'Fall 2025', '2025-2026', 'Computer Science', 40, 'active', v_admin_id),
  (v_course2, 'CS301', 'Data Structures & Algorithms',
   'Advanced data structures, algorithm design and complexity analysis.', 4, 'Fall 2025', '2025-2026', 'Computer Science', 35, 'active', v_admin_id),
  (v_course3, 'MATH201', 'Calculus II',
   'Integration techniques, sequences, series, and multivariable calculus.', 3, 'Fall 2025', '2025-2026', 'Mathematics', 45, 'active', v_admin_id)
ON CONFLICT (course_code) DO NOTHING;

-- ---- Course Faculty Assignments ----
INSERT INTO public.course_faculty (course_id, faculty_id, is_primary, assigned_by) VALUES
  (v_course1, v_fac1_id, TRUE, v_admin_id),
  (v_course2, v_fac1_id, TRUE, v_admin_id),
  (v_course3, v_fac2_id, TRUE, v_admin_id)
ON CONFLICT (course_id, faculty_id) DO NOTHING;

-- ---- Enrollments ----
INSERT INTO public.enrollments (course_id, student_id, status, approved_at, approved_by) VALUES
  (v_course1, v_stu1_id, 'approved', NOW(), v_admin_id),
  (v_course1, v_stu2_id, 'approved', NOW(), v_admin_id),
  (v_course2, v_stu1_id, 'approved', NOW(), v_admin_id),
  (v_course2, v_stu2_id, 'pending',  NULL,  NULL),
  (v_course3, v_stu3_id, 'approved', NOW(), v_admin_id)
ON CONFLICT (course_id, student_id) DO NOTHING;

-- ---- Assignments ----
INSERT INTO public.assignments (id, course_id, created_by, title, description, due_date, max_points, is_published) VALUES
  (v_assign1, v_course1, v_fac1_id,
   'Hello World Program',
   'Write a Hello World program in three different programming languages.',
   NOW() + INTERVAL '7 days', 100, TRUE),
  (v_assign2, v_course2, v_fac1_id,
   'Implement a Binary Search Tree',
   'Implement a BST with insert, delete, and traversal methods. Include unit tests.',
   NOW() + INTERVAL '14 days', 100, TRUE)
ON CONFLICT DO NOTHING;

-- ---- Announcements ----
INSERT INTO public.announcements (author_id, course_id, title, content, audience, is_pinned, published_at) VALUES
  (v_admin_id, NULL,
   'Welcome to Fall 2025!',
   'Welcome to the new semester. Please complete your enrollment before the deadline of September 5th.',
   'all', TRUE, NOW()),
  (v_fac1_id, v_course1,
   'First Class Materials Available',
   'Lecture slides for Week 1 are now available in the course portal.',
   'students', FALSE, NOW())
ON CONFLICT DO NOTHING;

END $$;
