// อัปโหลดรูปภาพด้วย multer: รับเฉพาะรูป, จำกัดขนาด, ตั้งชื่อไฟล์ใหม่กันซ้ำ
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { uploadMaxBytes } = require('../config');
const r = require('./response');

// โฟลเดอร์เก็บไฟล์ทั้งหมด (เปิดให้ดูผ่าน URL /uploads/...)
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

// ชนิดรูปที่อนุญาต (mimetype → นามสกุลไฟล์ที่ใช้เก็บ)
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

// path ในฐานข้อมูล -> path จริงในเครื่อง (กันหลุดออกนอกโฟลเดอร์ uploads)
const toDiskPath = (urlPath) => {
  const full = path.join(UPLOAD_ROOT, String(urlPath).replace(/^\/uploads\//, ''));
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null;
};

// ลบไฟล์เก่า (เงียบไว้ถ้าไม่มีไฟล์)
const removeFile = (urlPath) => {
  const full = urlPath && toDiskPath(urlPath);
  if (full) fs.unlink(full, () => {});
};

// สร้าง middleware รับไฟล์ 1 ไฟล์จาก field ที่กำหนด เก็บใน uploads/<folder>
//   upload('avatars', 'avatar')  → req.file.urlPath = /uploads/avatars/xxxx.png
const imageUpload = (folder, field) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true }); // สร้างโฟลเดอร์ถ้ายังไม่มี

  const uploader = multer({
    storage: multer.diskStorage({
      destination: dir,
      // ชื่อสุ่ม + นามสกุลจากชนิดไฟล์จริง (ไม่ใช้ชื่อที่ผู้ใช้ส่งมา)
      filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + ALLOWED[file.mimetype]),
    }),
    limits: { fileSize: uploadMaxBytes, files: 1 },
    fileFilter: (req, file, cb) =>
      ALLOWED[file.mimetype] ? cb(null, true) : cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'invalid file type')),
  }).single(field);

  return (req, res, next) => {
    // ถ้าท้ายสุดตอบ error (>= 400) ให้ลบไฟล์ที่เพิ่งอัปโหลด ไม่ให้ค้างในเครื่อง
    res.on('finish', () => { if (req.file && res.statusCode >= 400) fs.unlink(req.file.path, () => {}); });

    uploader(req, res, (err) => {
      if (err) return r.badRequest(res, uploadMessage(err, field));
      if (req.file) req.file.urlPath = `/uploads/${folder}/${req.file.filename}`; // path ที่เก็บลง DB
      next();
    });
  };
};

// ให้ API ที่ไม่มีไฟล์ (เช่น login, เพิ่ม Order) อ่าน body แบบ form-data ได้ด้วย (JSON ยังใช้ได้เหมือนเดิม)
const formFields = (req, res, next) =>
  multer().none()(req, res, (err) =>
    err ? r.badRequest(res, 'this endpoint does not accept files') : next()
  );

// แปลง error ของ multer เป็นข้อความที่เข้าใจง่าย
const uploadMessage = (err, field) => {
  if (err.code === 'LIMIT_FILE_SIZE') return `file too large (max ${uploadMaxBytes / 1024 / 1024} MB)`;
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return err.field === 'invalid file type'
      ? 'only jpg, png, webp, gif images are allowed' // ชนิดไฟล์ไม่ถูกต้อง
      : `unexpected file field "${err.field}", use "${field}"`; // ชื่อ field ผิด
  }
  return err.message;
};

module.exports = { imageUpload, formFields, removeFile };
