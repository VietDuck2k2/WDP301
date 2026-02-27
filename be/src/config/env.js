require('dotenv').config();

const config = {
   // Server
   nodeEnv: process.env.NODE_ENV || 'development',
   port: process.env.PORT || 5000,

   // Database
   mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ecms',

   // JWT
   jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
   jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

   // File Upload
   uploadDir: process.env.UPLOAD_DIR || 'uploads',
   maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
   allowedFileTypes: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',

   // Client URL (for CORS)
   clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports = config;
