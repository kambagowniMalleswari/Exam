import mongoose from "mongoose";

const orgApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization or Institution name is required"],
      trim: true,
      minlength: [3, "Organization name must be at least 3 characters"]
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true
    },
    type: {
      type: String,
      enum: ["College", "University", "School", "Coaching / Training", "Corporate"],
      default: "College"
    },
    adminName: {
      type: String,
      required: [true, "Primary administrator name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Official institutional email is required"],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, "10-digit phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Phone number must be exactly 10 digits"
      }
    },
    website: {
      type: String,
      trim: true,
      default: ""
    },
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
      default: "India"
    },
    expectedStudents: {
      type: String,
      enum: ["1-100", "101-500", "501-2000", "2000+"],
      default: "101-500"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ""
    },
    createdOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null
    },
    createdAdminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

orgApplicationSchema.index({ status: 1, createdAt: -1 });
orgApplicationSchema.index({ email: 1 });

const OrgApplication = mongoose.model("OrgApplication", orgApplicationSchema);

export default OrgApplication;
