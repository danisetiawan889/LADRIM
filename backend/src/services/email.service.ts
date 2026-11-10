import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.BREVO_SMTP_HOST,
  port: env.BREVO_SMTP_PORT,
  secure: env.BREVO_SMTP_PORT === 465,
  auth: {
    user: env.BREVO_SMTP_USER,
    pass: env.BREVO_SMTP_PASS,
  },
});

export async function sendVerificationOtpEmail(to: string, fullName: string, otp: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your LADRIM Verification Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 40px 20px;
      color: #111111;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .header {
      background: #0d0d0d;
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.35em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0;
    }
    .body-content {
      padding: 40px 32px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #111111;
      margin-bottom: 12px;
    }
    .greeting {
      font-size: 14px;
      color: #555555;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .otp-box {
      background: #f4f4f4;
      border: 1px dashed #cccccc;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
      display: inline-block;
      min-width: 240px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #0d0d0d;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
    }
    .expiry {
      font-size: 12px;
      color: #888888;
      margin-top: 20px;
    }
    .security-note {
      font-size: 12px;
      color: #999999;
      border-top: 1px solid #eeeeee;
      padding-top: 24px;
      margin-top: 32px;
      line-height: 1.5;
    }
    .footer {
      background: #fafafa;
      border-top: 1px solid #eeeeee;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">LADRIM</h1>
    </div>
    <div class="body-content">
      <h2 class="title">Verification Code</h2>
      <p class="greeting">
        Hello <strong>${fullName || 'there'}</strong>,<br>
        Thank you for creating an account with LADRIM. Please use the 6-digit verification code below to verify your email address:
      </p>

      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>

      <p class="expiry">
        This code is valid for <strong>10 minutes</strong>.
      </p>

      <div class="security-note">
        If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized activity.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 LADRIM Studios. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: `${otp} is your LADRIM verification code`,
      html,
    });
    console.log(`[Email] Sent verification OTP to ${to}, messageId: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error(`[Email] Brevo SMTP error for ${to}:`, err?.message || err);

    // In development / local testing: don't block the UI if Brevo rejects the IP address.
    // Log the 6-digit OTP prominently in the backend terminal so developer can test the OTP screen!
    if (env.NODE_ENV !== 'production') {
      console.log(`\n=============================================================`);
      console.log(`[DEV OTP NOTIFICATION] ⚠️ Brevo SMTP Error: ${err?.message || err}`);
      console.log(`[DEV OTP NOTIFICATION] 🔑 Kode OTP Registrasi untuk: ${to}`);
      console.log(`[DEV OTP NOTIFICATION] 👉 KODE 6-DIGIT ANDA: >>> ${otp} <<<`);
      console.log(`=============================================================\n`);
      return true;
    }

    throw new Error('Failed to send verification code email');
  }
}
