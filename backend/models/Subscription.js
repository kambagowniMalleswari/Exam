// Import Mongoose
import mongoose from "mongoose";

// Subscription schema
const subscriptionSchema = new mongoose.Schema(
  {
    // Organization that owns this subscription
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      unique: true,
      index: true
    },

    // Subscription plan tier
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "enterprise"],
      default: "free"
    },

    // Subscription status
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial"],
      default: "active"
    },

    // Limit on number of tests that can be created
    maxTests: {
      type: Number,
      default: 5
    },

    // Limit on number of students that can be registered
    maxStudents: {
      type: Number,
      default: 100
    },

    // Price per month/cycle
    price: {
      type: Number,
      default: 0
    },

    // Features included
    features: {
      type: [String],
      default: ["5 Tests", "100 Students", "Standard Reports"]
    },

    // Subscription start date
    startDate: {
      type: Date,
      default: Date.now
    },

    // Subscription end/renewal date
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    }
  },
  {
    timestamps: true
  }
);

// Create Subscription model
const Subscription = mongoose.model("Subscription", subscriptionSchema);

// Export Subscription model
export default Subscription;
