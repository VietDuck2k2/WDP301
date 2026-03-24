import axiosInstance from './axios';

/**
 * File API — upload, delete, get info.
 * Context: POST /files/upload with multipart/form-data, field name "file".
 * Response: backend returns { name, filename, fileUrl, downloadUrl, ... }; we expose url = fileUrl for attachment shape { name, url }.
 */

/**
 * Upload single file (multipart/form-data, field name: file).
 * @param {File} file
 * @returns {Promise<{ name, filename, fileUrl, url, ... }>} — use .url or .fileUrl for attachment
 */
export const uploadFile = async (file) => {
   const formData = new FormData();
   formData.append('file', file);
   const res = await axiosInstance.post('/files/upload', formData);
   if (!res.success || !res.data) throw new Error(res.message || 'Upload failed');
   const data = res.data;
   return { ...data, url: data.fileUrl };
};

/**
 * Upload multiple files (field name: files).
 * @param {File[]} files
 * @returns {Promise<Array<{ name, filename, fileUrl, url, ... }>>}
 */
export const uploadMultipleFiles = async (files) => {
   if (!files?.length) return [];
   const formData = new FormData();
   files.forEach((f) => formData.append('files', f));
   const res = await axiosInstance.post('/files/upload-multiple', formData);
   if (!res.success || !res.data) throw new Error(res.message || 'Upload failed');
   return (res.data || []).map((d) => ({ ...d, url: d.fileUrl }));
};

/**
 * Delete file by filename (as stored on server).
 * @param {string} filename
 */
export const deleteFile = async (filename) => {
   const res = await axiosInstance.delete(`/files/${encodeURIComponent(filename)}`);
   if (!res.success) throw new Error(res.message || 'Delete failed');
   return res;
};

/**
 * Get file info by filename.
 * @param {string} filename
 */
export const getFileInfo = async (filename) => {
   const res = await axiosInstance.get(`/files/${encodeURIComponent(filename)}/info`);
   if (!res.success) throw new Error(res.message || 'Get info failed');
   return res.data;
};

/**
 * Build attachment object for assignment/submission APIs: { name, url }.
 * @param {{ name: string, fileUrl?: string, url?: string }} data — from upload response
 */
export const toAttachment = (data) => ({
   name: data.name || data.filename,
   url: data.url || data.fileUrl,
});

export const fileApi = {
   uploadFile,
   uploadMultipleFiles,
   deleteFile,
   getFileInfo,
   toAttachment,
};
