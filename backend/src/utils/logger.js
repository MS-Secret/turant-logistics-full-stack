const winston = require('winston');
require('dotenv').config();

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format for development (readable console logs)
const devFormat = printf(({ level, message, service, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]${service ? ` [${service}]` : ''}: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    // Optionally omit very large objects from console
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  defaultMeta: { service: 'backend-service' },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console(),
    // Add file transports if needed in production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ] : [])
  ],
});

// Helper to sanitize sensitive data before logging
logger.sanitize = (data) => {
  if (!data) return data;
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'aadhaarCard', 'panCard', 'licenseImageUrl', 'phone', 'email', 'phoneNumber'];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  const redact = (obj) => {
    for (let key in obj) {
      if (sensitiveKeys.includes(key)) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redact(obj[key]);
      }
    }
  };
  
  redact(sanitized);
  return sanitized;
};

module.exports = logger;
