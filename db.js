// เชื่อมต่อฐานข้อมูล MongoDB ด้วย Mongoose
const mongoose = require('mongoose');
const { dbUri, dbLabel } = require('./config');

mongoose
  .connect(dbUri)
  .then(() => console.log(`MongoDB connected: ${dbLabel}`))
  .catch((err) => console.error('MongoDB connection error:', err.message));

module.exports = mongoose;
