const axios = require("axios");
require("dotenv").config();

// Main SMS sending function
const sendSMS = async (mobile, message, type = 'GENERAL') => {
  try {
    // Validate mobile number format
    if (!mobile) {
      throw new Error("Mobile number is required");
    }

    // Ensure mobile number starts with +91 for Indian numbers
    let formattedMobile = mobile;
    if (!formattedMobile.startsWith('+91')) {
      if (formattedMobile.startsWith('91')) {
        formattedMobile = '+' + formattedMobile;
      } else if (formattedMobile.length === 10) {
        formattedMobile = '+91' + formattedMobile;
      }
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error("Message is required");
    }

    // Validate environment variables
    if (!process.env.SMS_API_KEY || !process.env.SMS_ENTITY_ID || !process.env.SMS_TEMPLATE_ID || !process.env.SMS_SENDER_ID) {
      throw new Error("SMS configuration is missing in environment variables");
    }

    // Prepare request body according to API documentation
    const requestBody = {
      listsms: [
        {
          sms: message,
          mobiles: formattedMobile,
          senderid: process.env.SMS_SENDER_ID,
          entityid: process.env.SMS_ENTITY_ID,
          tempid: process.env.SMS_TEMPLATE_ID
        }
      ]
    };

    console.log("Sending SMS to:", formattedMobile);
    console.log("SMS Message:", message);
    console.log("SMS Type:", type);

    const response = await axios.post(
      "https://handsonwork.in/api/json/sendsms/",
      requestBody,
      {
        headers: {
          key: process.env.SMS_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000, // Increased timeout
      }
    );

    console.log("SMS API Response:", JSON.stringify(response.data, null, 2));

    // Check if SMS was actually sent successfully - Updated for new API response format
    if (response.data && response.data.smslist && response.data.smslist.sms) {
      const smsResult = response.data.smslist.sms;
      
      if (smsResult.reason === 'success' && smsResult.code === '000') {
        console.log(`SMS sent successfully to ${formattedMobile}. Message ID: ${smsResult.messageid}`);
        return {
          success: true,
          messageId: smsResult.messageid,
          clientSmsId: smsResult.clientsmsid,
          mobile: smsResult.mobileno || formattedMobile,
          status: smsResult.status,
          reason: smsResult.reason,
          code: smsResult.code,
          type: type
        };
      } else {
        console.error(`SMS failed: ${smsResult.reason} (Code: ${smsResult.code})`);
        return {
          success: false,
          error: smsResult.reason,
          code: smsResult.code,
          mobile: formattedMobile,
          type: type
        };
      }
    } else {
      console.error("Unexpected SMS API response format:", response.data);
      return {
        success: false,
        error: "Unexpected response format",
        response: response.data,
        type: type
      };
    }

  } catch (error) {
    console.error("Error sending SMS:", error.message);
    console.error("Full error:", error);
    
    return {
      success: false,
      error: error.message,
      mobile: mobile,
      type: type
    };
  }
};

module.exports = {
  sendSMS
};
