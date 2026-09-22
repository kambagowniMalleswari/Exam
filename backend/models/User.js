// Import Mongoose
import mongoose from "mongoose";

// User schema
const userSchema = new mongoose.Schema(
  {
    // User full name
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"]
    },

    // User email
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    // User phone number
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: "Phone number must be exactly 10 digits"
      }
    },

    // Teacher subject or department (optional)
    subject: {
      type: String,
      trim: true,
      default: ""
    },

    // Hashed user password
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },

    // User role
    role: {
      type: String,
      enum: ["super_admin", "org_admin", "admin", "teacher", "student"],
      default: "student"
    },

    // Organization that the user belongs to (null for super admin)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },

    // Google OAuth integration
    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true
    },

    // Avatar profile picture URL
    avatar: {
      type: String,
      default: ""
    },

    // Account status
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active"
    },

    // User account active boolean flag for backwards compatibility
    isActive: {
      type: Boolean,
      default: true
    },

    // Creator user id (for students/teachers created by admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Student Batch Assignment
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true
    },
    batchNumber: {
      type: String,
      default: "",
      trim: true,
      index: true
    },

    // Last successful login time
    lastLogin: {
      type: Date,
      default: null
    },

    // Email OTP Password Reset
    resetPasswordOtp: {
      type: String,
      default: null
    },
    resetPasswordOtpExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, batchId: 1 });
userSchema.index({ subject: 1 });

// Create User model
const User = mongoose.model("User", userSchema);

// Export User model
export default User;