// Import Mongoose
import mongoose from "mongoose";

// Attempt schema
const attemptSchema = new mongoose.Schema(
  {
    // Test being attempted
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: [true, "Test ID is required"],
      index: true
    },

    // Student taking the test
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
      index: true
    },

    // Organization that owns the test (null for public or creator tests)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },

    // Student's selected answers
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true
        },
        selectedAnswer: {
          type: String,
          default: ""
        },
        isFlagged: {
          type: Boolean,
          default: false
        }
      }
    ],

    // Attempt status
    status: {
      type: String,
      enum: ["started", "in_progress", "submitted", "evaluated", "expired"],
      default: "in_progress",
      index: true
    },

    // Score obtained
    score: {
      type: Number,
      default: 0
    },

    // Maximum possible marks
    totalMarks: {
      type: Number,
      default: 0
    },

    // Percentage score
    percentage: {
      type: Number,
      default: 0
    },

    // Whether candidate passed
    passed: {
      type: Boolean,
      default: false
    },

    // Passing percentage required for this attempt
    passingPercentage: {
      type: Number,
      default: 40
    },

    // Time taken in seconds
    timeTaken: {
      type: Number,
      default: 0
    },

    // When the student started
    startedAt: {
      type: Date,
      default: Date.now
    },

    // When the student submitted or timed out
    submittedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
attemptSchema.index({ studentId: 1, testId: 1 });
attemptSchema.index({ organizationId: 1, status: 1 });

// Create Attempt model
const Attempt = mongoose.model("Attempt", attemptSchema);

// Export Attempt model
export default Attempt;