const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(email, code) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const resetUrl = `${frontendUrl}/forgot-password/change-password?email=${encodeURIComponent(email)}&code=${code}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'NAS | Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Verification Code: <strong>${code}</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendPasswordResetEmail;
