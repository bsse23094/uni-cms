import { z } from 'zod';

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  // NOTE: role is intentionally excluded – all self-registrations default to 'student'.
  // Elevated roles can only be assigned by an admin after registration.
});

// ---- User / Profile ----
export const userFormSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  full_name: z.string().min(2).max(100),
  role: z.enum(['super_admin', 'admin', 'faculty', 'student']),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

// ---- Course ----
export const courseFormSchema = z.object({
  course_code: z.string().min(2).max(20).toUpperCase(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  credits: z.number().int().min(1).max(12),
  semester: z.string().min(3).max(50),
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY')
    .optional(),
  department: z.string().max(100).optional(),
  max_enrollment: z.number().int().min(1).max(500),
  status: z.enum(['draft', 'active', 'archived']),
});

// ---- Assignment ----
export const assignmentFormSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(5000).optional(),
  due_date: z.date({ required_error: 'Due date is required' }),
  max_points: z.number().min(1).max(1000),
  allow_late: z.boolean().default(false),
  late_penalty_pct: z.number().min(0).max(100).default(0),
  is_published: z.boolean().default(false),
});

// ---- Grade ----
export const gradeFormSchema = z.object({
  points: z.number().min(0, 'Points cannot be negative'),
  feedback: z.string().max(2000).optional(),
});

// ---- Announcement ----
export const announcementFormSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
  audience: z.enum(['all', 'students', 'faculty', 'admin']),
  course_id: z.string().uuid().nullable().optional(),
  is_pinned: z.boolean().default(false),
});

// ---- Enrollment ----
export const enrollmentStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'dropped']),
  notes: z.string().max(500).optional(),
});

// ---- Attendance ----
export const attendanceSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  records: z.array(
    z.object({
      student_id: z.string().uuid(),
      is_present: z.boolean(),
      notes: z.string().max(200).optional(),
    }),
  ),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type UserFormSchema = z.infer<typeof userFormSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type CourseFormSchema = z.infer<typeof courseFormSchema>;
export type AssignmentFormSchema = z.infer<typeof assignmentFormSchema>;
export type GradeFormSchema = z.infer<typeof gradeFormSchema>;
export type AnnouncementFormSchema = z.infer<typeof announcementFormSchema>;
export type EnrollmentStatusSchema = z.infer<typeof enrollmentStatusSchema>;
export type AttendanceSchema = z.infer<typeof attendanceSchema>;

// Convenience aliases used by page components
export type UserFormData = UserFormSchema;
export type UpdateProfileData = UpdateProfileSchema;
export type CourseFormData = CourseFormSchema;
export type AssignmentFormData = AssignmentFormSchema;
export type GradeFormData = GradeFormSchema;
export type AnnouncementFormData = AnnouncementFormSchema;
