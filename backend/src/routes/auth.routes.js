// auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/send-email-otp', authController.sendEmailOTP);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.post('/setup-otp', protect, authController.setupOTP);
router.post('/disable-otp', protect, authController.disableOTP);

module.exports = router;