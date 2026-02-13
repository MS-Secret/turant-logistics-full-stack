const { randomUUID } = require('crypto');

// Use Node.js built-in UUID function
const uuidv4 = randomUUID;

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique user ID using UUID
const generateUserId = (role) => {
  const prefix = {
    USER: "USR",
    DRIVER: "DRV",
    ADMIN: "ADM",
    SUPER_ADMIN: "SUP",
  };

  // Generate UUID and remove hyphens for cleaner ID
  const uuid = uuidv4().replace(/-/g, "");
  return `${prefix[role]}_${uuid}`;
};

// Generate Order ID
const generateOrderId = () => {
  const uuid = uuidv4().replace(/-/g, "");
  return `ORD_${uuid}`;
};

// Generate Transaction ID
const generateTransactionId = () => {
  const uuid = uuidv4().replace(/-/g, "");
  return `TXN_${uuid}`;
};

module.exports = {
  generateOTP,
  generateUserId,
  generateOrderId,
  generateTransactionId,
};
