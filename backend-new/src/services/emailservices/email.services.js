const { EmailQueueService } = require('../queue.service');

// Queue-based email service functions
async function SendRegistrationOTPEmail(email, username, otp, options = {}) {
  try {
    console.log(`Queuing registration OTP email for: ${email}`);
    
    // Add email to queue instead of sending directly
    const job = await EmailQueueService.addRegistrationOTPEmail(
      email, 
      username, 
      otp, 
      options
    );
    
    console.log(`Registration OTP email queued successfully with job ID: ${job.id}`);
    
    return {
      success: true,
      jobId: job.id,
      message: 'Registration OTP email queued successfully'
    };
  } catch (error) {
    console.error("Error queuing registration OTP email:", error);
    throw error;
  }
}

async function SendLoginOTPEmail(email, username, otp, ipAddress, deviceInfo, options = {}) {
  try {
    console.log(`Queuing login OTP email for: ${email}`);
    
    // Add email to queue instead of sending directly
    const job = await EmailQueueService.addLoginOTPEmail(
      email, 
      username, 
      otp, 
      ipAddress, 
      deviceInfo, 
      options
    );
    
    console.log(`Login OTP email queued successfully with job ID: ${job.id}`);
    
    return {
      success: true,
      jobId: job.id,
      message: 'Login OTP email queued successfully'
    };
  } catch (error) {
    console.error("Error queuing login OTP email:", error);
    throw error;
  }
}

// Function to get email job status
async function GetEmailJobStatus(jobId) {
  try {
    const jobStatus = await EmailQueueService.getEmailJobStatus(jobId);
    return jobStatus;
  } catch (error) {
    console.error("Error getting email job status:", error);
    throw error;
  }
}

// Function to get email queue statistics
async function GetEmailQueueStats() {
  try {
    const stats = await EmailQueueService.getEmailQueueStats();
    return stats;
  } catch (error) {
    console.error("Error getting email queue stats:", error);
    throw error;
  }
}

module.exports = {
  SendRegistrationOTPEmail,
  SendLoginOTPEmail,
  GetEmailJobStatus,
  GetEmailQueueStats
};
