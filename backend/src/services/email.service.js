const nodemailer = require('nodemailer');
const logger = require('../utils/logger');


const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',          
    auth: {
      user: process.env.SMTP_USER,   
      pass: process.env.SMTP_PASS,  
    },
  });
};

const FROM = process.env.EMAIL_FROM || `Inventra <${process.env.SMTP_USER}>`;

// ── Core send ──
const sendMail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.error('SMTP_USER or SMTP_PASS not set');
    throw new Error('Email not configured. Set SMTP_USER and SMTP_PASS.');
  }

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    throw err;
  }
};

// ── HTML Template ──
const baseTemplate = (content) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc}
    .wrap{max-width:560px;margin:32px auto;padding:0 16px}
    .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07)}
    .header{background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 32px}
    .header h1{color:#fff;font-size:20px;font-weight:700}
    .header p{color:#c4b5fd;font-size:12px;margin-top:4px}
    .body{padding:32px}
    .body p{line-height:1.7;color:#475569;margin-bottom:14px;font-size:14px}
    .otp-box{background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px dashed #8b5cf6;border-radius:12px;padding:24px;text-align:center;margin:20px 0}
    .otp-code{font-size:40px;font-weight:800;letter-spacing:10px;color:#4c1d95;font-family:monospace}
    .otp-label{color:#7c3aed;font-size:12px;margin-top:8px;font-weight:500}
    .btn{display:inline-block;background:#7c3aed;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;margin:8px 0}
    .footer{background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0}
    .footer p{color:#94a3b8;font-size:11px}
    hr{border:none;border-top:1px solid #e2e8f0;margin:18px 0}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <h1>📦 Inventra</h1>
        <p>Smart Inventory Management</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Inventra. Automated email — do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// ── Email functions ──

exports.sendEmailVerificationOTP = async (user, otp) => {
  await sendMail({
    to: user.email,
    subject: `${otp} — Your Inventra verification code`,
    html: baseTemplate(`
      <p>Hi there,</p>
      <p>Use this code to verify your email and complete your Inventra registration:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-label">⏱ Valid for 10 minutes</div>
      </div>
      <p style="font-size:13px;color:#94a3b8">If you did not request this, ignore this email.</p>
    `),
  });
};

exports.sendOTPEmail = async (user, otp) => {
  await sendMail({
    to: user.email,
    subject: `${otp} — Your Inventra login code`,
    html: baseTemplate(`
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your two-factor authentication code:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-label">⏱ Valid for 10 minutes</div>
      </div>
      <p style="font-size:13px;color:#94a3b8">Never share this code with anyone.</p>
    `),
  });
};

exports.sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your Inventra account',
    html: baseTemplate(`
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Click below to verify your Inventra account:</p>
      <p><a href="${url}" class="btn">✓ Verify Email</a></p>
      <hr>
      <p style="font-size:12px;color:#94a3b8">Link expires in 24 hours.</p>
    `),
  });
};

exports.sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your Inventra password',
    html: baseTemplate(`
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Reset your password by clicking below:</p>
      <p><a href="${url}" class="btn">🔒 Reset Password</a></p>
      <hr>
      <p style="font-size:12px;color:#94a3b8">Expires in 10 minutes. Ignore if you did not request this.</p>
    `),
  });
};

exports.sendLowStockAlert = async (recipients, products) => {
  const rows = products.map(p => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.name}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace">${p.sku}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#ef4444;font-weight:bold">${p.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0">${p.minStockLevel}</td>
    </tr>`).join('');

  const html = baseTemplate(`
    <p>⚠️ <strong>Low Stock Alert</strong></p>
    <p>These products need attention:</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px;text-align:left;color:#64748b;font-size:11px">PRODUCT</th>
        <th style="padding:8px;text-align:left;color:#64748b;font-size:11px">SKU</th>
        <th style="padding:8px;text-align:left;color:#64748b;font-size:11px">CURRENT</th>
        <th style="padding:8px;text-align:left;color:#64748b;font-size:11px">MINIMUM</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `);

  for (const email of recipients) {
    await sendMail({ to: email, subject: `⚠️ Low Stock Alert — ${products.length} item(s)`, html });
  }
};