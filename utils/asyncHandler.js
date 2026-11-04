// ครอบ handler แบบ async เพื่อส่ง error ไปที่ error handler กลางใน app.js (ไม่ต้องเขียน try/catch ซ้ำ)
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
