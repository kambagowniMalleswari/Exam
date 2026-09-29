// Shared Frontend Validation Utilities for AssessIQ

export const PHONE_REGEX = /^\d{10}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export const validatePhone = (phone) => {
  if (!phone) return "Phone number is required.";
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

export const validatePassword = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least 1 uppercase letter (A-Z).";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least 1 lowercase letter (a-z).";
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return "Password must contain at least 1 special character (!@#$%^&* etc.).";
  }
  return "";
};
