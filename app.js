// จุดเริ่มต้นของแอป: ตั้งค่า middleware, ผูก routes และจัดการ error
require('./config'); // โหลด .env + ตรวจค่าที่จำเป็น (ต้องอยู่บนสุด)
require('./db'); // เชื่อมต่อ MongoDB

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const r = require('./utils/response');

const app = express();

app.use(cors()); // อนุญาตให้ frontend คนละโดเมนเรียก API
app.use(logger('dev')); // log request ใน terminal
app.use(express.json()); // อ่าน body แบบ JSON
app.use(express.urlencoded({ extended: false })); // อ่าน body แบบ form
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // เปิดดูรูปที่อัปโหลด เช่น /uploads/products/xxx.png

// เอกสาร API แบบ Swagger UI เปิดดู/ทดลองยิง API ได้ที่ /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('./swagger'), {
  swaggerOptions: { persistAuthorization: true }, // จำ token ไว้แม้รีเฟรชหน้า
}));

// Routes ทั้งหมดอยู่ภายใต้ /api/v1
app.use('/api/v1', require('./routes/auth')); // register, login
app.use('/api/v1/users', require('./routes/users')); // approve
app.use('/api/v1/products', require('./routes/products')); // products + orders ของ product
app.use('/api/v1/orders', require('./routes/orders')); // orders ทั้งหมด

// ไม่เจอ route → ส่งต่อให้ error handler เป็น 404
app.use((req, res, next) => next(createError(404, 'route not found')));

// error handler กลาง: ตอบเป็น JSON รูปแบบเดียวกับ API
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return r.badRequest(res, 'invalid JSON body');
  if (err.name === 'ValidationError') return r.badRequest(res, err.message); // ข้อมูลไม่ผ่าน schema
  if (err.name === 'CastError') return r.badRequest(res, `invalid value for "${err.path}"`); // ชนิดข้อมูลผิด เช่น stock = "abc"
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ status: err.status, message: err.message, data: null });
  }

  console.error(err); // ไม่ทราบสาเหตุ: log ไว้ฝั่ง server ไม่ส่งรายละเอียดให้ client
  r.serverError(res);
});

module.exports = app;
