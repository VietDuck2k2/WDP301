# ECMS API Quick Reference

## Base URL

```
http://localhost:5000/api
```

## Authentication

Include JWT token in header for protected routes:

```
Authorization: Bearer <your-token>
```

---

## 🔓 Public Endpoints

### Auth

```http
POST /api/auth/register
POST /api/auth/login
```

---

## 🔐 Authenticated Endpoints

### Profile (All Roles)

```http
GET    /api/me
PUT    /api/me
POST   /api/me/change-password
```

### Files (All Roles)

```http
POST   /api/files/upload
POST   /api/files/upload-multiple
DELETE /api/files/:filename
GET    /api/files/:filename/info
```

---

## 👑 Admin Endpoints

### Users

```http
GET    /api/admin/users
GET    /api/admin/users/:id
GET    /api/admin/users/role/:role
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

### Classes

```http
GET    /api/admin/classes
GET    /api/admin/classes/:id
GET    /api/admin/classes/:id/members
POST   /api/admin/classes
POST   /api/admin/classes/:id/enroll
POST   /api/admin/classes/:id/assign-teacher
PUT    /api/admin/classes/:id
DELETE /api/admin/classes/:id
```

### Schedule Templates

```http
GET    /api/admin/schedule-templates
GET    /api/admin/schedule-templates/:id
POST   /api/admin/schedule-templates
PUT    /api/admin/schedule-templates/:id
DELETE /api/admin/schedule-templates/:id
```

### Sessions

```http
GET    /api/admin/sessions
GET    /api/admin/sessions/:id
POST   /api/admin/sessions
PUT    /api/admin/sessions/:id
DELETE /api/admin/sessions/:id
```

---

## 👨‍🏫 Teacher Endpoints

### Classes

```http
GET    /api/teacher/classes
GET    /api/teacher/classes/:id
GET    /api/teacher/classes/:id/members
```

### Sessions

```http
GET    /api/teacher/sessions
GET    /api/teacher/sessions/:id
GET    /api/teacher/classes/:classId/sessions
PUT    /api/teacher/sessions/:id
POST   /api/teacher/sessions/:id/materials
```

### Attendance

```http
GET    /api/teacher/attendances/sessions/:sessionId
POST   /api/teacher/attendances/sessions/:sessionId
POST   /api/teacher/attendances/sessions/:sessionId/bulk
GET    /api/teacher/attendances/students/:studentId
```

### Assignments

```http
GET    /api/teacher/assignments
GET    /api/teacher/assignments/:id
GET    /api/teacher/assignments/:id/submissions
POST   /api/teacher/assignments
POST   /api/teacher/assignments/:id/publish
POST   /api/teacher/submissions/:id/grade
PUT    /api/teacher/assignments/:id
DELETE /api/teacher/assignments/:id
```

### Announcements

```http
GET    /api/teacher/announcements
GET    /api/teacher/announcements/:id
POST   /api/teacher/announcements
POST   /api/teacher/announcements/:id/toggle-pin
PUT    /api/teacher/announcements/:id
DELETE /api/teacher/announcements/:id
```

---

## 👨‍🎓 Student Endpoints

### Classes

```http
GET    /api/student/classes
GET    /api/student/classes/:id
```

### Assignments

```http
GET    /api/student/assignments/classes/:classId
GET    /api/student/assignments/:id
```

### Submissions

```http
GET    /api/student/submissions
GET    /api/student/submissions/:id
GET    /api/student/submissions/assignments/:assignmentId
POST   /api/student/submissions/assignments/:assignmentId/submit
POST   /api/student/submissions/assignments/:assignmentId/save-draft
```

### Announcements

```http
GET    /api/student/announcements/classes/:classId
GET    /api/student/announcements/:id
```

---

## 📝 Request Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile

```bash
curl http://localhost:5000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Class (Admin)

```bash
curl -X POST http://localhost:5000/api/admin/classes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "English 101",
    "code": "ENG101",
    "level": "beginner",
    "capacity": 20,
    "startDate": "2024-02-01",
    "endDate": "2024-06-30"
  }'
```

### Upload File

```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

### Create Assignment (Teacher)

```bash
curl -X POST http://localhost:5000/api/teacher/assignments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class": "CLASS_ID",
    "title": "Essay Assignment",
    "description": "Write a 500-word essay",
    "dueDate": "2024-03-15",
    "maxScore": 100
  }'
```

### Submit Assignment (Student)

```bash
curl -X POST http://localhost:5000/api/student/submissions/assignments/ASSIGNMENT_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "My essay content here..."
  }'
```

### Mark Attendance (Teacher)

```bash
curl -X POST http://localhost:5000/api/teacher/attendances/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID",
    "status": "present"
  }'
```

---

## 🔍 Query Parameters

### Pagination (Most list endpoints)

```
?page=1&limit=20
```

### Filtering

```
# By role
/api/admin/users?role=teacher

# By status
/api/admin/classes?status=active

# By date range
/api/admin/sessions?startDate=2024-01-01&endDate=2024-12-31

# Search
/api/admin/users?search=john
```

### Sorting

```
# Most endpoints sort by creation date descending by default
```

---

## 📤 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "details": [] // Optional validation errors
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## 🔑 User Roles

- **admin**: Full system access
- **teacher**: Manage classes, sessions, assignments, attendance
- **student**: View classes, submit assignments, view grades

---

## 📋 Data Models

### User Fields

- email, password, firstName, lastName
- role (admin/teacher/student)
- phone, avatar, dateOfBirth, address
- isActive, lastLogin

### Class Fields

- name, code, description, level
- capacity, startDate, endDate
- scheduleTemplate, room, status

### Assignment Fields

- class, title, description, instructions
- dueDate, maxScore, attachments
- createdBy, status, publishedAt

### Session Fields

- class, title, description, sessionNumber
- date, startTime, endTime, room
- teacher, status, materials, notes

### Attendance Fields

- session, student, status
- arrivedAt, notes, markedBy, markedAt

---

## 🎯 Validation Rules

### Email

- Must be valid email format
- Case insensitive

### Password

- Minimum 6 characters
- Automatically hashed

### ObjectId

- Must be valid MongoDB ObjectId (24 hex characters)

### Date

- Format: YYYY-MM-DD

### Time

- Format: HH:MM (24-hour)

### File Upload

- Max size: 10MB (configurable)
- Allowed types: jpg, png, pdf, doc, docx

---

## 🔒 Security Headers

All requests should include:

```
Content-Type: application/json
Authorization: Bearer <token>
```

---

## 📱 HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

---

**For complete documentation, see README.md and QUICKSTART.md**
