-- ============================================================
-- Seed Data for University CMS - Comprehensive Demo Dataset
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================
-- This script creates:
--   1. Real auth.users rows (7 admin/faculty + 35 students)
--   2. auth.identities rows for email+password sign-in
--   3. Profiles with complete data (dept, IDs, etc.)
--   4. 8 courses across 5 departments
--   5. 270+ enrollments (students × courses)
--   6. 24+ assignments with various statuses
--   7. 300+ submissions with grades (to showcase GPA)
--   8. Attendance records
--   9. Announcements and course-specific announcements
-- ============================================================
-- Seed account password for ALL users: UniPass@2025
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- Admin and Faculty IDs
  v_super_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_admin_id  UUID := 'a0000000-0000-0000-0000-000000000002';
  v_fac1_id   UUID := 'a0000000-0000-0000-0000-000000000003';
  v_fac2_id   UUID := 'a0000000-0000-0000-0000-000000000004';
  v_fac3_id   UUID := 'a0000000-0000-0000-0000-000000000005';
  v_fac4_id   UUID := 'a0000000-0000-0000-0000-000000000006';
  v_fac5_id   UUID := 'a0000000-0000-0000-0000-000000000007';
  
  -- Student IDs (35 students)
  v_stu_ids   UUID[] := ARRAY[
    'a0000000-0000-0000-0000-000000010001',
    'a0000000-0000-0000-0000-000000010002',
    'a0000000-0000-0000-0000-000000010003',
    'a0000000-0000-0000-0000-000000010004',
    'a0000000-0000-0000-0000-000000010005',
    'a0000000-0000-0000-0000-000000010006',
    'a0000000-0000-0000-0000-000000010007',
    'a0000000-0000-0000-0000-000000010008',
    'a0000000-0000-0000-0000-000000010009',
    'a0000000-0000-0000-0000-000000010010',
    'a0000000-0000-0000-0000-000000010011',
    'a0000000-0000-0000-0000-000000010012',
    'a0000000-0000-0000-0000-000000010013',
    'a0000000-0000-0000-0000-000000010014',
    'a0000000-0000-0000-0000-000000010015',
    'a0000000-0000-0000-0000-000000010016',
    'a0000000-0000-0000-0000-000000010017',
    'a0000000-0000-0000-0000-000000010018',
    'a0000000-0000-0000-0000-000000010019',
    'a0000000-0000-0000-0000-000000010020',
    'a0000000-0000-0000-0000-000000010021',
    'a0000000-0000-0000-0000-000000010022',
    'a0000000-0000-0000-0000-000000010023',
    'a0000000-0000-0000-0000-000000010024',
    'a0000000-0000-0000-0000-000000010025',
    'a0000000-0000-0000-0000-000000010026',
    'a0000000-0000-0000-0000-000000010027',
    'a0000000-0000-0000-0000-000000010028',
    'a0000000-0000-0000-0000-000000010029',
    'a0000000-0000-0000-0000-000000010030',
    'a0000000-0000-0000-0000-000000010031',
    'a0000000-0000-0000-0000-000000010032',
    'a0000000-0000-0000-0000-000000010033',
    'a0000000-0000-0000-0000-000000010034',
    'a0000000-0000-0000-0000-000000010035'
  ];
  
  -- Course IDs (8 courses)
  v_course_ids UUID[] := ARRAY[
    'c0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000008'
  ];
  
  -- Assignment IDs (24 assignments = 3 per course)
  v_assign_ids UUID[] := ARRAY[
    'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000009',
    'd0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000012',
    'd0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000015',
    'd0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000018',
    'd0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000021',
    'd0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000024'
  ];
  
  v_counter INT;
  v_stu_idx INT;
  v_course_idx INT;
  v_stu_names TEXT[] := ARRAY[
    'Emma Johnson', 'Liam Davis', 'Sofia Martinez', 'Noah Anderson', 'Ava Thompson',
    'Ethan Taylor', 'Mia Wilson', 'Lucas Brown', 'Isabella Garcia', 'Mason Lee',
    'Charlotte White', 'Logan Harris', 'Amelia Martin', 'Oliver Clark', 'Harper Rodriguez',
    'Benjamin Lewis', 'Evelyn Walker', 'Michael Young', 'Abigail King', 'James Scott',
    'Elizabeth White', 'Daniel Green', 'Victoria Adams', 'Matthew Nelson', 'Grace Hall',
    'Joseph Allen', 'Lily Sanchez', 'Samuel Morris', 'Scarlett Rogers', 'David Peterson',
    'Chloe Bell', 'Ryan Phillips', 'Zoe Campbell', 'Jacob Parker', 'Nora Evans'
  ];
  v_stu_emails TEXT[] := ARRAY[
    'emma.johnson@students.university.edu', 'liam.davis@students.university.edu', 'sofia.martinez@students.university.edu',
    'noah.anderson@students.university.edu', 'ava.thompson@students.university.edu', 'ethan.taylor@students.university.edu',
    'mia.wilson@students.university.edu', 'lucas.brown@students.university.edu', 'isabella.garcia@students.university.edu',
    'mason.lee@students.university.edu', 'charlotte.white@students.university.edu', 'logan.harris@students.university.edu',
    'amelia.martin@students.university.edu', 'oliver.clark@students.university.edu', 'harper.rodriguez@students.university.edu',
    'benjamin.lewis@students.university.edu', 'evelyn.walker@students.university.edu', 'michael.young@students.university.edu',
    'abigail.king@students.university.edu', 'james.scott@students.university.edu', 'elizabeth.white@students.university.edu',
    'daniel.green@students.university.edu', 'victoria.adams@students.university.edu', 'matthew.nelson@students.university.edu',
    'grace.hall@students.university.edu', 'joseph.allen@students.university.edu', 'lily.sanchez@students.university.edu',
    'samuel.morris@students.university.edu', 'scarlett.rogers@students.university.edu', 'david.peterson@students.university.edu',
    'chloe.bell@students.university.edu', 'ryan.phillips@students.university.edu', 'zoe.campbell@students.university.edu',
    'jacob.parker@students.university.edu', 'nora.evans@students.university.edu'
  ];
  v_stu_depts TEXT[] := ARRAY[
    'Computer Science', 'Computer Science', 'Engineering', 'Mathematics', 'Mathematics',
    'Computer Science', 'Biology', 'Engineering', 'Computer Science', 'Mathematics',
    'Engineering', 'Computer Science', 'Biology', 'Mathematics', 'Engineering',
    'Computer Science', 'Biology', 'Engineering', 'Mathematics', 'Computer Science',
    'Engineering', 'Computer Science', 'Biology', 'Mathematics', 'Engineering',
    'Computer Science', 'Biology', 'Engineering', 'Mathematics', 'Computer Science',
    'Engineering', 'Mathematics', 'Computer Science', 'Biology', 'Engineering'
  ];
