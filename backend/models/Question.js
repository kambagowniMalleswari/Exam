// Import Mongoose
import mongoose from "mongoose";

// Question schema
const questionSchema = new mongoose.Schema(
  {
    // Question text
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true
    },

    // Test that this question belongs to
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: [true, "Test ID is required"],
      index: true
    },

    // Organization that owns this question (null for individual creators)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true
    },

    // Multiple-choice options: array of { key: 'A', text: '...' } or array of strings
    options: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Options are required"],
      validate: {
        validator: (opts) => Array.isArray(opts) && opts.length >= 2,
        message: "At least 2 options are required"
      }
    },

    // Correct answer matching the option text or key
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      trim: true
    },

    // Marks awarded for correct answer
    marks: {
      type: Number,
      default: 1,
      min: [1, "Marks must be at least 1"]
    },

    // Negative marks deducted for wrong answer
    negativeMarks: {
      type: Number,
      default: 0,
      min: [0, "Negative marks cannot be less than 0"]
    },

    // Display order in test
    order: {
      type: Number,
      default: 1
    },

    // Explanation for the answer
    explanation: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index
questionSchema.index({ testId: 1, order: 1 });

// Create Question model
const Question = mongoose.model("Question", questionSchema);

// Export Question model
export default Question;