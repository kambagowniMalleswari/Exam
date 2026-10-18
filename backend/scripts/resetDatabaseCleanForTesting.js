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
  console.error("FATAL: MONGO_URI is missing from environment.");
  process.exit(1);
}

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "kambagownikmalleswari@gmail.com").toLowerCase().trim();

async function resetCleanDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully to database:", mongoose.connection.name);

    const db = mongoose.connection.db;

    // 1. Wipe all collections with dummy data (applications, organizations, batches, tests, questions, attempts, results, subscriptions)
    const collectionsToClear = [
      "organizations",
      "orgapplications",
      "teacherapplications",
      "batches",
      "batchallocationaudits",
      "tests",
      "questions",
      "attempts",
      "results",
      "subscriptions"
    ];

    console.log("\n=======================================================");
    console.log("STEP 1: PURGING ALL DUMMY DATA COLLECTIONS");
    console.log("=======================================================");

    for (const col of collectionsToClear) {
      try {
        const result = await db.collection(col).deleteMany({});
        console.log(`[CLEARED] Collection '${col}': deleted ${result.deletedCount} documents.`);
      } catch (err) {
        console.warn(`[SKIP] Collection '${col}' error:`, err.message);
      }
    }

    console.log("\n=======================================================");
    console.log("STEP 2: PURGING ALL DUMMY USERS (KEEPING ONLY SUPER ADMIN)");
    console.log("=======================================================");

    // Delete all users EXCEPT the primary Super Admin
    const userDeleteResult = await db.collection("users").deleteMany({
      email: { $ne: SUPER_ADMIN_EMAIL }
    });
    console.log(`[CLEARED] Deleted ${userDeleteResult.deletedCount} dummy/test user accounts.`);

    // 3. Ensure the primary Super Admin is perfectly configured and active
    console.log("\n=======================================================");
    console.log("STEP 3: VERIFYING SUPER ADMIN CREDENTIALS");
    console.log("=======================================================");

    let superAdmin = await db.collection("users").findOne({ email: SUPER_ADMIN_EMAIL });

    if (!superAdmin) {
      console.log(`Super admin ${SUPER_ADMIN_EMAIL} was not found. Creating fresh super admin account...`);
      const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@145";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newAdmin = {
        name: "Kambagouni Malleswari",
        email: SUPER_ADMIN_EMAIL,
        phone: "9876543210",
        password: hashedPassword,
        role: "super_admin",
        organizationId: null,
        batchId: null,
        batchIds: [],
        avatar: "",
        status: "active",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const res = await db.collection("users").insertOne(newAdmin);
      superAdmin = await db.collection("users").findOne({ _id: res.insertedId });
      console.log(`Created Super Admin account with ID: ${res.insertedId}`);
    } else {
      console.log(`Found existing Super Admin account for: ${SUPER_ADMIN_EMAIL}`);
      // Clean any organization or batch associations from super admin
      await db.collection("users").updateOne(
        { _id: superAdmin._id },
        {
          $set: {
            role: "super_admin",
            organizationId: null,
            batchId: null,
            batchIds: [],
            status: "active",
            isActive: true,
            resetPasswordOtp: null,
            resetPasswordOtpExpires: null,
            updatedAt: new Date()
          }
        }
      );
      console.log("Sanitized Super Admin account (isolated from any org/batch, status verified active).");
    }

    // Check which passwords match the existing hash
    const match12345 = await bcrypt.compare("Admin@12345", superAdmin.password);
    const match145 = await bcrypt.compare("Admin@145", superAdmin.password);

    console.log("\nPassword Check Results:");
    console.log("Matches 'Admin@12345':", match12345);
    console.log("Matches 'Admin@145':", match145);

    // If neither matches (or if password needs to be guaranteed), let's ensure the user can log in with their intended password
    let activePassword = "Unknown";
    if (match12345) {
      activePassword = "Admin@12345";
    } else if (match145) {
      activePassword = "Admin@145";
    } else {
      // Set to process.env.SUPER_ADMIN_PASSWORD or Admin@145
      const newPass = process.env.SUPER_ADMIN_PASSWORD || "Admin@145";
      const newHash = await bcrypt.hash(newPass, 10);
      await db.collection("users").updateOne({ _id: superAdmin._id }, { $set: { password: newHash } });
      activePassword = newPass;
      console.log(`Reset Super Admin password to: ${newPass}`);
    }

    console.log("\n=======================================================");
    console.log("FINAL DATABASE VERIFICATION REPORT");
    console.log("=======================================================");
    const collections = await db.listCollections().toArray();
    let totalDocsInDB = 0;
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      totalDocsInDB += count;
      console.log(`Collection: ${c.name.padEnd(25)} -> ${count} document(s)`);
    }

    const remainingUsers = await db.collection("users").find({}).toArray();
    console.log("\nRemaining Users in Database:");
    console.log(JSON.stringify(remainingUsers.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isActive: u.isActive
    })), null, 2));

    console.log("\n[SUCCESS] The database has been completely purged of all dummy records!");
    console.log(`[INFO] Super Admin Login Email:    ${SUPER_ADMIN_EMAIL}`);
    console.log(`[INFO] Super Admin Verified Pass:  ${activePassword}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error during resetCleanDatabase:", error);
    process.exit(1);
  }
}

resetCleanDatabase();
