const XLSX = require('xlsx');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

// Template column headers (Vietnamese)
const TEMPLATE_HEADERS = [
   'Email (*)',
   'Họ (*)',
   'Tên (*)',
   'Số điện thoại',
   'Ngày sinh (DD/MM/YYYY)',
   'Địa chỉ'
];

// Map header index to User model field
const FIELD_MAP = ['email', 'lastName', 'firstName', 'phone', 'dateOfBirth', 'address'];

/**
 * Generate a template Excel file as Buffer
 */
const generateTemplate = () => {
   const wb = XLSX.utils.book_new();

   const sampleRow = [
      'nguyenvana@gmail.com',
      'Nguyễn Văn',
      'A',
      '0901234567',
      '15/06/2000',
      '123 Lê Lợi, Q.1, TP.HCM'
   ];

   const data = [TEMPLATE_HEADERS, sampleRow];
   const ws = XLSX.utils.aoa_to_sheet(data);

   // Set column widths for better readability
   ws['!cols'] = [
      { wch: 30 }, // Email
      { wch: 20 }, // Họ
      { wch: 15 }, // Tên
      { wch: 15 }, // Phone
      { wch: 20 }, // DOB
      { wch: 35 }, // Address
   ];

   XLSX.utils.book_append_sheet(wb, ws, 'Students');
   return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Parse Excel buffer and validate each row
 * @returns {{ rows: Array, summary: { total, valid, invalid } }}
 */
const parseAndValidate = async (fileBuffer) => {
   let wb;
   try {
      wb = XLSX.read(fileBuffer, { type: 'buffer' });
   } catch {
      throw ApiError.badRequest('Không thể đọc file Excel. Vui lòng kiểm tra định dạng .xlsx');
   }

   const ws = wb.Sheets[wb.SheetNames[0]];
   if (!ws) {
      throw ApiError.badRequest('File Excel không có sheet nào');
   }

   // Convert sheet to array of arrays (skip header row)
   const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

   if (rawData.length <= 1) {
      throw ApiError.badRequest('File Excel không có dữ liệu (chỉ có header)');
   }

   // Max 200 rows (excluding header)
   const dataRows = rawData.slice(1).filter(row => row.some(cell => cell !== ''));
   if (dataRows.length === 0) {
      throw ApiError.badRequest('File Excel không có dữ liệu');
   }
   if (dataRows.length > 200) {
      throw ApiError.badRequest(`Tối đa 200 dòng mỗi lần import. File hiện có ${dataRows.length} dòng.`);
   }

   // Extract all emails for batch duplicate check
   const emailsInFile = [];
   const rows = dataRows.map((row, index) => {
      const parsed = {};
      FIELD_MAP.forEach((field, i) => {
         let val = row[i] !== undefined ? String(row[i]).trim() : '';
         parsed[field] = val;
      });
      parsed._rowIndex = index + 2; // 1-indexed, +1 for header

      // Normalize email
      parsed.email = parsed.email.toLowerCase();
      if (parsed.email) emailsInFile.push(parsed.email);

      return parsed;
   });

   // Batch check existing emails in DB
   const existingUsers = await User.find({
      email: { $in: emailsInFile }
   }).select('email').lean();
   const existingEmails = new Set(existingUsers.map(u => u.email));

   // Track duplicates within the file
   const seenEmails = new Set();

   // Validate each row
   const validatedRows = rows.map(row => {
      const errors = [];

      // Required: email
      if (!row.email) {
         errors.push('Thiếu Email');
      } else if (!/^\S+@\S+\.\S+$/.test(row.email)) {
         errors.push('Email không hợp lệ');
      } else if (existingEmails.has(row.email)) {
         errors.push('Email đã tồn tại trong hệ thống');
      } else if (seenEmails.has(row.email)) {
         errors.push('Email trùng trong file');
      }

      // Required: lastName (Họ)
      if (!row.lastName) {
         errors.push('Thiếu Họ');
      }

      // Required: firstName (Tên)
      if (!row.firstName) {
         errors.push('Thiếu Tên');
      }

      // Optional: dateOfBirth — validate format if provided
      if (row.dateOfBirth) {
         const dob = parseDateDDMMYYYY(row.dateOfBirth);
         if (!dob) {
            errors.push('Ngày sinh không hợp lệ (DD/MM/YYYY)');
         } else {
            row.dateOfBirth = dob; // Store as Date object
         }
      } else {
         row.dateOfBirth = null;
      }

      if (row.email) seenEmails.add(row.email);

      return {
         rowIndex: row._rowIndex,
         email: row.email,
         lastName: row.lastName,
         firstName: row.firstName,
         phone: row.phone || '',
         dateOfBirth: row.dateOfBirth,
         address: row.address || '',
         status: errors.length === 0 ? 'ready' : 'error',
         errors
      };
   });

   const valid = validatedRows.filter(r => r.status === 'ready').length;
   const invalid = validatedRows.filter(r => r.status === 'error').length;

   return {
      rows: validatedRows,
      summary: { total: validatedRows.length, valid, invalid }
   };
};

/**
 * Execute import: create student accounts for valid rows
 * @param {Array} rows - validated rows (only "ready" ones should be passed)
 * @param {string} defaultPassword - admin-defined default password (or null for email prefix + 123)
 */
const executeImport = async (rows, defaultPassword) => {
   const created = [];
   const failed = [];

   for (const row of rows) {
      try {
         // Determine password
         const password = defaultPassword || (row.email.split('@')[0] + '123');

         const userData = {
            email: row.email,
            password,
            firstName: row.firstName,
            lastName: row.lastName,
            role: 'student',
            isActive: true
         };

         if (row.phone) userData.phone = row.phone;
         if (row.dateOfBirth) userData.dateOfBirth = row.dateOfBirth;
         if (row.address) userData.address = row.address;

         const user = await User.create(userData);
         created.push({
            email: user.email,
            name: `${user.lastName} ${user.firstName}`
         });
      } catch (error) {
         failed.push({
            email: row.email,
            reason: error.code === 11000
               ? 'Email đã tồn tại'
               : (error.message || 'Lỗi không xác định')
         });
      }
   }

   return {
      created,
      failed,
      summary: {
         total: rows.length,
         success: created.length,
         failed: failed.length
      }
   };
};

/**
 * Parse date string in DD/MM/YYYY format
 */
function parseDateDDMMYYYY(str) {
   // Handle both DD/MM/YYYY and DD-MM-YYYY
   const parts = String(str).split(/[\/\-\.]/);
   if (parts.length !== 3) return null;

   const day = parseInt(parts[0], 10);
   const month = parseInt(parts[1], 10);
   const year = parseInt(parts[2], 10);

   if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
   if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;

   const date = new Date(year, month - 1, day);
   // Verify the date is valid (e.g., Feb 30 would roll over)
   if (date.getDate() !== day || date.getMonth() !== month - 1) return null;

   return date;
}

module.exports = {
   generateTemplate,
   parseAndValidate,
   executeImport
};
