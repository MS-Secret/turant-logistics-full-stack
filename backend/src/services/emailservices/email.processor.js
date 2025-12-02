const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, 
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSKEY,
  },
   tls: {
    // Do not fail on invalid certs for development
    rejectUnauthorized: false
  }
});

// Registration OTP email function
const sendRegistrationOTPEmail = async (data) => {
  const { email, username, otp } = data;
  
  try {
    // Read the content of the HTML file
    const templatePath = path.join(
      __dirname,
      "registrationEmailOTP.html"
    );
    let template = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholder [userName] with the actual username
    template = template.replace("[userName]", username);
    template = template.replace("[OTP]", otp);
    template = template.replace("[email]", email);
    
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Turant Logistics" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your OTP for Registration",
      html: template,
    });

    console.log("Registration OTP email sent: %s", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      email: email,
      type: 'REGISTRATION_OTP'
    };
  } catch (error) {
    console.error("Error sending registration OTP email:", error);
    return {
      success: false,
      error: error.message,
      email: email,
      type: 'REGISTRATION_OTP'
    };
  }
};

// Login OTP email function
const sendLoginOTPEmail = async (data) => {
  const { email, username, otp, ipAddress, deviceInfo } = data;
  
  try {
    // Read the content of the HTML file
    const templatePath = path.join(
      __dirname,
      "loginEmailOTP.html"
    );
    let template = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholders
    template = template.replace("[userName]", username);
    template = template.replace("[OTP]", otp);
    template = template.replace("[email]", email);
    template = template.replace("[timestamp]", new Date().toISOString());
    template = template.replace("[ipAddress]", ipAddress || 'Unknown');
    template = template.replace("[deviceInfo]", deviceInfo || 'Unknown Device');

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Turant Logistics" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your OTP for Login",
      html: template,
    });

    console.log("Login OTP email sent: %s", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      email: email,
      type: 'LOGIN_OTP'
    };
  } catch (error) {
    console.error("Error sending login OTP email:", error);
    return {
      success: false,
      error: error.message,
      email: email,
      type: 'LOGIN_OTP'
    };
  }
};

// Forgot password email function
const sendForgotPasswordEmail = async (data) => {
  const { email, resetToken } = data;
  
  try {
    // For now, we'll use a simple template
    // You can create a separate forgot password template later
    const template = `
      <html>
        <body>
          <h2>Password Reset Request</h2>
          <p>Dear User,</p>
          <p>You have requested to reset your password for Turant Logistics.</p>
          <p>Your password reset token is: <strong>${resetToken}</strong></p>
          <p>This token is valid for 1 hour.</p>
          <p>If you did not request this reset, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Turant Logistics Team</p>
        </body>
      </html>
    `;

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Turant Logistics" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Password Reset Request - Turant Logistics",
      html: template,
    });

    console.log("Forgot password email sent: %s", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      email: email,
      type: 'FORGOT_PASSWORD'
    };
  } catch (error) {
    console.error("Error sending forgot password email:", error);
    return {
      success: false,
      error: error.message,
      email: email,
      type: 'FORGOT_PASSWORD'
    };
  }
};

module.exports = {
  sendRegistrationOTPEmail,
  sendLoginOTPEmail,
  sendForgotPasswordEmail
};
