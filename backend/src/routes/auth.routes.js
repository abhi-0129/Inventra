// auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);  // ✅ email verification
router.post('/verify-otp', authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.post('/setup-otp', protect, authController.setupOTP);
router.post('/disable-otp', protect, authController.disableOTP);

// ✅ SMTP test route - remove after testing
router.get('/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  try {
    await t.verify();
    res.json({ success: true, message: 'SMTP working!', host: process.env.SMTP_HOST, user: process.env.SMTP_USER });
  } catch(err) {
    res.json({ success: false, error: err.message, host: process.env.SMTP_HOST, user: process.env.SMTP_USER });
  }
});

module.exports = router;