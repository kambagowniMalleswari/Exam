// Import Mongoose
import mongoose from "mongoose";

// Result schema
const resultSchema = new mongoose.Schema(
  {
    // Attempt connected to this result
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
      unique: true,
      index: true
    },

    // Test that was attempted
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: [true, "Test ID is required"],
      index: true
    },

    // Student who took the test
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
      index: true
    },

    // Organization that owns the result (null for creator/public tests)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },

    // Total questions in the test
    totalQuestions: {
      type: Number,
      default: 0
    },

    // Correct answers count
    correctAnswers: {
      type: Number,
      default: 0
    },

    // Wrong answers count
    wrongAnswers: {
      type: Number,
      default: 0
    },

    // Unanswered questions count
    unanswered: {
      type: Number,
      default: 0
    },

    // Maximum possible marks
    totalMarks: {
      type: Number,
      default: 0
    },

    // Marks scored (with negative deductions applied)
    score: {
      type: Number,
      default: 0
    },

    // Final percentage
    percentage: {
      type: Number,
      default: 0
    },

    // Boolean pass status
    passed: {
      type: Boolean,
      default: false
    },

    // Passing percentage threshold configured for this evaluation
    passingPercentage: {
      type: Number,
      default: 40
    },

    // Pass or fail string for backward compatibility
    result: {
      type: String,
      enum: ["pass", "fail"],
      default: "fail"
    },

    // Time taken in seconds
    timeTaken: {
      type: Number,
      default: 0
    },

    // Detailed question-by-question breakdown for review
    questionBreakdown: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question"
        },
        questionText: String,
        options: mongoose.Schema.Types.Mixed,
        selectedAnswer: String,
        yourAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        isUnanswered: Boolean,
        status: {
          type: String,
          enum: ["correct", "incorrect", "unanswered"],
          default: "unanswered"
        },
        marksAwarded: Number,
        marksObtained: Number,
        explanation: String
      }
    ],

    // Evaluation timestamp
    evaluatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
resultSchema.index({ testId: 1, studentId: 1 });
resultSchema.index({ organizationId: 1, createdAt: -1 });

// Create Result model
const Result = mongoose.model("Result", resultSchema);

// Export Result model
export default Result;