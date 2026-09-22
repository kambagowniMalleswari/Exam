// Import Mongoose
import mongoose from "mongoose";

// Test schema
const testSchema = new mongoose.Schema(
  {
    // Test title
    title: {
      type: String,
      required: [true, "Test title is required"],
      trim: true,
      minlength: [3, "Test title must be at least 3 characters"]
    },

    // Test description
    description: {
      type: String,
      trim: true,
      default: ""
    },

    // Subject or category of the test
    subject: {
      type: String,
      trim: true,
      default: "General"
    },

    // Organization that owns this test
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },

    // User who created the test
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Test creator is required"],
      index: true
    },

    // Test duration in minutes
    duration: {
      type: Number,
      required: [true, "Test duration is required"],
      min: [1, "Duration must be at least 1 minute"]
    },

    // Total Marks possible
    totalMarks: {
      type: Number,
      default: 0
    },

    // Passing marks threshold
    passingMarks: {
      type: Number,
      default: 0
    },

    // Passing percentage
    passingPercentage: {
      type: Number,
      default: 40,
      min: [0, "Passing percentage cannot be below 0"],
      max: [100, "Passing percentage cannot exceed 100"]
    },

    // Allowed attempts per student (default 1, >1 allows retakes)
    numberOfAttempts: {
      type: Number,
      default: 1,
      min: [1, "Number of attempts must be at least 1"]
    },

    // Attempt evaluation mode: re_attempt_on_fail (only if failed) or best_of_n (best score)
    attemptMode: {
      type: String,
      enum: ["re_attempt_on_fail", "best_of_n"],
      default: "re_attempt_on_fail"
    },

    // Test access type (public = accessible to all, private = organization only)
    type: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true
    },

    // Test lifecycle status
    status: {
      type: String,
      enum: ["draft", "published", "unpublished", "archived"],
      default: "draft",
      index: true
    },

    // Candidate instructions
    instructions: {
      type: String,
      default: "Read each question carefully before submitting. The test will auto-submit when the timer expires."
    },

    // Test schedule dates
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },

    // When test was published
    publishedAt: {
      type: Date,
      default: null
    },

    // Student Cohort Targeting & Roll-Out Configuration
    targetType: {
      type: String,
      enum: ["all", "selective"],
      default: "all",
      index: true
    },
    // Selective Batches
    targetBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch"
      }
    ],
    // Selective Batch Code Strings
    targetBatchNumbers: [
      {
        type: String,
        trim: true
      }
    ],
    // Score & Merit List Criteria
    targetCriteria: {
      minPriorScore: {
        type: Number,
        default: null
      },
      maxPriorScore: {
        type: Number,
        default: null
      },
      meritListTopN: {
        type: Number,
        default: null
      }
    },
    // Direct Specific Student Whitelist
    selectedStudentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for fast querying
testSchema.index({ organizationId: 1, status: 1 });
testSchema.index({ type: 1, status: 1 });
testSchema.index({ createdBy: 1, status: 1 });
testSchema.index({ subject: 1 });
testSchema.index({ startDate: 1, endDate: 1 });

// Create Test model
const Test = mongoose.model("Test", testSchema);

// Export Test model
export default Test;