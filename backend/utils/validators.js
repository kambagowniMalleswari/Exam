// Shared Validation Utilities for AssessIQ Backend

export const PHONE_REGEX = /^\d{10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

/**
 * Validates phone number (strictly 10 digits)
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  return PHONE_REGEX.test(phone.toString().trim());
};

/**
 * Validates username or full name (strictly > 3 characters)
 */
export const isValidUsername = (name) => {
  if (!name || typeof name !== "string") return false;
  return name.trim().length > 3;
};

/**
 * Validates password:
 * - Minimum 6 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 special character
 */
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, isValid: false, message: "Password is required" };
  }
  if (password.length < 6) {
    return { valid: false, isValid: false, message: "Password must be at least 6 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, isValid: false, message: "Password must contain at least one uppercase letter (A-Z)" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, isValid: false, message: "Password must contain at least one lowercase letter (a-z)" };
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return { valid: false, isValid: false, message: "Password must contain at least one special character (!@#$%^&* etc.)" };
  }
  return { valid: true, isValid: true };
};

