-- Migration: Allow faculty to approve/reject enrollments for courses they teach
-- Run this in the Supabase SQL Editor once.

DROP POLICY IF EXISTS "enrollments: student/admin update" ON public.enrollments;

CREATE POLICY "enrollments: student/admin update"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (
    -- Students can only drop their own enrollment
    (student_id = auth.uid() AND public.current_user_role() = 'student')
    -- Admins can change any enrollment
    OR public.is_admin()
    -- Faculty can approve/reject enrollments for courses they teach
    OR (
      public.current_user_role() = 'faculty'
      AND course_id IN (SELECT course_id FROM public.course_faculty WHERE faculty_id = auth.uid())
    )
  );
