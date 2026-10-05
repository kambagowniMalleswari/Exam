// Shared Frontend Validation Utilities for AssessIQ

export const PHONE_REGEX = /^\d{10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

/**
 * Strips all non-digit characters and truncates to maxLen (default 10)
 */
export const sanitizeDigits = (val = "", maxLen = 10) => {
  return String(val || "").replace(/\D/g, "").slice(0, maxLen);
};

export const validatePhone = (phone, optional = false) => {
  if (!phone || !phone.toString().trim()) {
    return optional ? "" : "Phone number is required.";
  }
  const clean = phone.toString().trim();
  if (!PHONE_REGEX.test(clean)) {
    return "Phone number must be exactly 10 numeric digits.";
  }
  return "";
};

export const validateUsername = (name, label = "Full name / Username") => {
  if (!name || !name.trim()) return `${label} is required.`;
  if (name.trim().length <= 3) {
    return `${label} must be more than 3 characters (at least 4 characters).`;
  }
  return "";
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) return "Email address is required.";
  if (!EMAIL_REGEX.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return "";
};

export const getPasswordCriteria = (password = "") => {
  const pwd = String(password || "");
  const hasLength = pwd.length >= 6;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasSpecial = SPECIAL_CHAR_REGEX.test(pwd);
  return {
    hasLength,
    hasUpper,
    hasLower,
    hasSpecial,
    isValid: hasLength && hasUpper && hasLower && hasSpecial
  };
};

export const validatePassword = (password) => {
  if (!password) return "Password is required.";
  const { hasLength, hasUpper, hasLower, hasSpecial } = getPasswordCriteria(password);
  if (!hasLength) return "Password must be at least 6 characters long.";
  if (!hasUpper) return "Password must contain at least 1 uppercase letter (A-Z).";
  if (!hasLower) return "Password must contain at least 1 lowercase letter (a-z).";
  if (!hasSpecial) return "Password must contain at least 1 special character (!@#$%^&* etc.).";
  return "";
};
