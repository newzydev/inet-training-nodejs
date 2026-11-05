// Schema ของผู้ใช้ (collection "users")
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // hash bcrypt, ไม่ดึงออกมาโดย default
    avatar: { type: String }, // path ภาพโปรไฟล์ เช่น /uploads/avatars/xxxx.png
    role: { type: String, enum: ['admin', 'user'], default: 'user' }, // admin = อนุมัติผู้ใช้ได้
    approved: { type: Boolean, default: false }, // false = รอ Approve ยัง login ไม่ได้
  },
  { timestamps: true } // createdAt / updatedAt อัตโนมัติ
);

module.exports = mongoose.model('User', userSchema);
