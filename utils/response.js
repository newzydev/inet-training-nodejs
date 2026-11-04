// รูปแบบ response มาตรฐานตาม diagram: { status, message, data }

// ส่ง response ออกไป (HTTP status = status ใน body)
const send = (res, status, message, data) => res.status(status).json({ status, message, data });

module.exports = {
  ok: (res, data, message = 'success') => send(res, 200, message, data), // 200 สำเร็จ
  created: (res, data, message = 'created') => send(res, 201, message, data), // 201 สร้างสำเร็จ
  badRequest: (res, message = 'bad request', data = null) => send(res, 400, message, data), // 400 ไม่สำเร็จ
  unauthorized: (res, message = 'unauthorized') => send(res, 401, message, null), // 401 ไม่มีสิทธิ์
  serverError: (res, message = 'internal server error') => send(res, 500, message, null), // 500 ไม่ทราบสาเหตุ
};
