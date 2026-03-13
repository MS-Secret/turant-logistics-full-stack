const { Cashfree, CFEnvironment } = require('cashfree-pg');

// Initialize Cashfree SDK
const cashfreeConfig = {
  environment: process.env.CASHFREE_ENVIRONMENT || 'SANDBOX', 
  clientId: process.env.CASHFREE_APP_ID || process.env.CASHFREE_CLIENT_ID,
  clientSecret: process.env.CASHFREE_SECRET_ID,
};

// Validate required environment variables
if (!cashfreeConfig.clientId || !cashfreeConfig.clientSecret) {
  console.error('Cashfree configuration error: Missing CLIENT_ID or CLIENT_SECRET');
}

// Initialize Cashfree instance
const cashfree = new Cashfree(
  cashfreeConfig.environment === 'PRODUCTION' 
    ? CFEnvironment.PRODUCTION 
    : CFEnvironment.SANDBOX,
  cashfreeConfig.clientId,
  cashfreeConfig.clientSecret
);

module.exports = {
  cashfree,
  cashfreeConfig
};