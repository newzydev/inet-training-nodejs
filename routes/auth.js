// สมัครสมาชิกและเข้าสู่ระบบ (ไม่ต้องมี token)
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { jwtSecret, jwtExpiresIn } = require('../config');
const r = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { imageUpload, formFields } = require('../utils/upload');

const router = express.Router();

// ตัด password ออกก่อนส่งกลับ
const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, approved: u.approved });

/* [POST] /api/v1/register — สมัครสมาชิก (สถานะเริ่มต้น "รอ Approve")
   ส่งเป็น JSON หรือ form-data ก็ได้ (form-data แนบภาพโปรไฟล์ที่ field "avatar" ได้ ไม่บังคับ) */
router.post('/register', imageUpload('avatars', 'avatar'), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return r.badRequest(res, 'name, email, password are required');

  if (await User.findOne({ email })) return r.badRequest(res, 'email already exists'); // อีเมลซ้ำ

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    avatar: req.file && req.file.urlPath, // มีเฉพาะเมื่อแนบรูปมา
  });
  r.created(res, publicUser(user), 'registered, waiting for approval');
}));

/* [POST] /api/v1/login — เข้าสู่ระบบ ได้ token กลับไป */
router.post('/login', formFields, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return r.badRequest(res, 'email and password are required');

  // password ถูกซ่อนโดย default ต้องขอดึงด้วย select('+password')
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return r.unauthorized(res, 'invalid email or password'); // ไม่มีข้อมูลในระบบ / รหัสผิด
  }
  if (!user.approved) return r.unauthorized(res, 'waiting for approval'); // ยังไม่ได้ Approve

  const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
  r.ok(res, { token, user: publicUser(user) });
}));

module.exports = router;
