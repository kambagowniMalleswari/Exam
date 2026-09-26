// Reset all users data and seed the single authorized Super Admin
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not set in environment.");
  process.exit(1);
}

const resetUsersAndSeedSuperAdmin = async () => {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    // 1. Delete all users from the users collection
    const deleteUsersResult = await db.collection("users").deleteMany({});
    console.log(`Deleted ${deleteUsersResult.deletedCount} users from database.`);

    // 2. Also remove attempts and results to maintain relational integrity
    const deleteAttemptsResult = await db.collection("attempts").deleteMany({});
    console.log(`Cleared ${deleteAttemptsResult.deletedCount} past test attempts.`);

    const deleteResultsResult = await db.collection("results").deleteMany({});
    console.log(`Cleared ${deleteResultsResult.deletedCount} past test results.`);

    // 3. Clear old pending/approved applications to allow fresh registration without email conflicts
    const deleteOrgApps = await db.collection("orgapplications").deleteMany({});
    console.log(`Cleared ${deleteOrgApps.deletedCount} organization applications.`);

    const deleteTeacherApps = await db.collection("teacherapplications").deleteMany({});
    console.log(`Cleared ${deleteTeacherApps.deletedCount} teacher applications.`);

    // 4. Create the ONLY authorized Super Admin
    const superAdminEmail = "kambagownikmalleswari@gmail.com";
    const superAdminPlainPassword = "Admin@12345";
    const hashedPassword = await bcrypt.hash(superAdminPlainPassword, 10);

    const superAdminDoc = {
      name: "Malleswari (Super Admin)",
      email: superAdminEmail,
      phone: "9876543210",
      password: hashedPassword,
      role: "super_admin",
      organizationId: null,
      status: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.collection("users").insertOne(superAdminDoc);
    console.log(`Successfully created Super Admin (${superAdminEmail}) with ID: ${insertResult.insertedId}`);

    // 5. Ensure unique index on email
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("Verified unique index on users.email.");

    // 6. Test password comparison to guarantee correctness
    const createdAdmin = await db.collection("users").findOne({ email: superAdminEmail });
    const isPasswordCorrect = await bcrypt.compare(superAdminPlainPassword, createdAdmin.password);
    console.log(`Verification - Password 'Admin@12345' match: ${isPasswordCorrect}`);

    await mongoose.disconnect();
    console.log("Database reset and Super Admin seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during database reset:", error);
    process.exit(1);
  }
};

resetUsersAndSeedSuperAdmin();
