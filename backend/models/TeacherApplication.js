import mongoose from "mongoose";

const teacherApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Phone number must be exactly 10 digits"
      }
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Target organization is required"],
      index: true
    },
    subject: {
      type: String,
      required: [true, "Primary subject or specialization is required"],
      trim: true
    },
    qualification: {
      type: String,
      required: [true, "Highest educational qualification is required"],
      trim: true
    },
    experienceYears: {
      type: Number,
      required: [true, "Years of teaching experience is required"],
      min: [0, "Experience years cannot be negative"],
      default: 0
    },
    experienceDetails: {
      type: String,
      trim: true,
      default: ""
    },
    certifications: {
      type: String,
      trim: true,
      default: ""
    },
    supportingInfo: {
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
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Indexes
teacherApplicationSchema.index({ organizationId: 1, status: 1 });
teacherApplicationSchema.index({ email: 1, organizationId: 1 });

const TeacherApplication = mongoose.model("TeacherApplication", teacherApplicationSchema);

export default TeacherApplication;
