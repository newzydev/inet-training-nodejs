// จัดการผู้ใช้ — ใช้โดย admin เท่านั้น
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const { auth, adminOnly } = require('../middleware/auth');
const r = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/* [PUT] /api/v1/users/:id/approve — admin อนุมัติผู้ใช้ที่รอ Approve */
router.put('/:id/approve', auth, adminOnly, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return r.badRequest(res, 'invalid id');

  const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { returnDocument: 'after' });
  if (!user) return r.badRequest(res, 'user not found');

  r.ok(res, { _id: user._id, name: user.name, email: user.email, approved: user.approved }, 'approved');
}));

module.exports = router;
