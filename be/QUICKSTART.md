# ECMS Backend - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
cd be
npm install
```

### 2. Setup Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings (or use defaults for local development)
```

### 3. Start MongoDB

Make sure MongoDB is running on `mongodb://localhost:27017`

### 4. Run the Server

```bash
npm run dev
```

The server will start on http://localhost:5000

### 5. Test the API

**Health Check:**

```bash
curl http://localhost:5000/health
```

**Register a User:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecms.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecms.com",
    "password": "admin123"
  }'
```

Copy the token from the response and use it for authenticated requests:

**Get Profile:**

```bash
curl http://localhost:5000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📁 Project Structure Overview

```
be/
├── src/
│   ├── app.js                    # Express configuration
│   ├── server.js                 # Server entry point
│   ├── config/                   # Configuration files
│   ├── models/                   # Mongoose models (9 models)
│   ├── services/                 # Business logic (10 services)
│   ├── controllers/              # Request handlers
│   │   ├── admin/               # Admin controllers
│   │   ├── teacher/             # Teacher controllers
│   │   └── student/             # Student controllers
│   ├── routes/                   # API routes
│   │   ├── admin/               # Admin routes
│   │   ├── teacher/             # Teacher routes
│   │   └── student/             # Student routes
│   ├── middlewares/              # Custom middlewares
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── rbac.middleware.js   # Role-based access
│   │   ├── upload.middleware.js # File upload
│   │   └── ...
│   └── utils/                    # Helper functions
├── uploads/                      # File upload directory
├── .env.example                  # Environment template
├── package.json
└── README.md
```

## 🔑 Key Features Implemented

### Authentication & Authorization

- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Teacher, Student)
- ✅ Password hashing with bcrypt
- ✅ Token expiration and validation

### Core Entities

- ✅ Users (with roles)
- ✅ Classes
- ✅ Class Members (enrollment)
- ✅ Schedule Templates
- ✅ Sessions
- ✅ Attendance
- ✅ Assignments
- ✅ Submissions
- ✅ Announcements

### File Management

- ✅ File upload (single/multiple)
- ✅ File validation (type, size)
- ✅ Static file serving
- ✅ File metadata tracking

### API Features

- ✅ Pagination
- ✅ Search & filtering
- ✅ Sorting
- ✅ Error handling
- ✅ Validation middleware
- ✅ CORS enabled

## 🎯 Role-Based API Routes

### Admin Routes (`/api/admin/...`)

- Full CRUD on users, classes, schedule templates, sessions
- Assign teachers to classes
- Enroll students in classes

### Teacher Routes (`/api/teacher/...`)

- View assigned classes
- Manage sessions and materials
- Mark attendance
- Create and grade assignments
- Post announcements

### Student Routes (`/api/student/...`)

- View enrolled classes
- View assignments
- Submit assignments
- View announcements
- View grades

## 🔧 Development Workflow

### Adding a New Feature

1. **Update/Create Model** (if needed)

   ```javascript
   // src/models/YourModel.js
   ```

2. **Create Service Methods**

   ```javascript
   // src/services/your.service.js
   ```

3. **Create Controller Functions**

   ```javascript
   // src/controllers/your.controller.js
   ```

4. **Define Routes**

   ```javascript
   // src/routes/your.routes.js
   ```

5. **Register Route in index.js**
   ```javascript
   // src/routes/index.js
   router.use("/your-endpoint", yourRoutes);
   ```

### Example: Adding a New Endpoint

```javascript
// 1. Service (src/services/example.service.js)
const getExample = async (id) => {
  // Business logic
  return result;
};

// 2. Controller (src/controllers/example.controller.js)
const getExample = async (req, res, next) => {
  try {
    const result = await exampleService.getExample(req.params.id);
    ApiResponse.ok(res, result);
  } catch (error) {
    next(error);
  }
};

// 3. Route (src/routes/example.routes.js)
router.get(
  "/:id",
  authenticate,
  validateObjectId("id"),
  exampleController.getExample,
);
```

## 📝 Common Tasks

### Create Admin User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecms.com",
    "password": "securepassword",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Create a Class (Admin)

```bash
curl -X POST http://localhost:5000/api/admin/classes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
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

### Upload a File

```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

## 🐛 Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Port Already in Use

- Change `PORT` in `.env`
- Or stop the process using port 5000

### JWT Token Invalid

- Check token format: `Bearer <token>`
- Token might be expired (default: 7 days)
- Generate a new token by logging in again

### File Upload Fails

- Check `uploads/` directory exists
- Verify file size limits in `.env`
- Check allowed file types

## 🔐 Security Notes

**For Development:**

- Default JWT secret is weak - change it in production
- CORS is open - restrict in production
- No rate limiting - add in production

**For Production:**

- Set strong `JWT_SECRET`
- Configure `CLIENT_URL` for CORS
- Add rate limiting middleware
- Enable HTTPS
- Use environment-specific configs
- Set `NODE_ENV=production`

## 📚 Next Steps

1. **Test all endpoints** with Postman/Insomnia
2. **Create seed data** for development
3. **Implement additional features** as needed
4. **Add API documentation** (Swagger/OpenAPI)
5. **Write unit tests**
6. **Add logging** (Winston/Morgan)
7. **Implement email notifications**
8. **Add real-time features** (Socket.io)

## 🤝 Need Help?

- Check the main README.md for detailed documentation
- Review model schemas in `src/models/`
- Examine service methods in `src/services/`
- Look at existing controllers for patterns

---

**Happy Coding! 🎉**
