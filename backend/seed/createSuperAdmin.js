// Import required packages
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Import User model
import User from "../models/User.js";

// Load environment variables
dotenv.config();

// Create Super Admin
const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // Check existing Super Admin
    let admin = await User.findOne({
      email: "kambagownikmalleswari@gmail.com"
    });

    const hashedPassword = await bcrypt.hash("Admin@1234", 10);

    if (admin) {
      admin.role = "super_admin";
      admin.password = hashedPassword;
      admin.status = "active";
      admin.isActive = true;
      await admin.save();
      console.log("Super Admin updated successfully");
      process.exit(0);
    }

    // Create Super Admin
    await User.create({
      name: "Malleswari (Super Admin)",
      email: "kambagownikmalleswari@gmail.com",
      phone: "9876543210",
      password: hashedPassword,
      role: "super_admin",
      organizationId: null,
      status: "active",
      isActive: true
    });

    console.log("Super Admin created successfully");

    // Close database connection
    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);

    await mongoose.connection.close();

    process.exit(1);
  }
};

// Run function
createSuperAdmin();