import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

async function run() {
  console.log("=== 1. CHECKING MONGO CONNECTION & USERS ===");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully");

  const users = await mongoose.connection.db.collection("users").find({
    role: "super_admin"
  }).toArray();

  console.log(`Found ${users.length} super_admin user(s):`);
  for (const u of users) {
    console.log({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      status: u.status
    });
    const match = await bcrypt.compare("Admin@12345", u.password || "");
    console.log(`  Password 'Admin@12345' match: ${match}`);
  }

  // Also check if any user exists with email or name starting with 'kambagown'
  const kamUsers = await mongoose.connection.db.collection("users").find({
    email: { $regex: "kambagown", $options: "i" }
  }).toArray();
  console.log(`Found ${kamUsers.length} user(s) matching 'kambagown':`);
  for (const u of kamUsers) {
    console.log({
      id: u._id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      status: u.status
    });
  }

  console.log("\n=== 2. CHECKING EMAIL / NODEMAILER CONFIG ===");
  const emailUser = process.env.EMAIL_USER;
  const emailPass = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "");
  console.log("EMAIL_USER:", emailUser);
  console.log("EMAIL_PASSWORD length:", emailPass.length, "chars");
  console.log("EMAIL_PASSWORD (no spaces):", emailPass);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  console.log("Verifying Nodemailer SMTP transport...");
  try {
    await transporter.verify();
    console.log("✓ Transporter verification SUCCESSFUL! Gmail credentials are valid.");
  } catch (err) {
    console.error("✗ Transporter verification FAILED:", err.message);
    if (err.response) console.error("  SMTP response:", err.response);
  }

  console.log("\n=== 3. CHECKING ORG APPLICATIONS ===");
  const orgApps = await mongoose.connection.db.collection("orgapplications").find().toArray();
  console.log(`Total org applications in DB: ${orgApps.length}`);
  for (const app of orgApps) {
    console.log({
      id: app._id,
      name: app.name,
      email: app.email,
      status: app.status
    });
  }

  await mongoose.disconnect();
  console.log("\nDiagnostic finished.");
}

run().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
