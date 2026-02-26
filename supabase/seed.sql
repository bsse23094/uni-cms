-- ============================================================
-- Seed Data for University CMS
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================
-- This script:
--   1. Creates real auth.users rows (so sign-in actually works)
--   2. Inserts auth.identities rows (required for email sign-in)
--   3. The handle_new_user trigger auto-creates public.profiles
--   4. Updates profiles with department / student/faculty IDs
--   5. Seeds courses, enrollments, assignments, announcements
-- ============================================================
-- Seed account password for ALL users: UniPass@2025
-- ============================================================

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- ============================================================
-- Step 1: Create auth.users rows
-- The handle_new_user trigger automatically creates a matching
-- public.profiles row for each user inserted here.
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  (v_super_id,
   '00000000-0000-0000-0000-000000000000',
   'superadmin@university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Super Admin","role":"super_admin"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', ''),

  (v_admin_id,
   '00000000-0000-0000-0000-000000000000',
   'admin@university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"John Admin","role":"admin"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', ''),

  (v_fac1_id,
   '00000000-0000-0000-0000-000000000000',
   'drsmith@university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Dr. Alice Smith","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', ''),

  (v_fac2_id,
   '00000000-0000-0000-0000-000000000000',
   'profbrown@university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Prof. Bob Brown","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', ''),

  (v_stu1_id,
   '00000000-0000-0000-0000-000000000000',
   'emma@students.university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Emma Johnson","role":"student"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', ''),

  (v_stu2_id,
   '00000000-0000-0000-0000-000000000000',
   'liam@students.university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Liam Davis","role":"student"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', ''),

  (v_stu3_id,
   '00000000-0000-0000-0000-000000000000',
   'sofia@students.university.edu',
   crypt('UniPass@2025', gen_salt('bf')),
   NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Sofia Martinez","role":"student"}',
   FALSE, 'authenticated', 'authenticated',
   NOW(), NOW(), '', '', '', '')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Insert auth.identities rows
-- Required by Supabase for email+password sign-in to work.
-- ============================================================
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (v_super_id, v_super_id, 'superadmin@university.edu', json_build_object('sub', v_super_id::text, 'email', 'superadmin@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_admin_id, v_admin_id, 'admin@university.edu',      json_build_object('sub', v_admin_id::text, 'email', 'admin@university.edu'),      'email', NOW(), NOW(), NOW()),
  (v_fac1_id,  v_fac1_id,  'drsmith@university.edu',    json_build_object('sub', v_fac1_id::text,  'email', 'drsmith@university.edu'),    'email', NOW(), NOW(), NOW()),
  (v_fac2_id,  v_fac2_id,  'profbrown@university.edu',  json_build_object('sub', v_fac2_id::text,  'email', 'profbrown@university.edu'),  'email', NOW(), NOW(), NOW()),
  (v_stu1_id,  v_stu1_id,  'emma@students.university.edu',  json_build_object('sub', v_stu1_id::text, 'email', 'emma@students.university.edu'),  'email', NOW(), NOW(), NOW()),
  (v_stu2_id,  v_stu2_id,  'liam@students.university.edu',  json_build_object('sub', v_stu2_id::text, 'email', 'liam@students.university.edu'),  'email', NOW(), NOW(), NOW()),
  (v_stu3_id,  v_stu3_id,  'sofia@students.university.edu', json_build_object('sub', v_stu3_id::text, 'email', 'sofia@students.university.edu'), 'email', NOW(), NOW(), NOW())

ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 3: Update profiles with extra fields
-- (The trigger already set id, email, full_name, role)
-- ============================================================
UPDATE public.profiles SET department = 'Administration'                                WHERE id = v_super_id;
UPDATE public.profiles SET department = 'Administration'                                WHERE id = v_admin_id;
UPDATE public.profiles SET department = 'Computer Science', faculty_id = 'FAC-001'     WHERE id = v_fac1_id;
UPDATE public.profiles SET department = 'Mathematics',      faculty_id = 'FAC-002'     WHERE id = v_fac2_id;
UPDATE public.profiles SET department = 'Computer Science', student_id = 'STU-2024-001' WHERE id = v_stu1_id;
UPDATE public.profiles SET department = 'Computer Science', student_id = 'STU-2024-002' WHERE id = v_stu2_id;
UPDATE public.profiles SET department = 'Mathematics',      student_id = 'STU-2024-003' WHERE id = v_stu3_id;

-- ============================================================
-- Step 4: Courses
-- ============================================================
INSERT INTO public.courses (id, course_code, title, description, credits, semester, academic_year, department, max_enrollment, status, created_by) VALUES
  (v_course1, 'CS101', 'Introduction to Computer Science',
   'Fundamentals of programming and computational thinking.', 3, 'Fall 2025', '2025-2026', 'Computer Science', 40, 'active', v_admin_id),
  (v_course2, 'CS301', 'Data Structures & Algorithms',
   'Advanced data structures, algorithm design and complexity analysis.', 4, 'Fall 2025', '2025-2026', 'Computer Science', 35, 'active', v_admin_id),
  (v_course3, 'MATH201', 'Calculus II',
   'Integration techniques, sequences, series, and multivariable calculus.', 3, 'Fall 2025', '2025-2026', 'Mathematics', 45, 'active', v_admin_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 5: Course Faculty Assignments
-- ============================================================
INSERT INTO public.course_faculty (course_id, faculty_id, is_primary, assigned_by) VALUES
  (v_course1, v_fac1_id, TRUE, v_admin_id),
  (v_course2, v_fac1_id, TRUE, v_admin_id),
  (v_course3, v_fac2_id, TRUE, v_admin_id)
ON CONFLICT (course_id, faculty_id) DO NOTHING;

-- ============================================================
-- Step 6: Enrollments
-- ============================================================
INSERT INTO public.enrollments (course_id, student_id, status, approved_at, approved_by) VALUES
  (v_course1, v_stu1_id, 'approved', NOW(), v_admin_id),
  (v_course1, v_stu2_id, 'approved', NOW(), v_admin_id),
  (v_course2, v_stu1_id, 'approved', NOW(), v_admin_id),
  (v_course2, v_stu2_id, 'pending',  NULL,  NULL),
  (v_course3, v_stu3_id, 'approved', NOW(), v_admin_id)
ON CONFLICT (course_id, student_id) DO NOTHING;

-- ============================================================
-- Step 7: Assignments
-- ============================================================
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

-- ============================================================
-- Step 8: Announcements
-- ============================================================
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
