import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import type { UserRole } from '@/types';

/** Utility for building Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string for display */
export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  return format(new Date(date), fmt);
}

/** Format a date with time */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

/** Human-readable relative time: "3 days ago", "in 2 hours" */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Describe a due date clearly */
export function describeDueDate(dueDate: string | Date): { label: string; urgent: boolean } {
  const d = new Date(dueDate);
  if (isPast(d)) return { label: `Overdue (${formatDate(d)})`, urgent: true };
  if (isToday(d)) return { label: 'Due Today', urgent: true };
  if (isTomorrow(d)) return { label: 'Due Tomorrow', urgent: true };
  return { label: `Due ${formatDate(d)}`, urgent: false };
}

/** Role display name */
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  faculty:     'Faculty',
  student:     'Student',
};

/** Role badge color classes */
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin:       'bg-blue-100 text-blue-800',
  faculty:     'bg-green-100 text-green-800',
  student:     'bg-orange-100 text-orange-800',
};

/** Enrollment status badge colors */
export const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  dropped:  'bg-gray-100 text-gray-600',
};

/** Submission status badge colors */
export const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-800',
  graded:    'bg-green-100 text-green-800',
  returned:  'bg-orange-100 text-orange-800',
};

/** Convert points to a letter grade */
export function pointsToGrade(points: number, maxPoints: number): string {
  const pct = (points / maxPoints) * 100;
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

/** Grade point value for GPA calculation */
export function gradeToGPA(grade: string): number {
  const map: Record<string, number> = {
    'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0,
  };
  return map[grade] ?? 0;
}

/** Build a Supabase public storage URL */
export function getStorageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Extract filename from a storage path */
export function storageName(path: string): string {
  return path.split('/').pop() ?? path;
}

/** Truncate long text */
export function truncate(text: string, length = 80): string {
  return text.length > length ? text.slice(0, length) + '…' : text;
}

/** Capitalize the first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Safe JSON parse with fallback */
export function safeJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; }
  catch { return fallback; }
}

/** Validate file type and size before upload */
export function validateFile(
  file: File,
  opts: { maxSizeMB?: number; allowedTypes?: string[] } = {},
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes } = opts;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File must be smaller than ${maxSizeMB} MB` };
  }
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }
  return { valid: true };
}
