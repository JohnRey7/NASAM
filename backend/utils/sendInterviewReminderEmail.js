const nodemailer = require('nodemailer');

/**
 * Send interview reminder email to applicant
 * @param {string} email - Recipient email
 * @param {Object} interviewDetails - Interview details
 * @param {string} interviewDetails.applicantName - Name of the applicant
 * @param {string} interviewDetails.interviewType - Type of interview (OAS Staff / Department Head)
 * @param {string} interviewDetails.interviewerName - Name of the interviewer
 * @param {Date} interviewDetails.scheduledDate - Scheduled date and time
 * @param {string} interviewDetails.interviewId - Interview ID for reference
 */
async function sendInterviewReminderEmail(email, interviewDetails) {
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

  const { applicantName, interviewType, interviewerName, scheduledDate, interviewId } = interviewDetails;

  // Format the date and time
  const dateObj = new Date(scheduledDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `"CIT-U Non-Academic Scholars" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Interview Reminder - ${interviewType} Interview`,
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
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 30px;
          }
          .alert-box {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .alert-box h3 {
            color: #856404;
            margin: 0 0 10px;
            font-size: 18px;
          }
          .details-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #6c757d;
            font-weight: 500;
          }
          .detail-value {
            color: #333;
            font-weight: 600;
          }
          .highlight {
            color: #800000;
          }
          .tips-section {
            background: #e8f5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .tips-section h4 {
            color: #2e7d32;
            margin: 0 0 15px;
          }
          .tips-section ul {
            margin: 0;
            padding-left: 20px;
          }
          .tips-section li {
            margin-bottom: 8px;
            color: #333;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
          }
          .footer a {
            color: #800000;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Reminder</h1>
            <p>CIT-U Non-Academic Scholarship Program</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${applicantName || 'Applicant'}</strong>,</p>
            
            <div class="alert-box">
              <h3>⏰ Don't Forget Your Interview!</h3>
              <p>This is a friendly reminder about your upcoming scholarship interview. Please make sure to be available on time.</p>
            </div>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Interview Type</span>
                <span class="detail-value highlight">${interviewType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Interviewer</span>
                <span class="detail-value">${interviewerName || 'To be confirmed'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reference ID</span>
                <span class="detail-value" style="font-family: monospace;">${interviewId}</span>
              </div>
            </div>
            
            <div class="tips-section">
              <h4>📋 Interview Tips</h4>
              <ul>
                <li>Be online or at the venue at least 10-15 minutes before your scheduled time</li>
                <li>Prepare relevant documents (ID, grades, certificates)</li>
                <li>Dress appropriately and professionally</li>
                <li>Test your internet connection if it's an online interview</li>
                <li>Be ready to discuss your application and goals</li>
              </ul>
            </div>
            
            <p>If you have any questions or need to reschedule, please contact the Office of Academic Scholarships as soon as possible.</p>
            
            <p>Good luck with your interview!</p>
            
            <p>Best regards,<br>
            <strong>Office of Academic Scholarships</strong><br>
            Cebu Institute of Technology - University</p>
          </div>
          
          <div class="footer">
            <p>This is an automated reminder from the CIT-U Non-Academic Scholarship Management System.</p>
            <p>© ${new Date().getFullYear()} CIT-U Office of Academic Scholarships</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Interview reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending interview reminder email:', error);
    throw error;
  }
}

module.exports = sendInterviewReminderEmail;
