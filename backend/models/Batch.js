import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Batch name is required"],
      trim: true,
      minlength: [2, "Batch name must be at least 2 characters"]
    },
    batchNumber: {
      type: String,
      required: [true, "Batch number or code is required"],
      trim: true,
      uppercase: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization reference is required"],
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Batch creator is required"]
    },
    department: {
      type: String,
      trim: true,
      default: "General"
    },
    academicYear: {
      type: String,
      trim: true,
      default: () => {
        const y = new Date().getFullYear();
        return `${y}-${y + 1}`;
      }
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    // Test series assigned / linked to this batch
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test"
      }
    ],
    // Maximum student capacity limit (configurable and editable by teacher)
    maxStudents: {
      type: Number,
      default: 50,
      min: [1, "Batch student capacity limit must be at least 1"]
    },
    // Autonomous teacher publishing status
    isPublished: {
      type: Boolean,
      default: true
    },
    // Enrollment mode: "open" (any org student can self-enroll up to capacity) or "selective" (whitelisted students only)
    enrollmentType: {
      type: String,
      enum: ["open", "selective"],
      default: "open"
    },
    // Selective students allowed to enroll (if selective)
    selectiveStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    // Optional passcode or enrollment key
    accessCode: {
      type: String,
      trim: true,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure batchNumber is unique within an organization
batchSchema.index({ organizationId: 1, batchNumber: 1 }, { unique: true });
batchSchema.index({ organizationId: 1, isActive: 1 });

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;
