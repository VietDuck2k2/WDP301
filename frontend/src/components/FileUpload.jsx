import React, { useState } from 'react';
import { fileApi } from '../api/fileApi';

/**
 * Reusable file upload for attachments (name, url).
 * Use in assignment/create, submission form, etc.
 * @param {Object} props
import React, { useState } from 'react';
import { fileApi } from '../api/fileApi';

/**
 * Reusable file upload for attachments (name, url).
 * Use in assignment/create, submission form, etc.
 * @param {Object} props
 * @param {{ name: string, url: string }[]} props.value — current attachments
 * @param {function({ name: string, url: string }[]): void} props.onChange — called when list changes
 * @param {boolean} [props.multiple=true] — allow multiple files
 * @param {string} [props.accept] — e.g. "image/*,.pdf,.doc,.docx,.xls,.xlsx"
 * @param {string} [props.label]
 */
export default function FileUpload({ value = [], onChange, multiple = true, accept = ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.mp3,.m4a", label = 'Tệp đính kèm' }) {
   const [uploading, setUploading] = useState(false);
   const [error, setError] = useState('');

   const handleFileSelect = async (e) => {
      const files = e.target.files;
      if (!files?.length) return;
      setError('');
      setUploading(true);
      try {
         const list = multiple ? await fileApi.uploadMultipleFiles(Array.from(files)) : [await fileApi.uploadFile(files[0])];
         const newAttachments = list.map((d) => ({ name: d.name, url: d.url || d.fileUrl }));
         onChange([...value, ...newAttachments]);
      } catch (err) {
         setError(err.response?.data?.message || err.message || 'Tải lên thất bại.');
      } finally {
         setUploading(false);
         e.target.value = '';
      }
   };

   const remove = (index) => {
      const next = value.filter((_, i) => i !== index);
      onChange(next);
   };

   const getFileIcon = (name) => {
      const ext = name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
      if (ext === 'pdf') return '📄';
      if (['doc', 'docx', 'txt'].includes(ext)) return '📝';
      if (['xls', 'xlsx'].includes(ext)) return '📊';
      if (['ppt', 'pptx'].includes(ext)) return '📽️';
      if (['mp3', 'm4a'].includes(ext)) return '🎵';
      return '📎';
   };

   return (
      <div className="space-y-2">
         <label className="block text-sm font-medium text-gray-700">{label}</label>
         <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
               <input
                  type="file"
                  className="sr-only"
                  multiple={multiple}
                  accept={accept}
                  disabled={uploading}
                  onChange={handleFileSelect}
               />
               {uploading ? 'Đang tải lên...' : 'Chọn file'}
            </label>
            <span className="text-xs text-gray-400">Hỗ trợ: {accept.split(',').join(', ')}</span>
         </div>
         {error && <p className="text-sm text-red-600">{error}</p>}
         {value.length > 0 && (
            <ul className="list-none space-y-1 text-sm">
               {value.map((att, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded bg-gray-50 px-2 py-1">
                     <div className="flex items-center gap-2 truncate">
                        <span>{getFileIcon(att.name)}</span>
                        <a
                           href={att.url.startsWith('http') ? att.url : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${att.url}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="truncate text-blue-600 hover:underline"
                        >
                           {att.name}
                        </a>
                     </div>
                     <button
                        type="button"
                        onClick={() => remove(i)}
                        className="shrink-0 text-red-600 hover:text-red-800"
                        aria-label="Xóa"
                     >
                        ×
                     </button>
                  </li>
               ))}
            </ul>
         )}
      </div>
   );
}
