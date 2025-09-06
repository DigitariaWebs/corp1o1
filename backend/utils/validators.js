const { getPasswordValidationRules } = require('../config/auth');

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
const validatePassword = (password) => {
  const rules = getPasswordValidationRules();
  const errors = [];

  // Check length
  if (password.length < rules.minLength) {
    errors.push(`Password must be at least ${rules.minLength} characters long`);
  }

  if (password.length > rules.maxLength) {
    errors.push(`Password cannot exceed ${rules.maxLength} characters`);
  }

  // Check pattern requirements
  if (rules.pattern.uppercase && !rules.pattern.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (rules.pattern.lowercase && !rules.pattern.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (rules.pattern.numbers && !rules.pattern.numbers.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    rules.pattern.specialChars &&
    !rules.pattern.specialChars.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Password should not contain sequential characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
};

// Calculate password strength score
const calculatePasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) {
    score += 1;
    feedback.push('Contains lowercase letters');
  }
  if (/[A-Z]/.test(password)) {
    score += 1;
    feedback.push('Contains uppercase letters');
  }
  if (/\d/.test(password)) {
    score += 1;
    feedback.push('Contains numbers');
  }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 2;
    feedback.push('Contains special characters');
  }

  // Pattern complexity
  if (!/(.)\1{2,}/.test(password)) {
    score += 1;
    feedback.push('No repeated characters');
  }

  const strength = score <= 3 ? 'weak' : score <= 6 ? 'medium' : 'strong';

  return {
    score,
    strength,
    feedback,
  };
};

// Check for sequential characters
const hasSequentialChars = (password) => {
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop'];

  for (let seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const subseq = seq.slice(i, i + 3);
      if (password.toLowerCase().includes(subseq)) {
        return true;
      }
    }
  }
  return false;
};

// Name validation
const validateName = (name, fieldName = 'Name') => {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  }

  if (trimmedName.length > 50) {
    errors.push(`${fieldName} cannot exceed 50 characters`);
  }

  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    errors.push(
      `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    );
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmedName)) {
    errors.push(`${fieldName} cannot contain multiple consecutive spaces`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmedName.replace(/\s+/g, ' '), // Replace multiple spaces with single space
  };
};

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// URL validation
const isValidUrl = (url) => {
  try {
    new globalThis.URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Phone number validation (international format)
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const sanitized = phone.replace(/[\s\-()]/g, '');

  return {
    isValid: phoneRegex.test(sanitized),
    sanitized,
    error: phoneRegex.test(sanitized) ? null : 'Invalid phone number format',
  };
};

// Date validation
const validateDate = (dateString, fieldName = 'Date') => {
  const date = new Date(dateString);
  const errors = [];

  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} must be a valid date`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    date: errors.length === 0 ? date : null,
  };
};

// Age validation
const validateAge = (birthDate, minAge = 13, maxAge = 120) => {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));

  const errors = [];

  if (age < minAge) {
    errors.push(`Must be at least ${minAge} years old`);
  }

  if (age > maxAge) {
    errors.push(`Age cannot exceed ${maxAge} years`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    age,
  };
};

// File validation
const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
    );
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(
        `File extension must be one of: ${allowedExtensions.join(', ')}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Text content validation
const validateTextContent = (text, options = {}) => {
  const {
    minLength = 0,
    maxLength = 1000,
    allowEmpty = true,
    fieldName = 'Text',
  } = options;

  const errors = [];
  const trimmed = text ? text.trim() : '';

  if (!allowEmpty && trimmed.length === 0) {
    errors.push(`${fieldName} is required`);
  }

  if (trimmed.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters long`);
  }

  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
  }

  // Check for potentially harmful content
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
  ];

  for (let pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      errors.push(`${fieldName} contains potentially harmful content`);
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Learning style validation
const validateLearningStyle = (style) => {
  const validStyles = [
    'visual',
    'auditory',
    'kinesthetic',
    'reading',
    'balanced',
  ];
  return {
    isValid: validStyles.includes(style),
    error: validStyles.includes(style)
      ? null
      : `Learning style must be one of: ${validStyles.join(', ')}`,
  };
};

// Time format validation (HH:MM)
const validateTimeFormat = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return {
    isValid: timeRegex.test(time),
    error: timeRegex.test(time) ? null : 'Time must be in HH:MM format',
  };
};

// Sanitize HTML content
const sanitizeHtml = (html) => {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validate and sanitize user input
const sanitizeUserInput = (input, type = 'text') => {
  if (typeof input !== 'string') {
    return input;
  }

  let sanitized = input.trim();

  switch (type) {
  case 'email':
    sanitized = sanitized.toLowerCase();
    break;
  case 'name':
    sanitized = sanitized.replace(/\s+/g, ' ');
    break;
  case 'html':
    sanitized = sanitizeHtml(sanitized);
    break;
  case 'alphanumeric':
    sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
    break;
  default:
    // Basic text sanitization
    sanitized = sanitized.replace(/[<>]/g, '');
  }

  return sanitized;
};

module.exports = {
  isValidEmail,
  validatePassword,
  calculatePasswordStrength,
  validateName,
  isValidObjectId,
  isValidUrl,
  validatePhoneNumber,
  validateDate,
  validateAge,
  validateFile,
  validateTextContent,
  validateLearningStyle,
  validateTimeFormat,
  sanitizeHtml,
  sanitizeUserInput,
};
