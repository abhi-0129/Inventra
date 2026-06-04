const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

router.use(protect);

router.get('/', restrictTo('admin'), catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { users } });
}));

router.get('/:id', restrictTo('admin', 'manager'), catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));
  res.json({ success: true, data: { user } });
}));

router.put('/me/profile', catchAsync(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: { user } });
}));

router.patch('/:id/role', restrictTo('admin'), catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const validRoles = ['admin', 'manager', 'staff', 'viewer'];
  if (!validRoles.includes(role)) return next(new AppError('Invalid role.', 400));
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return next(new AppError('User not found.', 404));
  res.json({ success: true, data: { user } });
}));

router.patch('/:id/status', restrictTo('admin'), catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!user) return next(new AppError('User not found.', 404));
  res.json({ success: true, data: { user } });
}));

module.exports = router;

// Admin creates a user with a specific role (manager, staff, viewer, admin)
router.post('/create', restrictTo('admin'), catchAsync(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;
  const bcrypt = require('bcryptjs');
  const AppError = require('../utils/AppError');
  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('Email already in use.', 409));
  const hashed = await bcrypt.hash(password || 'Inventra@123', 12);
  const user = await User.create({
    name, email, phone,
    password: hashed,
    role: role || 'staff',
    isEmailVerified: true,
    isActive: true,
  });
  user.password = undefined;
  res.status(201).json({ success: true, data: { user }, message: `User created with role: ${user.role}` });
}));
