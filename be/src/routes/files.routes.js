const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload, handleMulterError } = require('../middlewares/upload.middleware');

// All routes require authentication
router.use(authenticate);

// @route   POST /api/files/upload
router.post('/upload', upload.single('file'), handleMulterError, filesController.uploadFile);

// @route   POST /api/files/upload-multiple
router.post('/upload-multiple', upload.array('files', 10), handleMulterError, filesController.uploadMultipleFiles);

// @route   DELETE /api/files/:filename
router.delete('/:filename', filesController.deleteFile);

// @route   GET /api/files/:filename/info
router.get('/:filename/info', filesController.getFileInfo);

module.exports = router;
