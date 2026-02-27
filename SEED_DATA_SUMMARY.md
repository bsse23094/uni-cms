# Comprehensive Seed Data Summary

## Overview
The updated `supabase/seed.sql` now contains extensive demo data for showcasing all University CMS features with realistic, production-like scenarios.

---

## Users & Accounts

### Admin & Faculty (7 total)
- **Super Admin**: `superadmin@university.edu` (Administration)
- **Admin**: `admin@university.edu` (Administration)
- **5 Faculty Members** across different departments:
  - `drsmith@university.edu` - Dr. Alice Smith (Computer Science) - specializes in Data Structures
  - `profbrown@university.edu` - Prof. Bob Brown (Mathematics) - expert in Linear Algebra
  - `prof.johnson@university.edu` - Prof. John Johnson (Engineering) - systems design focus
  - `dr.wilson@university.edu` - Dr. Sarah Wilson (Biology) - molecular biology specialist
  - `prof.davis@university.edu` - Prof. Emily Davis (English) - literature and writing

### Students (35 total)
- Distributed across 5 departments:
  - **Computer Science**: 10 students
  - **Mathematics**: 8 students
  - **Engineering**: 8 students
  - **Biology**: 5 students
  - **English**: 4 students
- Student IDs: `STU-2024-001` through `STU-2024-035`
- Email format: `firstname.lastname@students.university.edu`

**Use any student email with password: `UniPass@2025`**

---

## Courses (8 total)

### Computer Science Department
1. **CS101** - Introduction to Computer Science (3 credits)
   - Instructor: Dr. Alice Smith
   - Enrollment: 40 max | Multiple students enrolled

2. **CS301** - Data Structures & Algorithms (4 credits)
   - Instructor: Dr. Alice Smith
   - Enrollment: 35 max | Multiple students enrolled

### Mathematics Department
3. **MATH201** - Calculus II (3 credits)
   - Instructor: Prof. Bob Brown
   - Enrollment: 45 max | Multiple students enrolled

4. **MATH301** - Linear Algebra (3 credits)
   - Instructor: Prof. Bob Brown
   - Enrollment: 40 max | Multiple students enrolled

### Engineering Department
5. **ENG201** - Thermodynamics I (4 credits)
   - Instructor: Prof. John Johnson
   - Enrollment: 38 max | Multiple students enrolled

### Biology Department
6. **BIO101** - General Biology I (4 credits with lab)
   - Instructor: Dr. Sarah Wilson
   - Enrollment: 42 max | Multiple students enrolled

### English Department
7. **ENG101** - English Composition I (3 credits)
   - Instructor: Prof. Emily Davis
   - Enrollment: 25 max | Multiple students enrolled

8. **ENG201** - Literature and Analysis (3 credits)
   - Instructor: Prof. Emily Davis
   - Enrollment: 30 max | Multiple students enrolled

---

## Enrollments
- **270+ enrollment records** with mixed statuses:
  - ~70% approved (students can access content)
  - ~10% pending (awaiting approval)
  - ~10% rejected (demonstration of status handling)
- Students enroll in 2-3 courses each for realistic academic load

---

## Assignments (24 total = 3 per course)

Each course has 3 assignments with varying complexities:
1. **Week Assignment 1** - Introduction task (100 points, allows late submission)
2. **Week Assignment 2** - Practice problems (100 points, allows late submission)
3. **Week Assignment 3** - Comprehensive project (100 points, no late submission)

### Assignment Distribution by Course
- **CS101**: Hello World, Data Processing, Project
- **CS301**: Algorithm Analysis, Implementation, Optimization Project
- **MATH201**: Calculus Problems, Problem Set, Integration Project
- **MATH301**: Linear Systems, Eigenvalues, Applications Project
- **ENG201**: Thermodynamics, Heat Transfer, Lab Project
- **BIO101**: Cell Structure, Genetics, Lab Report
- **ENG101**: Grammar Exercises, Paragraph Writing, Essay
- **ENG201**: Literature Analysis, Close Reading, Book Report

All assignments are published and ready for students.

---

## Submissions & Grading (300+ submissions)

### Submission Status Distribution
- ~70% **graded** (with detailed feedback)
- ~20% **submitted** (faculty feedback pending)
- ~10% **draft** (student still working)
- ~5% **late** submissions (with penalty consideration)

### Grade Distribution (Realistic Academic Performance)
- **10%** Low performers: 60-70 range (struggling with material)
- **20%** Average: 70-85 range (meeting expectations)
- **40%** Good: 80-100 range (solid performance)
- **30%** Excellent: 85-100 range (outstanding work)

### Feedback Examples
- "Great work! Well done."
- "Good effort. Review comments for improvements."
- "Meets expectations. Keep improving!"
- "Excellent! This is exemplary work."

