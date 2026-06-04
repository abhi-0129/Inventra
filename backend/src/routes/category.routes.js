// category.routes.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, restrictTo } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).populate('productCount').sort({ name: 1 });
  res.json({ success: true, data: { categories } });
}));

router.get('/:id', catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.json({ success: true, data: { category } });
}));

router.post('/', restrictTo('admin', 'manager'), catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: { category } });
}));

router.put('/:id', restrictTo('admin', 'manager'), catchAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: { category } });
}));

router.delete('/:id', restrictTo('admin'), catchAsync(async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deactivated.' });
}));

module.exports = router;
