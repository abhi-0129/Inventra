const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect, restrictTo } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };
  if (search) filter.$text = { $search: search };
  const suppliers = await Supplier.find(filter).sort({ name: 1 })
    .skip((page - 1) * limit).limit(Number(limit));
  const total = await Supplier.countDocuments(filter);
  res.json({ success: true, data: { suppliers, total } });
}));

router.get('/:id', catchAsync(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  res.json({ success: true, data: { supplier } });
}));

router.post('/', restrictTo('admin', 'manager'), catchAsync(async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: { supplier } });
}));

router.put('/:id', restrictTo('admin', 'manager'), catchAsync(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: { supplier } });
}));

router.delete('/:id', restrictTo('admin'), catchAsync(async (req, res) => {
  await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Supplier deactivated.' });
}));

module.exports = router;
