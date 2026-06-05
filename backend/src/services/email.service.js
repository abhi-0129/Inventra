const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f1f5f9; color:#1e293b; }
    .wrapper { max-width:600px; margin:0 auto; padding:24px; }
    .card { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header { background:#0f172a; padding:28px 32px; }
    .header h1 { color:#fff; font-size:22px; font-weight:700; letter-spacing:-0.5px; }
    .header p { color:#94a3b8; font-size:12px; margin-top:4px; }
    .body { padding:32px; }
    .body p { line-height:1.7; color:#475569; margin-bottom:16px; }
    .btn { display:inline-block; background:#6366f1; color:#fff!important; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px; margin:8px 0; }
    .otp-box { background:#f8fafc; border:2px dashed #6366f1; border-radius:10px; padding:20px; text-align:center; margin:20px 0; }
    .otp-code { font-size:36px; font-weight:800; letter-spacing:8px; color:#0f172a; font-family:monospace; }
    .otp-label { color:#64748b; font-size:12px; margin-top:6px; }
    .footer { background:#f8fafc; padding:16px 32px; text-align:center; }
    .footer p { color:#94a3b8; font-size:11px; }
    .divider { border:none; border-top:1px solid #e2e8f0; margin:20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>📦 INVENTRA</h1>
        <p>Intelligent Inventory Management</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Inventra. This email was sent automatically.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

exports.sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const html = baseTemplate(`
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Welcome to Inventra! Please verify your email address to activate your account.</p>
    <p><a href="${url}" class="btn">✓ Verify Email Address</a></p>
    <hr class="divider">
    <p style="font-size:12px; color:#94a3b8;">This link expires in 24 hours.</p>
  `);

  await sendMail({ to: user.email, subject: 'Verify your Inventra account', html });
  logger.info(`Verification email sent to ${user.email}`);
};

exports.sendOTPEmail = async (user, otp) => {
  const html = baseTemplate(`
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your one-time login code for Inventra is:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-label">Expires in 10 minutes</div>
    </div>
    <p>Never share this code with anyone. Inventra staff will never ask for your OTP.</p>
  `);

  await sendMail({ to: user.email, subject: 'Your Inventra login OTP', html });
};

exports.sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const html = baseTemplate(`
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>You requested a password reset. Click below to set a new password:</p>
    <p><a href="${url}" class="btn">🔒 Reset Password</a></p>
    <hr class="divider">
    <p style="font-size:12px; color:#94a3b8;">This link expires in 10 minutes. If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `);

  await sendMail({ to: user.email, subject: 'Reset your Inventra password', html });
};

exports.sendLowStockAlert = async (recipients, products) => {
  const productList = products.map(p =>
    `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.name}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace">${p.sku}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#ef4444;font-weight:bold">${p.quantity}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.minStockLevel}</td></tr>`
  ).join('');

  const html = baseTemplate(`
    <p>⚠️ <strong>Low Stock Alert</strong></p>
    <p>The following products have fallen below their minimum stock levels and require immediate attention:</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">PRODUCT</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">SKU</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">CURRENT QTY</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#64748b">MIN LEVEL</th>
      </tr></thead>
      <tbody>${productList}</tbody>
    </table>
    <p style="margin-top:20px"><a href="${process.env.CLIENT_URL}/inventory?filter=low_stock" class="btn">View in Inventra →</a></p>
  `);

  for (const email of recipients) {
    await sendMail({ to: email, subject: `⚠️ Low Stock Alert — ${products.length} item(s) need attention`, html });
  }
};

const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Inventra <noreply@inventra.io>',
      to, subject, html,
    });
  } catch (error) {
    logger.error('Email send failed:', { to, subject, error: error.message });
    throw error;
  }
};

// ✅ NEW: Send 6-digit OTP for email verification during signup
exports.sendEmailVerificationOTP = async (user, otp) => {
  const html = baseTemplate(`
    <p>Hi there,</p>
    <p>Use the code below to verify your email address for Inventra:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-label">Expires in 10 minutes</div>
    </div>
    <p>If you did not request this, please ignore this email.</p>
  `);
  await sendMail({ to: user.email, subject: 'Your Inventra Email Verification Code', html });
  logger.info(`Email verification OTP sent to ${user.email}`);
};