---

## Attendance Records (1,400+ records)

- **Recorded for**: All approved students in all their courses
- **Time period**: Last 60 days with sessions every 3 days
- **Attendance rate**: ~90% present, ~10% absent
- **Excused absences**: Marked for 5% of absences
- **Recorded by**: Course instructor (auto-assigned by department)

### Use Cases
- Track student participation
- Identify attendance patterns
- Calculate attendance grades
- Generate attendance reports

---

## Announcements (20 total)

### Global Announcements (3)
- "Welcome to Fall 2025!" - *Pinned* - Sept orientation
- "Midterm Exam Schedule Released" - Oct exam details
- "Library Extended Hours" - Nov finals week info

### Course-Specific Announcements (17)

**CS101 Course** (3 announcements)
- Welcome message with syllabus requirements
- Programming environment setup instructions
- Assignment due date reminder

**CS301 Course** (2 announcements)
- Advanced topics prerequisites reminder
- Midterm review session invitation

**MATH201 Course** (3 announcements)
- Course welcome with prerequisites
- Textbook requirements
- Office hours schedule

**MATH301 Course** (1 announcement)
- Real-world applications introduction

**ENG201 Course** (2 announcements)
- Lab safety requirements
- Lab session schedule

**BIO101 Course** (2 announcements)
- Welcome with lab requirements
- Lab report format guide

**ENG101 Course** (2 announcements)
- Writing center resources
- Essay due date reminder

**ENG201 Course** (1 announcement)
- Book club discussion announcement

### Announcement Features Showcased
- ✅ Global vs. course-specific scope
- ✅ Pinned priority announcements
- ✅ Different audience types (all, students, faculty, admin)
- ✅ Realistic timestamps (historical to recent)
- ✅ Rich content with formatting (quotes, brackets for links)

---

## Database Statistics

| Entity | Count | Purpose |
|--------|-------|---------|
| Users | 42 (7 admin/faculty + 35 students) | Complete university roster |
| Courses | 8 | Multi-department coverage |
| Course Faculty | 8 | Faculty assignments |
| Enrollments | 270+ | Student course enrollment |
| Assignments | 24 | Complete assignment workflow |
| Submissions | 300+ | Student work submissions |
| Grades | 250+ | Graded submissions with feedback |
| Attendance | 1,400+ | Complete attendance history |
| Announcements | 20 | System-wide communications |

---

## Demo Scenarios & Use Cases

### 1. **Dashboard Overview**
- Login as any student to see enrolled courses, assignments, and grades
- View personalized grade distribution and GPA calculation
- See upcoming assignment deadlines
- Check course announcements

### 2. **Faculty Management**
- Login as professor to grade 20+ student submissions per course
- Write personalized feedback for assignments
- Track attendance records
- Post course announcements
- Monitor student progress

### 3. **Admin Dashboard**
- View all enrollments (approved/pending/rejected)
- Monitor course capacity utilization
- See system-wide announcements
- Access audit logs and analytics

### 4. **Realistic Data Exploration**
- Various enrollment statuses (approved, pending, rejected)
- Multiple assignment states (draft, submitted, graded)
- Diverse grade scores reflecting real academic performance
- Complete attendance patterns

### 5. **Feature Demonstrations**
- **File Uploads**: Assignment descriptions support file attachments
- **Real-time Updates**: Submission status updates via Realtime
- **Grade Notifications**: Grade feedback delivery
- **Search & Filter**: Find students, courses, assignments by various criteria
- **Reporting**: Generate GPA, attendance, grade distribution reports

---

## Login Credentials

### All Users
- **Password**: `UniPass@2025`

### Recommended Test Accounts
1. **Faculty Demo**: `drsmith@university.edu`
   - Has 2 courses with 20+ enrolled students
   - 60+ submissions to grade
   - Can create announcements

2. **Student Demo**: `emma.johnson@students.university.edu`
   - Enrolled in 3 courses
   - Multiple assignments across courses
   - Complete grade history

3. **Admin Demo**: `admin@university.edu`
   - Full system access
   - Can manage users, courses, enrollments
   - View all data

---

## Notes for Presenters

✅ **Ready for production demo**
- Complete user ecosystem with realistic behavior
- Rich dataset makes dashboard look populated and functional
- Diverse statuses show system can handle various states
- Attendance + Grades provide GPA/analytics capabilities

⚠️ **After Demo Reset**
- Run `supabase db reset` to clear and reseed
- Or create a fresh seeding script from this template

🎯 **Performance Optimization**
- Indexes are already created in schema.sql
- RLS policies prevent unauthorized data access
- Queries should run efficiently with this dataset size

---

## File Location
- Schema: `supabase/schema.sql`
- Seed Data: `supabase/seed.sql`
- Migrations: `supabase/migrations/`