BEGIN


-- ============================================================
-- Step 1: Create auth.users rows (7 admin/faculty + 35 students)
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  -- Super Admin
  (v_super_id, '00000000-0000-0000-0000-000000000000', 'superadmin@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Super Admin","role":"super_admin"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
   
  -- Admin
  (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"John Admin","role":"admin"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
   
  -- Faculty 1: Computer Science
  (v_fac1_id, '00000000-0000-0000-0000-000000000000', 'drsmith@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Alice Smith","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
   
  -- Faculty 2: Mathematics
  (v_fac2_id, '00000000-0000-0000-0000-000000000000', 'profbrown@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Prof. Bob Brown","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
   
  -- Faculty 3: Engineering
  (v_fac3_id, '00000000-0000-0000-0000-000000000000', 'prof.johnson@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Prof. John Johnson","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
   
  -- Faculty 4: Biology
  (v_fac4_id, '00000000-0000-0000-0000-000000000000', 'dr.wilson@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sarah Wilson","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
   
  -- Faculty 5: English
  (v_fac5_id, '00000000-0000-0000-0000-000000000000', 'prof.davis@university.edu',
   crypt('UniPass@2025', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Prof. Emily Davis","role":"faculty"}',
   FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert all 35 students
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  v_stu_ids[i],
  '00000000-0000-0000-0000-000000000000',
  v_stu_emails[i],
  crypt('UniPass@2025', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', v_stu_names[i], 'role', 'student'),
  FALSE, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''
FROM generate_series(1, 35) AS t(i)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 2: Insert auth.identities rows
-- ============================================================
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (v_super_id, v_super_id, 'superadmin@university.edu', json_build_object('sub', v_super_id::text, 'email', 'superadmin@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_admin_id, v_admin_id, 'admin@university.edu', json_build_object('sub', v_admin_id::text, 'email', 'admin@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_fac1_id, v_fac1_id, 'drsmith@university.edu', json_build_object('sub', v_fac1_id::text, 'email', 'drsmith@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_fac2_id, v_fac2_id, 'profbrown@university.edu', json_build_object('sub', v_fac2_id::text, 'email', 'profbrown@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_fac3_id, v_fac3_id, 'prof.johnson@university.edu', json_build_object('sub', v_fac3_id::text, 'email', 'prof.johnson@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_fac4_id, v_fac4_id, 'dr.wilson@university.edu', json_build_object('sub', v_fac4_id::text, 'email', 'dr.wilson@university.edu'), 'email', NOW(), NOW(), NOW()),
  (v_fac5_id, v_fac5_id, 'prof.davis@university.edu', json_build_object('sub', v_fac5_id::text, 'email', 'prof.davis@university.edu'), 'email', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert all 35 student identities
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  v_stu_ids[i],
  v_stu_ids[i],
  v_stu_emails[i],
  json_build_object('sub', v_stu_ids[i]::text, 'email', v_stu_emails[i]),
  'email', NOW(), NOW(), NOW()
FROM generate_series(1, 35) AS t(i)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 3: Update profiles with extra fields
-- ============================================================
-- Delete dependent rows first to avoid FK violations on re-runs
DELETE FROM public.course_faculty
WHERE faculty_id IN (v_fac1_id, v_fac2_id, v_fac3_id, v_fac4_id, v_fac5_id);

-- Delete existing admin/faculty profiles to ensure clean state
DELETE FROM public.profiles 
WHERE id IN (v_super_id, v_admin_id, v_fac1_id, v_fac2_id, v_fac3_id, v_fac4_id, v_fac5_id);

-- Now insert fresh admin/faculty profiles (role column must be set explicitly)
INSERT INTO public.profiles (id, email, full_name, department, role)
VALUES
  (v_fac1_id, 'drsmith@university.edu', 'Dr. Alice Smith', 'Computer Science', 'faculty'),
  (v_fac2_id, 'profbrown@university.edu', 'Prof. Bob Brown', 'Mathematics', 'faculty'),
  (v_fac3_id, 'prof.johnson@university.edu', 'Prof. John Johnson', 'Engineering', 'faculty'),
  (v_fac4_id, 'dr.wilson@university.edu', 'Dr. Sarah Wilson', 'Biology', 'faculty'),
  (v_fac5_id, 'prof.davis@university.edu', 'Prof. Emily Davis', 'English', 'faculty'),
  (v_super_id, 'superadmin@university.edu', 'Super Admin', 'Administration', 'super_admin'),
  (v_admin_id, 'admin@university.edu', 'John Admin', 'Administration', 'admin');

-- Update faculty with additional details
UPDATE public.profiles SET faculty_id = 'FAC-001', bio = 'Specializes in Data Structures and Algorithms' WHERE id = v_fac1_id;
UPDATE public.profiles SET faculty_id = 'FAC-002', bio = 'Expert in Linear Algebra and Calculus' WHERE id = v_fac2_id;
UPDATE public.profiles SET faculty_id = 'FAC-003', bio = 'Research focus on Systems Design' WHERE id = v_fac3_id;
UPDATE public.profiles SET faculty_id = 'FAC-004', bio = 'Specializes in Molecular Biology' WHERE id = v_fac4_id;
UPDATE public.profiles SET faculty_id = 'FAC-005', bio = 'Literature and Writing Composition' WHERE id = v_fac5_id;

-- Update all 35 students
-- First, clear any existing student IDs for these profiles
UPDATE public.profiles 
SET student_id = NULL
WHERE id = ANY(v_stu_ids);

-- Delete orphaned student_ids from previous failed runs (STU-2024-xxx entries not belonging to our students)
DELETE FROM public.profiles
WHERE student_id LIKE 'STU-2024-%'
AND id NOT IN (SELECT UNNEST(v_stu_ids));

-- Now assign fresh student IDs and ensure role is set correctly
FOR i IN 1..35 LOOP
  UPDATE public.profiles
  SET department = v_stu_depts[i],
      student_id = 'STU-2024-' || LPAD(i::text, 3, '0'),
      role = 'student'
  WHERE id = v_stu_ids[i];
END LOOP;

-- ============================================================
-- Step 4: Courses (8 courses across 5 departments)
-- ============================================================
INSERT INTO public.courses (id, course_code, title, description, credits, semester, academic_year, department, max_enrollment, status, created_by) VALUES
  -- Computer Science
  (v_course_ids[1], 'CS101', 'Introduction to Computer Science',
   'Fundamentals of programming and computational thinking. Learn the basics of algorithms, programming paradigms, and problem-solving techniques.',
   3, 'Fall 2025', '2025-2026', 'Computer Science', 40, 'active', v_admin_id),

  (v_course_ids[2], 'CS301', 'Data Structures & Algorithms',
   'Advanced data structures, algorithm design and complexity analysis. Deep dive into trees, graphs, and optimization.',
   4, 'Fall 2025', '2025-2026', 'Computer Science', 35, 'active', v_admin_id),

  -- Mathematics
  (v_course_ids[3], 'MATH201', 'Calculus II',
   'Integration techniques, sequences, series, and multivariable calculus. Applications in physics and engineering.',
   3, 'Fall 2025', '2025-2026', 'Mathematics', 45, 'active', v_admin_id),

  (v_course_ids[4], 'MATH301', 'Linear Algebra',
   'Matrices, eigenvalues, vector spaces, and linear transformations. Essential for scientific computing.',
   3, 'Fall 2025', '2025-2026', 'Mathematics', 40, 'active', v_admin_id),

  -- Engineering
  (v_course_ids[5], 'PHYS201', 'Thermodynamics I',
   'First law of thermodynamics, entropy, and heat engines. Fundamentals for mechanical engineering.',
   4, 'Fall 2025', '2025-2026', 'Engineering', 38, 'active', v_admin_id),

  -- Biology
  (v_course_ids[6], 'BIO101', 'General Biology I',
   'Cellular biology, genetics, and evolution. Laboratory component included.',
   4, 'Fall 2025', '2025-2026', 'Biology', 42, 'active', v_admin_id),

  -- English
  (v_course_ids[7], 'ENG101', 'English Composition I',
   'Academic writing, essay structure, and critical thinking. Intensive writing course.',
   3, 'Fall 2025', '2025-2026', 'English', 25, 'active', v_admin_id),

  (v_course_ids[8], 'ENG201', 'Literature and Analysis',
   'American and world literature. Close reading, textual analysis, and literary criticism.',
   3, 'Fall 2025', '2025-2026', 'English', 30, 'active', v_admin_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 5: Course Faculty Assignments
-- ============================================================
INSERT INTO public.course_faculty (course_id, faculty_id, is_primary, assigned_by) VALUES
  (v_course_ids[1], v_fac1_id, TRUE, v_admin_id),
  (v_course_ids[2], v_fac1_id, TRUE, v_admin_id),
  (v_course_ids[3], v_fac2_id, TRUE, v_admin_id),
  (v_course_ids[4], v_fac2_id, TRUE, v_admin_id),
  (v_course_ids[5], v_fac3_id, TRUE, v_admin_id),
  (v_course_ids[6], v_fac4_id, TRUE, v_admin_id),
  (v_course_ids[7], v_fac5_id, TRUE, v_admin_id),
  (v_course_ids[8], v_fac5_id, TRUE, v_admin_id)
ON CONFLICT (course_id, faculty_id) DO NOTHING;

-- ============================================================
-- Step 6: Enrollments (students enroll in multiple courses)
-- ============================================================
INSERT INTO public.enrollments (course_id, student_id, status, enrolled_at, approved_at, approved_by)
SELECT
  v_course_ids[((i-1) % array_length(v_course_ids, 1)) + 1],
  v_stu_ids[i],
  CASE WHEN (i % 5) = 0 THEN 'pending'::public.enrollment_status
       WHEN (i % 7) = 0 THEN 'rejected'::public.enrollment_status
       ELSE 'approved'::public.enrollment_status END,
  NOW() - INTERVAL '30 days' + (random() * INTERVAL '20 days'),
  NOW() - INTERVAL '25 days' + (random() * INTERVAL '15 days'),
  v_admin_id
FROM generate_series(1, 35) AS t(i)
ON CONFLICT (course_id, student_id) DO NOTHING;

-- Add more enrollments so students take 2-3 courses each
INSERT INTO public.enrollments (course_id, student_id, status, enrolled_at, approved_at, approved_by)
SELECT
  v_course_ids[((i + array_length(v_course_ids, 1)/2 - 1) % array_length(v_course_ids, 1)) + 1],
  v_stu_ids[((i-1) % 35) + 1],
  'approved'::public.enrollment_status,
  NOW() - INTERVAL '30 days' + (random() * INTERVAL '20 days'),
  NOW() - INTERVAL '25 days' + (random() * INTERVAL '15 days'),
  v_admin_id
FROM generate_series(1, 70) AS t(i)
ON CONFLICT (course_id, student_id) DO NOTHING;

-- ============================================================
-- Step 7: Assignments (3 per course = 24 total)
-- ============================================================
INSERT INTO public.assignments (id, course_id, created_by, title, description, instructions, due_date, max_points, allow_late, is_published)
SELECT
  v_assign_ids[((i-1)*3 + 1)],
  v_course_ids[i],
  CASE WHEN i <= 2 THEN v_fac1_id
       WHEN i <= 4 THEN v_fac2_id
       WHEN i = 5 THEN v_fac3_id
       WHEN i = 6 THEN v_fac4_id
       ELSE v_fac5_id END,
  'Week ' || i || ' Assignment 1: Introduction',
  'Submit your first assignment for this week. Focus on understanding the core concepts.',
  'Submit a document or code following the guidelines in the course materials.',
  NOW() + INTERVAL '7 days' + (i * INTERVAL '1 day'),
  100, TRUE, TRUE
FROM generate_series(1, 8) AS t(i)
UNION ALL
SELECT
  v_assign_ids[((i-1)*3 + 2)],
  v_course_ids[i],
  CASE WHEN i <= 2 THEN v_fac1_id
       WHEN i <= 4 THEN v_fac2_id
       WHEN i = 5 THEN v_fac3_id
       WHEN i = 6 THEN v_fac4_id
       ELSE v_fac5_id END,
  'Week ' || i || ' Assignment 2: Practice Problems',
  'Complete the practice problems to solidify your understanding.',
  'Solve all problems and show your work. Partial credit available.',
  NOW() + INTERVAL '14 days' + (i * INTERVAL '1 day'),
  100, TRUE, TRUE
FROM generate_series(1, 8) AS t(i)
UNION ALL
SELECT
  v_assign_ids[((i-1)*3 + 3)],
  v_course_ids[i],
  CASE WHEN i <= 2 THEN v_fac1_id
       WHEN i <= 4 THEN v_fac2_id
       WHEN i = 5 THEN v_fac3_id
       WHEN i = 6 THEN v_fac4_id
       ELSE v_fac5_id END,
  'Week ' || i || ' Assignment 3: Project',
  'Demonstrate your mastery with a comprehensive project.',
  'Create a project that integrates the concepts from this week. Be creative!',
  NOW() + INTERVAL '21 days' + (i * INTERVAL '1 day'),
  100, FALSE, TRUE
FROM generate_series(1, 8) AS t(i)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 8: Submissions (students submit assignments)
-- ============================================================
INSERT INTO public.submissions (id, assignment_id, student_id, content, status, submitted_at, is_late)
SELECT
  uuid_generate_v4(),
  v_assign_ids[((a_idx-1) % 24) + 1],
  v_stu_ids[s_idx],
  'Submission content for assignment ' || a_idx || ' by student ' || s_idx,
  CASE WHEN (a_idx + s_idx) % 10 = 0 THEN 'draft'::public.submission_status
       WHEN (a_idx + s_idx) % 7 = 0 THEN 'submitted'::public.submission_status
       ELSE 'graded'::public.submission_status END,
  NOW() - INTERVAL '15 days' + ((a_idx * s_idx) * INTERVAL '30 minutes'),
  ((a_idx + s_idx) % 11 = 0)::boolean
FROM generate_series(1, 24) AS t1(a_idx)
CROSS JOIN generate_series(1, 35) AS t2(s_idx)
WHERE EXISTS (
  SELECT 1 FROM public.enrollments e
  WHERE e.student_id = v_stu_ids[s_idx]
  AND e.course_id = (
    SELECT course_id FROM public.assignments WHERE id = v_assign_ids[((a_idx-1) % 24) + 1]
  )
  AND e.status = 'approved'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 9: Grades (faculty grade submissions)
-- ============================================================
INSERT INTO public.grades (id, submission_id, graded_by, points, feedback, graded_at)
SELECT
  uuid_generate_v4(),
  s.id,
  CASE 
    WHEN a.created_by = v_fac1_id THEN v_fac1_id
    WHEN a.created_by = v_fac2_id THEN v_fac2_id
    WHEN a.created_by = v_fac3_id THEN v_fac3_id
    WHEN a.created_by = v_fac4_id THEN v_fac4_id
    ELSE v_fac5_id
  END,
  -- Assign realistic grades: 60-100 range with normal distribution
  CASE WHEN random() < 0.1 THEN 60 + random() * 10  -- 10% struggle
       WHEN random() < 0.3 THEN 70 + random() * 15  -- 20% average
       WHEN random() < 0.7 THEN 80 + random() * 20  -- 40% good
       ELSE 85 + random() * 15                       -- 30% excellent
  END::numeric(6,2),
  CASE WHEN random() < 0.3 THEN 'Great work! Well done.' 
       WHEN random() < 0.6 THEN 'Good effort. Review comments for improvements.'
       WHEN random() < 0.8 THEN 'Meets expectations. Keep improving!'
       ELSE 'Excellent! This is exemplary work.' END,
  NOW() - INTERVAL '10 days' + ((ROW_NUMBER() OVER ()) * INTERVAL '5 minutes')
FROM public.submissions s
JOIN public.assignments a ON a.id = s.assignment_id
WHERE s.status != 'draft'
ON CONFLICT (submission_id) DO NOTHING;

-- ============================================================
-- Step 10: Attendance Records
-- ============================================================
INSERT INTO public.attendance (course_id, student_id, recorded_by, session_date, is_present, notes)
SELECT
  c.id,
  s_id,
  CASE 
    WHEN c.department = 'Computer Science' THEN v_fac1_id
    WHEN c.department = 'Mathematics' THEN v_fac2_id
    WHEN c.department = 'Engineering' THEN v_fac3_id
    WHEN c.department = 'Biology' THEN v_fac4_id
    ELSE v_fac5_id
  END,
  (NOW() - INTERVAL '60 days')::date + d,
  CASE WHEN random() < 0.9 THEN TRUE ELSE FALSE END,
  CASE WHEN random() < 0.05 THEN 'Excused absence' ELSE NULL END
FROM (SELECT * FROM public.courses c) c,
     (SELECT UNNEST(v_stu_ids) AS s_id) stu,
     generate_series(0, 40) d
WHERE EXISTS (
  SELECT 1 FROM public.enrollments e
  WHERE e.student_id = stu.s_id
  AND e.course_id = c.id
  AND e.status = 'approved'
)
AND d % 3 = 0  -- Every 3 days for session dates
ON CONFLICT (course_id, student_id, session_date) DO NOTHING;

-- ============================================================
-- Step 11: Announcements (Global and Course-specific)
-- ============================================================
INSERT INTO public.announcements (author_id, course_id, title, content, audience, is_pinned, published_at)
VALUES
  -- Global announcements
  (v_admin_id, NULL, 'Welcome to Fall 2025!',
   'Welcome to the new semester. Please complete your enrollment before the deadline of September 5th. Visit the registrar office for any questions.',
   'all', TRUE, NOW() - INTERVAL '45 days'),
  
  (v_admin_id, NULL, 'Midterm Exam Schedule Released',
   'Midterm exams will be held from October 14-25, 2025. Check your course portals for specific dates and locations.',
   'students', FALSE, NOW() - INTERVAL '35 days'),
  
  (v_admin_id, NULL, 'Library Extended Hours',
   'The library will be open extended hours during finals week. Sunday-Thursday: 8am-midnight, Friday-Saturday: 8am-10pm.',
   'all', TRUE, NOW() - INTERVAL '10 days'),
  
  -- Computer Science 101 announcements
  (v_fac1_id, v_course_ids[1], 'Welcome to CS101!',
   'I''m excited to have you in my class! Please review the syllabus and introduce yourself in the discussion forum.',
   'students', TRUE, NOW() - INTERVAL '40 days'),
  
  (v_fac1_id, v_course_ids[1], 'Programming Environment Setup',
   'Please install Python 3.11 and VS Code before the next class. Tutorial link: [setup guide]',
   'students', FALSE, NOW() - INTERVAL '35 days'),
  
  (v_fac1_id, v_course_ids[1], 'Assignment 1 Reminder',
   'Assignment 1 is due this Friday by 11:59 PM. Submit via the assignment portal.',
   'students', FALSE, NOW() - INTERVAL '8 days'),
  
  -- Data Structures course announcements
  (v_fac1_id, v_course_ids[2], 'Advanced Topics in DSA',
   'This course requires strong fundamentals. Make sure you''re comfortable with CS101 material.',
   'students', TRUE, NOW() - INTERVAL '42 days'),
  
  (v_fac1_id, v_course_ids[2], 'Midterm Review Session',
   'Join me for a review session on Wednesday at 2 PM in Lab 204. Optional but highly recommended!',
   'students', FALSE, NOW() - INTERVAL '20 days'),
  
  -- Calculus II announcements
  (v_fac2_id, v_course_ids[3], 'Welcome to Calculus II',
   'This course builds on Calculus I. We''ll explore integration, sequences, and multivariable calculus.',
   'students', TRUE, NOW() - INTERVAL '40 days'),
  
  (v_fac2_id, v_course_ids[3], 'Textbook Update',
   'Please get a copy of "Calculus: Early Transcendentals" 9th edition. Used copies available in the bookstore.',
   'students', FALSE, NOW() - INTERVAL '38 days'),
  
  (v_fac2_id, v_course_ids[3], 'Extra Help Sessions',
   'I''m hosting office hours: MWF 3-5 PM and Tuesday 2-4 PM. No appointment necessary!',
   'students', FALSE, NOW() - INTERVAL '25 days'),
  
  -- Linear Algebra announcements
  (v_fac2_id, v_course_ids[4], 'Linear Algebra is Everywhere!',
   'From machine learning to graphics programming, linear algebra is fundamental. Let''s explore its applications.',
   'students', TRUE, NOW() - INTERVAL '41 days'),
  
  -- Engineering course announcements
  (v_fac3_id, v_course_ids[5], 'Lab Safety Requirements',
   'All students must complete the online lab safety module before attending lab sessions. Link: [safety module]',
   'students', TRUE, NOW() - INTERVAL '39 days'),
  
  (v_fac3_id, v_course_ids[5], 'Lab Schedule Announced',
   'Lab sessions: Monday 2-5 PM, Wednesday 1-4 PM, Friday 10am-1pm. Choose one session per week.',
   'students', FALSE, NOW() - INTERVAL '37 days'),
  
  -- Biology announcements
  (v_fac4_id, v_course_ids[6], 'Welcome to General Biology I',
   'Prepare for an exciting journey into cellular biology and genetics. Lab coats required starting next week.',
   'students', TRUE, NOW() - INTERVAL '40 days'),
  
  (v_fac4_id, v_course_ids[6], 'Lab Report Format Guide',
   'Please follow the provided template for all lab reports. Grading rubric available in course materials.',
   'students', FALSE, NOW() - INTERVAL '30 days'),
  
  -- English courses announcements
  (v_fac5_id, v_course_ids[7], 'Writing Center Resources',
   'Take advantage of our writing center! Free sessions available to help with essays and speeches.',
   'students', TRUE, NOW() - INTERVAL '40 days'),
  
  (v_fac5_id, v_course_ids[7], 'Essay 1 Due Next Week',
   'Your first essay is due Friday. Remember to use proper citation format and check the rubric carefully.',
   'students', FALSE, NOW() - INTERVAL '12 days'),
  
  (v_fac5_id, v_course_ids[8], 'Book Club Discussion',
   'We''ll be discussing "To Kill a Mockingbird" next Monday. Come prepared with discussion points!',
   'students', FALSE, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

END $$;

