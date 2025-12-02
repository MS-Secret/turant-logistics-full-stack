const { body, query, param } = require('express-validator');

// Registration validation
const validateRegistration = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2 and 30 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2 and 30 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['USER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role'),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Invalid gender'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
];

// Login validation
const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// OTP validation
const validateSendOTP = [
  body('identifier')
    .notEmpty()
    .withMessage('Identifier (phone/email) is required'),
  
  body('purpose')
    .isIn(['LOGIN', 'REGISTRATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION'])
    .withMessage('Invalid OTP purpose'),
  
  body('identifierType')
    .optional()
    .isIn(['PHONE', 'EMAIL'])
    .withMessage('Invalid identifier type')
];

const validateVerifyOTP = [
  body('identifier')
    .notEmpty()
    .withMessage('Identifier is required'),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  
  body('purpose')
    .isIn(['LOGIN', 'REGISTRATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION'])
    .withMessage('Invalid OTP purpose')
];

// Password reset validation
const validateResetPassword = [
  body('identifier')
    .notEmpty()
    .withMessage('Identifier is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric')
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Profile update validation
const validateUpdateProfile = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('profile.firstName')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2 and 30 characters'),
  
  body('profile.lastName')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2 and 30 characters'),
  
  body('profile.gender')
    .optional()
    .isIn(['MALE', 'FEMALE', 'OTHER'])
    .withMessage('Invalid gender'),
  
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
];

// User ID validation
const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .matches(/^[A-Z]{3}\d+/)
    .withMessage('Invalid user ID format')
];

// User status validation
const validateUserStatus = [
  body('status')
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'])
    .withMessage('Invalid status')
];

// Role validation
const validateRole = [
  body('name')
    .notEmpty()
    .withMessage('Role name is required')
    .isIn(['USER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role name'),
  
  body('description')
    .notEmpty()
    .withMessage('Role description is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Description must be between 10 and 200 characters'),
  
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array'),
  
  body('permissions.*.module')
    .isIn(['USER', 'DRIVER', 'ORDER', 'PAYMENT', 'LOCATION', 'NOTIFICATION', 'KYC', 'INVOICE', 'DISPATCH', 'PRICING', 'WALLET', 'ADMIN'])
    .withMessage('Invalid module name'),
  
  body('permissions.*.actions')
    .isArray()
    .withMessage('Actions must be an array'),
  
  body('permissions.*.actions.*')
    .isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN'])
    .withMessage('Invalid action')
];

// Query validation for filters
const validateUserFilters = [
  query('role')
    .optional()
    .isIn(['USER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role'),
  
  query('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'])
    .withMessage('Invalid status'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'username', 'email', 'phone', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  query('phoneVerified')
    .optional()
    .isBoolean()
    .withMessage('Phone verified must be boolean'),
  
  query('emailVerified')
    .optional()
    .isBoolean()
    .withMessage('Email verified must be boolean')
];

// Search validation
const validateSearch = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be between 2 and 50 characters')
];

// Permission check validation
const validatePermissionCheck = [
  query('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  
  query('module')
    .notEmpty()
    .withMessage('Module is required')
    .isIn(['USER', 'DRIVER', 'ORDER', 'PAYMENT', 'LOCATION', 'NOTIFICATION', 'KYC', 'INVOICE', 'DISPATCH', 'PRICING', 'WALLET', 'ADMIN'])
    .withMessage('Invalid module'),
  
  query('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN'])
    .withMessage('Invalid action')
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateSendOTP,
  validateVerifyOTP,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
  validateUserId,
  validateUserStatus,
  validateRole,
  validateUserFilters,
  validateSearch,
  validatePermissionCheck
};
