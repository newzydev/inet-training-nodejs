// สร้างผู้ดูแลระบบคนแรก (admin ที่ approved แล้ว) จากค่าใน .env — รัน: npm run seed
require('../config'); // โหลด .env
const bcrypt = require('bcrypt');
const mongoose = require('../db');
const User = require('../models/user.model');

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

(async () => {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('ตั้ง ADMIN_EMAIL และ ADMIN_PASSWORD ใน .env ก่อน');

    const exists = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (exists) {
      console.log('Admin already exists:', exists.email);
    } else {
      await User.create({
        name: ADMIN_NAME || 'Admin',
        email: ADMIN_EMAIL,
        password: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role: 'admin',
        approved: true,
      });
      console.log('Admin created:', ADMIN_EMAIL);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
