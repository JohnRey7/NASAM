const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'NASM | Your Verification Code',
        text: `Your verification code is: ${code}\nValid for 1 day`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;

