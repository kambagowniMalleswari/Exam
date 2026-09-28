// Import required packages
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";

// Import MongoDB connection
import connectDB from "./config/db.js";
import initSuperAdmin from "./config/initSuperAdmin.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import teacherApplicationRoutes from "./routes/teacherApplicationRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import orgApplicationRoutes from "./routes/orgApplicationRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";

// Import error middleware
import errorMiddleware from "./middleware/errorMiddleware.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables reliably from backend and process cwd
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

// Create Express application
const app = express();

// Connect to MongoDB and initialize defaults
connectDB().then(() => {
  initSuperAdmin();
});

// Enable high-speed gzip response compression
app.use(compression());

// Enable frontend-backend communication
app.use(cors({
  exposedHeaders: ["x-new-token"]
}));


// Allow JSON request data
app.use(express.json());

// Root API route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Multi-Tenant MCQ Test Portal API is running"
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Organization routes
app.use("/api/organizations", organizationRoutes);

// User routes
app.use("/api/users", userRoutes);

// Test routes
app.use("/api/tests", testRoutes);

// Question routes
app.use("/api/questions", questionRoutes);

// Attempt routes
app.use("/api/attempts", attemptRoutes);

// Result routes
app.use("/api/results", resultRoutes);

// Report routes
app.use("/api/reports", reportRoutes);

// Subscription routes
app.use("/api/subscriptions", subscriptionRoutes);

// Teacher Application routes
app.use("/api/teacher-applications", teacherApplicationRoutes);

// Organization Application routes
app.use("/api/org-applications", orgApplicationRoutes);

// Batch Management routes
app.use("/api/batches", batchRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Server port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;