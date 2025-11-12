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

  // Use backend URL for API endpoint (will redirect to frontend after verification)
  const backendUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${backendUrl}/api/auth/email/verify?code=${code}`;
  
  // Debug logging
  console.log('📧 Email Verification Debug:');
  console.log('   BACKEND_URL:', process.env.BACKEND_URL);
  console.log('   BASE_URL:', process.env.BASE_URL);
  console.log('   Using URL:', backendUrl);
  console.log('   Full verification URL:', verificationUrl);

  const mailOptions = {
    from: `"CIT-U Non-Academic Scholars" <${process.env.EMAIL_USER}>`, 
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #800000 0%, #600000 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #800000;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .message {
            font-size: 15px;
            color: #555;
            margin-bottom: 25px;
            line-height: 1.8;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .verify-button {
            display: inline-block;
            padding: 14px 40px;
            background: linear-gradient(135deg, #800000 0%, #600000 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(128, 0, 0, 0.2);
            transition: transform 0.2s;
          }
          .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(128, 0, 0, 0.3);
          }
          .code-box {
            background-color: #f8f9fa;
            border-left: 4px solid #800000;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .code {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #800000;
            letter-spacing: 2px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 13px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer p {
            margin: 5px 0;
          }
          .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 25px 0;
          }
          .note {
            font-size: 13px;
            color: #888;
            font-style: italic;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 CIT-U Non-Academic Scholars</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hello!</p>
            
            <p class="message">
              Thank you for registering with the <strong>CIT-U Non-Academic Scholarship Application Management System</strong>. 
              We're excited to have you join our community of scholars!
            </p>
            
            <p class="message">
              To complete your registration and activate your account, please verify your email address by clicking the button below:
            </p>
            
            <div class="button-container">
              <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
            </div>
            
            <div class="divider"></div>
            
            <p class="message">
              Alternatively, you can use this verification code:
            </p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p class="note">
              If you didn't create an account with CIT-U Non-Academic Scholars, please ignore this email or contact our support team.
            </p>
            
            <p class="note">
              This verification link will expire in 24 hours for security reasons.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>CIT-U Non-Academic Scholars</strong></p>
            <p>Cebu Institute of Technology - University</p>
            <p>© ${new Date().getFullYear()} CIT-U. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;
