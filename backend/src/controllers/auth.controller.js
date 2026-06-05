const jwt = require('jsonwebtoken');
const { totp } = require('otplib');
const crypto = require('crypto');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

const signToken = (id, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) =>
  jwt.sign({ id }, secret, { expiresIn });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = signToken(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);
  User.findByIdAndUpdate(user._id, { refreshToken });
  user.password = undefined;
  user.otpSecret = undefined;
  res.status(statusCode).json({ success: true, token, refreshToken, data: { user } });
};

// ✅ STEP 1: Send OTP to email before registration
exports.sendEmailOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError('Email is required.', 400));

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('An account with this email already exists.', 409));

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP temporarily in a pending collection or as a temp token
  // We use a signed JWT to store OTP securely
  const otpToken = jwt.sign(
    { email, otp, expiry: expiry.getTime() },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  // Send OTP email
  try {
    await emailService.sendEmailVerificationOTP({ email }, otp);
    logger.info(`Email OTP sent to ${email}`);
  } catch (err) {
    logger.error('OTP email failed:', err.message);
    return next(new AppError('Failed to send OTP. Please check your email and try again.', 500));
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email. Valid for 10 minutes.',
    otpToken,
  });
});

// ✅ STEP 2: Verify OTP then register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, otp, otpToken } = req.body;

  if (!otpToken) return next(new AppError('OTP verification required. Please verify your email first.', 400));

  // Verify OTP token
  let decoded;
  try {
    decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
  } catch {
    return next(new AppError('OTP expired. Please request a new one.', 400));
  }

  if (decoded.email !== email) return next(new AppError('Email mismatch. Please verify again.', 400));
  if (decoded.otp !== otp) return next(new AppError('Invalid OTP. Please try again.', 400));
  if (Date.now() > decoded.expiry) return next(new AppError('OTP expired. Please request a new one.', 400));

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('An account with this email already exists.', 409));

  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? 'admin' : 'viewer';

  const user = await User.create({
    name, email, password, phone,
    role: assignedRole,
    isEmailVerified: true, // Already verified via OTP
  });

  logger.info(`New user registered: ${email} as ${assignedRole}`);

  res.status(201).json({
    success: true,
    message: assignedRole === 'admin'
      ? 'Admin account created! You can now log in.'
      : 'Account created successfully! You can now log in.',
    data: { userId: user._id, role: assignedRole },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Please provide email and password.', 400));

  const user = await User.findOne({ email }).select('+password +otpSecret +otpEnabled');
  if (!user || !(await user.comparePassword(password)))
    return next(new AppError('Invalid email or password.', 401));

  if (!user.isActive) return next(new AppError('Your account is deactivated. Contact admin.', 403));
  if (!user.isEmailVerified) return next(new AppError('Please verify your email before logging in.', 403));

  if (user.otpEnabled) {
    const otp = totp.generate(user.otpSecret);
    await emailService.sendOTPEmail(user, otp);
    const tempToken = signToken(user._id, process.env.JWT_SECRET, '10m');
    return res.status(200).json({ success: true, requiresOTP: true, tempToken, message: 'OTP sent to your email.' });
  }

  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
  logger.info(`User logged in: ${email} [${user.role}]`);
  createSendToken(user, 200, res);
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { otp, tempToken } = req.body;
  if (!otp || !tempToken) return next(new AppError('OTP and token are required.', 400));

  let decoded;
  try { decoded = jwt.verify(tempToken, process.env.JWT_SECRET); }
  catch { return next(new AppError('Invalid or expired session. Please login again.', 401)); }

  const user = await User.findById(decoded.id).select('+otpSecret');
  if (!user) return next(new AppError('User not found.', 404));

  const isValid = totp.verify({ token: otp, secret: user.otpSecret });
  if (!isValid) return next(new AppError('Invalid or expired OTP.', 400));

  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
  createSendToken(user, 200, res);
});

exports.setupOTP = catchAsync(async (req, res) => {
  const secret = totp.generateSecret();
  await User.findByIdAndUpdate(req.user._id, { otpSecret: secret, otpEnabled: true });
  res.status(200).json({ success: true, message: 'OTP has been enabled for your account.' });
});

exports.disableOTP = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { otpEnabled: false, otpSecret: null });
  res.status(200).json({ success: true, message: 'OTP disabled.' });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new AppError('Refresh token required.', 400));

  let decoded;
  try { decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch { return next(new AppError('Invalid or expired refresh token.', 401)); }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken)
    return next(new AppError('Invalid refresh token.', 401));

  const newToken = signToken(user._id);
  res.status(200).json({ success: true, token: newToken });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent.' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }
  res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
  if (!user) return next(new AppError('Token is invalid or has expired.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: { user } });
});

exports.logout = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});