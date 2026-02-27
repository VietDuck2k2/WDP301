# ECMS Backend

English Center Management System - Backend API

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT Bearer Token
- **File Upload**: Multer (local storage)
- **Architecture**: MVC (Models, Views/Routes, Controllers) + Services

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin, Teacher, Student)
- 📚 Class management
- 📅 Session scheduling
- ✅ Attendance tracking
- 📝 Assignment management
- 📤 Submission tracking
- 📢 Announcements
- 📁 File upload/download
- 🔍 Search and filtering
- 📄 Pagination support

## Project Structure

```
src/
├── app.js                    # Express app configuration
├── server.js                 # Server entry point
├── config/
│   ├── db.js                # MongoDB connection
│   └── env.js               # Environment variables
├── models/                  # Mongoose schemas
├── services/                # Business logic layer
├── controllers/             # Request handlers
├── routes/                  # API routes
├── middlewares/             # Custom middlewares
└── utils/                   # Helper functions
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration

3. **Start MongoDB**
   Make sure MongoDB is running locally or update `MONGO_URI` in `.env`

4. **Run the server**

   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

#### Profile

- `GET /api/me` - Get current user profile
- `PUT /api/me` - Update profile
- `POST /api/me/change-password` - Change password

#### Files

- `POST /api/files/upload` - Upload single file
- `POST /api/files/upload-multiple` - Upload multiple files
- `DELETE /api/files/:filename` - Delete file

#### Admin Routes

- `/api/admin/users` - User management
- `/api/admin/classes` - Class management
- `/api/admin/schedule-templates` - Schedule templates
- `/api/admin/sessions` - Session management

#### Teacher Routes

- `/api/teacher/classes` - View assigned classes
- `/api/teacher/sessions` - Manage sessions
- `/api/teacher/attendances` - Mark attendance
- `/api/teacher/assignments` - Create/manage assignments
- `/api/teacher/announcements` - Post announcements

#### Student Routes

- `/api/student/classes` - View enrolled classes
- `/api/student/assignments` - View assignments
- `/api/student/submissions` - Submit assignments
- `/api/student/announcements` - View announcements

## Default Roles

- **admin**: Full system access
- **teacher**: Manage classes, sessions, assignments, attendance
- **student**: View classes, submit assignments, view grades

## Environment Variables

See `.env.example` for all configuration options.

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "details": {} // Optional
}
```

## Success Response

Standard success response:

```json
{
  "success": true,
  "message": "Success message",
  "data": {} // Response data
}
```

## Development Tips

1. Use Postman or similar tool to test API endpoints
2. Check MongoDB connection in console on startup
3. Review error logs in development mode for detailed stack traces
4. File uploads are stored in `/uploads` directory
5. Access uploaded files via `/uploads/:filename` URL

## Sprint-Ready Structure

This skeleton is designed for incremental feature development:

- ✅ Core authentication ready
- ✅ RBAC middleware implemented
- ✅ File upload configured
- ✅ Error handling centralized
- ✅ Models with proper validations
- ✅ Services layer for business logic
- ✅ Clean separation of concerns

Add new features by:

1. Creating/updating models
2. Adding service methods
3. Creating controller functions
4. Defining routes
5. Adding validation rules

## License

ISC
