const nodemailer = require('nodemailer');

async function sendVerificationEmail(email, code, subject = 'NAS Registration | Email Verification') {
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

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/email/verify?code=${code}`;

  const mailOptions = {
    from: process.env.EMAIL_USER, 
    to: email,
    subject,
    html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;
