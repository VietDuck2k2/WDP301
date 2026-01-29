const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Save uploaded file and return metadata
 */
const saveFile = (file) => {
  if (!file) {
    throw ApiError.badRequest('No file provided');
  }

  const fileUrl = `/uploads/${file.filename}`;
  const downloadUrl = `${config.clientUrl}${fileUrl}`;

  return {
    name: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    fileUrl,
    downloadUrl,
    uploadedAt: new Date()
  };
};

/**
 * Save multiple uploaded files
 */
const saveFiles = (files) => {
  if (!files || files.length === 0) {
    throw ApiError.badRequest('No files provided');
  }

  return files.map(file => saveFile(file));
};

/**
 * Delete file from server
 */
const deleteFile = (filename) => {
  const filePath = path.join(__dirname, '../../', config.uploadDir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return { message: 'File deleted successfully' };
  }

  throw ApiError.notFound('File not found');
};

/**
 * Get file info
 */
const getFileInfo = (filename) => {
  const filePath = path.join(__dirname, '../../', config.uploadDir, filename);
  
  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound('File not found');
  }

  const stats = fs.statSync(filePath);
  
  return {
    filename,
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    fileUrl: `/uploads/${filename}`
  };
};

module.exports = {
  saveFile,
  saveFiles,
  deleteFile,
  getFileInfo
};
