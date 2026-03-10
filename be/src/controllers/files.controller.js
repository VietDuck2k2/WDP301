const fileService = require('../services/file.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   POST /api/files/upload
 * @desc    Upload single file
 * @access  Private
 */
const uploadFile = async (req, res, next) => {
   try {
      const fileData = fileService.saveFile(req.file);
      ApiResponse.created(res, fileData, 'File uploaded successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/files/upload-multiple
 * @desc    Upload multiple files
 * @access  Private
 */
const uploadMultipleFiles = async (req, res, next) => {
   try {
      const filesData = fileService.saveFiles(req.files);
      ApiResponse.created(res, filesData, 'Files uploaded successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/files/:filename
 * @desc    Delete file
 * @access  Private
 */
const deleteFile = async (req, res, next) => {
   try {
      const result = fileService.deleteFile(req.params.filename);
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/files/:filename/info
 * @desc    Get file info
 * @access  Private
 */
const getFileInfo = async (req, res, next) => {
   try {
      const fileInfo = fileService.getFileInfo(req.params.filename);
      ApiResponse.ok(res, fileInfo);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   uploadFile,
   uploadMultipleFiles,
   deleteFile,
   getFileInfo
};
