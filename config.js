// โหลดและตรวจค่าตั้งค่าจาก .env (ไม่กำหนดค่า default ในโค้ด)
require('dotenv').config();

// ค่าที่ต้องมีใน .env ถ้าขาดตัวไหน server จะหยุดพร้อมบอกชื่อตัวแปร
const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'UPLOAD_MAX_MB'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing required env: ${missing.join(', ')} (ตรวจไฟล์ .env)`);
}

const env = process.env;

// ประกอบ connection string; ถ้ามี user/password ให้ใส่ credentials (encode อักขระพิเศษ)
const auth = env.DB_USER
  ? `${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD || '')}@`
  : '';

module.exports = {
  dbUri: `mongodb://${auth}${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}${env.DB_USER ? '?authSource=admin' : ''}`,
  dbLabel: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`, // ใช้ log (ไม่มีรหัสผ่าน)
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  uploadMaxBytes: Number(env.UPLOAD_MAX_MB) * 1024 * 1024, // ขนาดไฟล์สูงสุด (byte)
};
