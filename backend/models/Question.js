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

    // Question type: Multiple Choice ('mcq') or Coding ('coding')
    questionType: {
      type: String,
      enum: ["mcq", "coding"],
      default: "mcq",
      index: true
    },

    // Programming language for coding questions
    codingLanguage: {
      type: String,
      enum: ["javascript", "python", "java", "cpp", "c"],
      default: "javascript"
    },

    // Boilerplate / starter code provided to the candidate
    starterCode: {
      type: String,
      default: ""
    },

    // Test cases for automated code evaluation
    testCases: [
      {
        input: {
          type: String,
          default: ""
        },
        expectedOutput: {
          type: String,
          required: true
        },
        isSample: {
          type: Boolean,
          default: true
        },
        explanation: {
          type: String,
          default: ""
        }
      }
    ],

    // Multiple-choice options: array of { key: 'A', text: '...' } or array of strings
    options: {
      type: mongoose.Schema.Types.Mixed,
      validate: {
        validator: function (opts) {
          if (this.questionType === "coding") return true;
          return Array.isArray(opts) && opts.length >= 2;
        },
        message: "At least 2 options are required for multiple-choice questions"
      },
      default: []
    },

    // Correct answer matching the option text or key
    correctAnswer: {
      type: String,
      validate: {
        validator: function (ans) {
          if (this.questionType === "coding") return true;
          return ans && ans.trim().length > 0;
        },
        message: "Correct answer is required for multiple-choice questions"
      },
      trim: true,
      default: ""
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
    },

    // Optional section: 'General', 'Coding', 'Aptitude', 'Technical', or custom section
    section: {
      type: String,
      default: "General",
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