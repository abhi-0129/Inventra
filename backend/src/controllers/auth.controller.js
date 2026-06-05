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

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('An account with this email already exists.', 409));

  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? 'admin' : 'viewer';

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name, email, password, phone,
    role: assignedRole,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
    isEmailVerified: false,
  });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user, verificationToken);
  } catch (err) {
    logger.error('Verification email failed:', err.message);
  }

  logger.info(`New user registered: ${email} as ${assignedRole}`);

  res.status(201).json({
    success: true,
    message: userCount === 0
      ? 'Admin account created! Please verify your email.'
      : 'Registration successful! Please check your email to verify your account.',
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
