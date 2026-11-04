// Order ทั้งหมดในระบบ — ต้อง login และได้รับ Approve
const express = require('express');
const Order = require('../models/order.model');
const { auth } = require('../middleware/auth');
const r = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/* [GET] /api/v1/orders — แสดง Order ทุกรายการ */
router.get('/', auth, asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('product', 'name price') // แนบชื่อ/ราคาสินค้า
    .populate('user', 'name email') // แนบชื่อ/อีเมลผู้สั่ง
    .sort({ createdAt: -1 });
  r.ok(res, orders);
}));

module.exports = router;
