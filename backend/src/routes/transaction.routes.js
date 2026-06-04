// transaction.routes.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, type, productId, startDate, endDate } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (productId) filter.product = productId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('product', 'name sku')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);
  res.json({ success: true, data: { transactions, total, page: Number(page), pages: Math.ceil(total / limit) } });
}));

module.exports = router;
