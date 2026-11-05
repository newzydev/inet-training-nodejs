// เอกสาร API (OpenAPI 3.0) สำหรับ Swagger UI — เปิดดูที่ /api-docs

// ---------- ส่วนที่ใช้ซ้ำ ----------

// Response ที่ทุก API ตอบกลับ: { status, message, data }
const envelope = (dataSchema, example) => ({
  type: 'object',
  properties: {
    status: { type: 'integer', example: 200 },
    message: { type: 'string', example: 'success' },
    data: dataSchema,
  },
  ...(example && { example }),
});

// ตัวช่วยสร้าง response แต่ละ status
const res = (description, dataSchema = { nullable: true }, example) => ({
  description,
  content: { 'application/json': { schema: envelope(dataSchema, example) } },
});

const R400 = res('ไม่สำเร็จ (ข้อมูลไม่ครบ / ไม่พบรายการ / เกิน Stock)', { nullable: true }, {
  status: 400, message: 'product not found', data: null,
});
const R401 = res('ไม่มีสิทธิ์ (ไม่มี/หมดอายุ token, ยังไม่ Approve, ไม่ใช่ admin)', { nullable: true }, {
  status: 401, message: 'token required', data: null,
});

const secured = [{ bearerAuth: [] }]; // API ที่ต้องมี token
const idParam = (desc) => [{ name: 'id', in: 'path', required: true, description: desc, schema: { type: 'string', example: '6aeaf8d3786b0d25f7cff928' } }];

const json = (schema) => ({ required: true, content: { 'application/json': { schema } } });

// ---------- Schemas ----------
const schemas = {
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6aeaf8d3786b0d25f7cff927' },
      name: { type: 'string', example: 'Somchai' },
      email: { type: 'string', example: 'somchai@example.com' },
      role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
      approved: { type: 'boolean', example: false },
    },
  },
  Product: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '6aeaf8d3786b0d25f7cff928' },
      name: { type: 'string', example: 'Pen' },
      description: { type: 'string', example: 'Blue pen' },
      price: { type: 'number', example: 10 },
      stock: { type: 'integer', example: 100 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Order: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      product: { description: 'id สินค้า (หรือข้อมูลสินค้าเมื่อดูทั้งระบบ)', oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Product' }] },
      user: { description: 'ผู้สั่ง', oneOf: [{ type: 'string' }, { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } }] },
      quantity: { type: 'integer', example: 3 },
      unitPrice: { type: 'number', example: 10 },
      totalPrice: { type: 'number', example: 30 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
};

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const list = (name) => ({ type: 'array', items: ref(name) });

// ---------- Spec หลัก ----------
module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'INET Training Node.js API',
    version: '1.0.0',
    description:
      'API จัดการสินค้าและ Order\n\n' +
      '**วิธีใช้:** 1) สมัครสมาชิก `POST /register` → 2) admin อนุมัติ `PUT /users/{id}/approve` → ' +
      '3) `POST /login` เพื่อรับ token → 4) กดปุ่ม **Authorize** ด้านบน แล้ววาง token (ไม่ต้องพิมพ์ Bearer)',
  },
  servers: [{ url: '/api/v1', description: 'Local' }],
  tags: [
    { name: 'Auth', description: 'สมัครสมาชิก / เข้าสู่ระบบ' },
    { name: 'Users', description: 'อนุมัติผู้ใช้ (admin)' },
    { name: 'Products', description: 'จัดการสินค้า' },
    { name: 'Orders', description: 'สั่งซื้อ (ต้องไม่เกิน Stock)' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas,
  },
  paths: {
    '/register': {
      post: {
        tags: ['Auth'],
        summary: 'สมัครสมาชิก (รอ Approve)',
        requestBody: json({
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Somchai' },
            email: { type: 'string', example: 'somchai@example.com' },
            password: { type: 'string', example: '1234' },
          },
        }),
        responses: { 201: res('สร้างสำเร็จ', ref('User')), 400: R400 },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'เข้าสู่ระบบ รับ token',
        requestBody: json({
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'admin@example.com' },
            password: { type: 'string', example: '' },
          },
        }),
        responses: {
          200: res('สำเร็จ', { type: 'object', properties: { token: { type: 'string' }, user: ref('User') } }),
          400: R400,
          401: R401,
        },
      },
    },
    '/users/{id}/approve': {
      put: {
        tags: ['Users'],
        summary: 'อนุมัติผู้ใช้ (เฉพาะ admin)',
        security: secured,
        parameters: idParam('id ของผู้ใช้'),
        responses: { 200: res('อนุมัติแล้ว', ref('User')), 400: R400, 401: R401 },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'แสดงรายการ Product ทั้งหมด',
        security: secured,
        responses: { 200: res('สำเร็จ (ไม่มีข้อมูล = [])', list('Product')), 401: R401 },
      },
      post: {
        tags: ['Products'],
        summary: 'เพิ่มรายการ Product',
        security: secured,
        requestBody: json({
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: { type: 'string', example: 'Pen' },
            description: { type: 'string', example: 'Blue pen' },
            price: { type: 'number', example: 10 },
            stock: { type: 'integer', example: 100 },
          },
        }),
        responses: { 201: res('สร้างสำเร็จ', ref('Product')), 400: R400, 401: R401 },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'ดู Product 1 รายการ',
        security: secured,
        parameters: idParam('id ของสินค้า'),
        responses: { 200: res('สำเร็จ', ref('Product')), 400: R400, 401: R401 },
      },
      put: {
        tags: ['Products'],
        summary: 'แก้ไขรายการ Product (ส่งเฉพาะ field ที่ต้องการแก้)',
        security: secured,
        parameters: idParam('id ของสินค้า'),
        requestBody: json({
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', example: 12 },
            stock: { type: 'integer', example: 80 },
          },
        }),
        responses: { 200: res('แก้ไขสำเร็จ', ref('Product')), 400: R400, 401: R401 },
      },
      delete: {
        tags: ['Products'],
        summary: 'ลบรายการ Product',
        security: secured,
        parameters: idParam('id ของสินค้า'),
        responses: { 200: res('ลบสำเร็จ', ref('Product')), 400: R400, 401: R401 },
      },
    },
    '/products/{id}/orders': {
      get: {
        tags: ['Orders'],
        summary: 'แสดง Order ทั้งหมดของ Product',
        security: secured,
        parameters: idParam('id ของสินค้า'),
        responses: { 200: res('สำเร็จ (ไม่มีข้อมูล = [])', list('Order')), 400: R400, 401: R401 },
      },
      post: {
        tags: ['Orders'],
        summary: 'เพิ่ม Order ใน Product (ต้องไม่เกิน Stock)',
        security: secured,
        parameters: idParam('id ของสินค้า'),
        requestBody: json({
          type: 'object',
          required: ['quantity'],
          properties: { quantity: { type: 'integer', minimum: 1, example: 3 } },
        }),
        responses: { 201: res('บันทึก Order สำเร็จ (Stock ลดลง)', ref('Order')), 400: R400, 401: R401 },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'แสดง Order ทุกรายการ',
        security: secured,
        responses: { 200: res('สำเร็จ (ไม่มีข้อมูล = [])', list('Order')), 401: R401 },
      },
    },
  },
};
