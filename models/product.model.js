// Schema ของสินค้า (collection "products")
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 }, // จำนวนคงเหลือ
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
