// Middleware ตรวจสิทธิ์: ต้องมี JWT ที่ถูกต้อง และผู้ใช้ต้องได้รับ Approve แล้ว
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { jwtSecret } = require('../config');
const r = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// ตรวจ token จาก header "Authorization: Bearer <token>"
const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return r.unauthorized(res, 'token required');

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (err) {
    return r.unauthorized(res, 'invalid or expired token');
  }

  // โหลดผู้ใช้ล่าสุดจาก DB เผื่อถูกลบหรือถูกเพิกถอนสิทธิ์หลังออก token
  const user = await User.findById(payload.id);
  if (!user || !user.approved) return r.unauthorized(res, 'user not found or not approved');

  req.user = user; // เก็บไว้ให้ route ถัดไปใช้
  next();
});

// อนุญาตเฉพาะ admin (ใช้ต่อท้าย auth)
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : r.unauthorized(res, 'admin only');

module.exports = { auth, adminOnly };
