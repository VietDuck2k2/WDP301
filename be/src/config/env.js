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
   allowedFileTypes: process.env.ALLOWED_FILE_TYPES || [
      // Images
      'image/jpeg', 'image/png', 'image/jpg',
      // PDF
      'application/pdf',
      // Word
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Excel / CSV
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'application/csv', 'application/x-msexcel',
      // Text
      'text/plain',
      // Audio
      'audio/mpeg', 'audio/mp3',
      'audio/mp4', 'audio/x-m4a', 'audio/m4a',
   ].join(','),

   // Client URL (for CORS)
   clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports = config;
