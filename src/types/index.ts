/**
 * Generated TypeScript types matching the Supabase schema.
 * Regenerate with: `npx supabase gen types typescript --local > src/types/database.ts`
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'super_admin' | 'admin' | 'faculty' | 'student';
export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'dropped';
export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned';
export type CourseStatus = 'draft' | 'active' | 'archived';
export type AnnouncementAudience = 'all' | 'students' | 'faculty' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at'>>;
        Relationships: [];
      };
      course_faculty: {
        Row: CourseFaculty;
        Insert: Omit<CourseFaculty, 'id' | 'assigned_at'>;
        Update: Partial<Omit<CourseFaculty, 'id'>>;
        Relationships: [];
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Enrollment, 'id' | 'created_at'>>;
        Relationships: [];
      };
      assignments: {
        Row: Assignment;
        Insert: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Assignment, 'id' | 'created_at'>>;
        Relationships: [];
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Submission, 'id' | 'created_at'>>;
        Relationships: [];
      };
      grades: {
        Row: Grade;
        Insert: Omit<Grade, 'id' | 'updated_at'>;
        Update: Partial<Omit<Grade, 'id'>>;
        Relationships: [];
      };
      grade_history: {
        Row: GradeHistory;
        Insert: Omit<GradeHistory, 'id' | 'changed_at'>;
        Update: Record<string, never>;
        Relationships: [];
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Announcement, 'id' | 'created_at'>>;
        Relationships: [];
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'created_at'>;
        Update: Partial<Omit<Attendance, 'id'>>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_faculty_or_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ---- Entity Interfaces ----

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  student_id: string | null;
  faculty_id: string | null;
  phone: string | null;
  department: string | null;
  bio: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  course_code: string;
  title: string;
  description: string | null;
  credits: number;
  semester: string;
  academic_year: string;
  department: string | null;
  max_enrollment: number;
  status: CourseStatus;
  cover_image_url: string | null;
  deleted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseFaculty {
  id: string;
  course_id: string;
  faculty_id: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string | null;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  dropped_at: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  created_by: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  max_points: number;
  allow_late: boolean;
  late_penalty_pct: number | null;
  attachment_urls: string[] | null;
  is_published: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  attachment_urls: string[] | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  is_late: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  submission_id: string;
  graded_by: string;
  points: number;
  feedback: string | null;
  graded_at: string;
  updated_at: string;
}

export interface GradeHistory {
  id: string;
  grade_id: string;
  submission_id: string;
  points: number;
  feedback: string | null;
  changed_by: string;
  changed_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  course_id: string | null;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  is_pinned: boolean;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  course_id: string;
  student_id: string;
  recorded_by: string;
  session_date: string;
  is_present: boolean;
  notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  created_at: string;
}

// ---- Extended / Joined Types ----

export interface CourseWithFaculty extends Course {
  course_faculty: Array<{ faculty: Profile; is_primary: boolean }>;
}

export interface EnrollmentWithDetails extends Enrollment {
  course: Course;
  student: Profile;
}

export interface AssignmentWithCourse extends Assignment {
  course: Pick<Course, 'id' | 'course_code' | 'title'>;
}

export interface SubmissionWithDetails extends Submission {
  assignment: Pick<Assignment, 'id' | 'title' | 'due_date' | 'max_points' | 'course_id'>;
  student: Pick<Profile, 'id' | 'full_name' | 'email' | 'student_id' | 'avatar_url'>;
  grade?: Grade;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'>;
  course?: Pick<Course, 'id' | 'course_code' | 'title'> | null;
}

// ---- API / Pagination Helpers ----

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ---- Form Types ----

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface CreateCourseFormData {
  course_code: string;
  title: string;
  description: string;
  credits: number;
  semester: string;
  academic_year: string;
  department: string;
  max_enrollment: number;
  status: CourseStatus;
}

export interface CreateAssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  due_date: Date;
  max_points: number;
  allow_late: boolean;
  late_penalty_pct: number;
  is_published: boolean;
}

export interface GradeFormData {
  points: number;
  feedback: string;
}

export interface UserFormData {
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  phone: string;
  bio: string;
}

// ---- Dashboard Stats ----

export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  totalFaculty: number;
  totalStudents: number;
  activeCourses: number;
}

export interface FacultyDashboardStats {
  coursesTaught: number;
  totalStudents: number;
  pendingSubmissions: number;
  upcomingAssignments: number;
}

export interface StudentDashboardStats {
  enrolledCourses: number;
  upcomingDeadlines: number;
  completedAssignments: number;
  averageGrade: number | null;
}
