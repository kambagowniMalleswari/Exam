// Import Mongoose
import mongoose from "mongoose";

// Organization schema
const organizationSchema = new mongoose.Schema(
  {
    // Organization name
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true
    },

    // Unique URL-friendly slug
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    // Organization type (School, College, University, Coaching, Corporate)
    type: {
      type: String,
      default: "College",
      trim: true
    },

    // Organization administrator name
    adminName: {
      type: String,
      default: "",
      trim: true
    },

    // Official organization email
    email: {
      type: String,
      required: [true, "Organization email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    // Organization contact number
    phone: {
      type: String,
      trim: true,
      default: ""
    },

    // Organization address details
    address: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    state: {
      type: String,
      trim: true,
      default: ""
    },
    country: {
      type: String,
      trim: true,
      default: ""
    },

    // Organization logo URL
    logo: {
      type: String,
      default: ""
    },

    // Organization status
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active"
    },

    // Boolean flag for backwards compatibility
    isActive: {
      type: Boolean,
      default: true
    },

    // Subscription plan details
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free"
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "trial", "cancelled"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

// Create Organization model
const Organization = mongoose.model("Organization", organizationSchema);

// Export Organization model
export default Organization;