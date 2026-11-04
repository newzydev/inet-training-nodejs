// Schema ของ Order (collection "orders") — 1 Product มีได้หลาย Order
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ผู้สั่ง
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger }, // จำนวนเต็ม >= 1
    unitPrice: { type: Number, required: true }, // ราคาต่อชิ้น ณ เวลาที่สั่ง
    totalPrice: { type: Number, required: true }, // unitPrice * quantity
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
