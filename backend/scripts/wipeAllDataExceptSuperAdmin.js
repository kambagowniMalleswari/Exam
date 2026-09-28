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
  console.error("Error: MONGO_URI is not defined.");
  process.exit(1);
}

const wipeAllDataExceptSuperAdmin = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    // Collections to completely wipe
    const collectionsToClear = [
      "organizations",
      "orgapplications",
      "teacherapplications",
      "batches",
      "questions",
      "tests",
      "attempts",
      "results",
      "subscriptions"
    ];

    console.log("\n--- WIPING DATA COLLECTIONS ---");
    for (const colName of collectionsToClear) {
      try {
        const result = await db.collection(colName).deleteMany({});
        console.log(`Cleared collection '${colName}': deleted ${result.deletedCount} items.`);
      } catch (err) {
        console.warn(`Could not clear '${colName}': ${err.message}`);
      }
    }

    // Clear all users
    console.log("\n--- WIPING USERS COLLECTION ---");
    const userDelResult = await db.collection("users").deleteMany({});
    console.log(`Deleted ${userDelResult.deletedCount} users.`);

    // Create the ONLY authorized Super Admin
    console.log("\n--- SEEDING SINGLE SUPER ADMIN ---");
    const superAdminEmail = "kambagownikmalleswari@gmail.com";
    const superAdminPassword = "Admin@12345";
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdminDoc = {
      name: "Kambagouni Malleswari",
      email: superAdminEmail.toLowerCase().trim(),
      phone: "9876543210",
      password: hashedPassword,
      role: "super_admin",
      organizationId: null,
      avatar: "",
      status: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.collection("users").insertOne(superAdminDoc);
    console.log(`Created Super Admin (${superAdminEmail}) with _id: ${insertResult.insertedId}`);

    // Ensure unique email index
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("Ensured unique index on users.email");

    // Verify Super Admin login capability
    const admin = await db.collection("users").findOne({ email: superAdminEmail });
    const match = await bcrypt.compare(superAdminPassword, admin.password);
    console.log(`Verification: Super Admin password matches 'Admin@12345': ${match}`);

    // Verification of all collections in database
    console.log("\n--- FINAL DATABASE STATE ---");
    const allCols = await db.listCollections().toArray();
    for (const c of allCols) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`Collection: ${c.name} -> ${count} document(s)`);
    }

    await mongoose.disconnect();
    console.log("\nDatabase cleanup complete! Only the requested Super Admin remains.");
    process.exit(0);
  } catch (error) {
    console.error("Error during database wipe:", error);
    process.exit(1);
  }
};

wipeAllDataExceptSuperAdmin();
