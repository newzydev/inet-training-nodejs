// สินค้า (Product) และ Order ภายใต้สินค้า — ต้อง login และได้รับ Approve
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { auth } = require('../middleware/auth');
const r = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(auth); // ทุก route ในไฟล์นี้ต้องผ่าน auth

// :id ต้องเป็น ObjectId ที่ถูกต้อง ไม่งั้นตอบ 400 ทันที
router.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : r.badRequest(res, 'invalid id')
);

// เลือกเฉพาะ field ที่อนุญาตให้สร้าง/แก้ (กันส่ง field แปลกปลอมเข้ามา)
const pickProduct = (b) => {
  const data = {};
  ['name', 'description', 'price', 'stock'].forEach((k) => { if (b[k] !== undefined) data[k] = b[k]; });
  return data;
};

/* [GET] /api/v1/products — แสดงรายการ Product ทั้งหมด */
router.get('/', asyncHandler(async (req, res) => {
  r.ok(res, await Product.find().sort({ createdAt: -1 })); // ไม่มีข้อมูล = [] (200)
}));

/* [POST] /api/v1/products — เพิ่มรายการ Product */
router.post('/', asyncHandler(async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) return r.badRequest(res, 'name and price are required');

  r.created(res, await Product.create(pickProduct(req.body)));
}));

/* [GET] /api/v1/products/:id — ดู Product 1 รายการ */
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return r.badRequest(res, 'product not found'); // data: null + 400
  r.ok(res, product);
}));

/* [PUT] /api/v1/products/:id — แก้ไขรายการ Product */
router.put('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pickProduct(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!product) return r.badRequest(res, 'product not found');
  r.ok(res, product, 'updated');
}));

/* [DELETE] /api/v1/products/:id — ลบรายการ Product */
router.delete('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return r.badRequest(res, 'product not found');
  r.ok(res, product, 'deleted');
}));

/* [GET] /api/v1/products/:id/orders — แสดง Order ทั้งหมดของ Product */
router.get('/:id/orders', asyncHandler(async (req, res) => {
  if (!(await Product.exists({ _id: req.params.id }))) return r.badRequest(res, 'product not found');

  const orders = await Order.find({ product: req.params.id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  r.ok(res, orders);
}));

/* [POST] /api/v1/products/:id/orders — เพิ่ม Order ใน Product (ต้องไม่เกิน Stock) */
router.post('/:id/orders', asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) return r.badRequest(res, 'quantity must be an integer >= 1');

  // ตัด stock แบบ atomic: สำเร็จเฉพาะเมื่อ stock พอ (กันสั่งพร้อมกันจน stock ติดลบ)
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { returnDocument: 'after' }
  );

  if (!product) {
    // แยกสาเหตุ: ไม่มีสินค้า หรือ stock ไม่พอ
    const exists = await Product.exists({ _id: req.params.id });
    return r.badRequest(res, exists ? 'cannot add order: quantity exceeds stock' : 'product not found');
  }

  try {
    const order = await Order.create({
      product: product._id,
      user: req.user._id,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
    });
    r.created(res, order);
  } catch (err) {
    // บันทึก Order ไม่สำเร็จ → คืน stock ที่ตัดไปแล้ว
    await Product.updateOne({ _id: product._id }, { $inc: { stock: quantity } });
    throw err;
  }
}));

module.exports = router;
