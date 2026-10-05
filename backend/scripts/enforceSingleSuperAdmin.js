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

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB Atlas");

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  // 1. List all current super admins
  const superAdmins = await usersCollection.find({ role: { $in: ["super_admin", "superadmin"] } }).toArray();
  console.log("Current super admins in DB:", superAdmins.map(u => ({ email: u.email, role: u.role, name: u.name })));

  // 2. Hash Admin@145
  const newHashedPassword = await bcrypt.hash("Admin@145", 10);

  // 3. Update or create kambagownikmalleswari@gmail.com with Admin@145
  const superEmail = "kambagownikmalleswari@gmail.com";
  const updateRes = await usersCollection.updateOne(
    { email: superEmail },
    {
      $set: {
        role: "super_admin",
        password: newHashedPassword,
        name: "Malleswari (Super Admin)",
        organizationId: null,
        status: "active",
        isActive: true,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log(`Updated ${superEmail}: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}, upserted ${updateRes.upsertedCount}`);

  // 4. Find madhusujan593@gmail.com and strip super_admin role (or delete)
  const madhuUser = await usersCollection.findOne({ email: "madhusujan593@gmail.com" });
  if (madhuUser) {
    console.log("Found madhusujan593@gmail.com with role:", madhuUser.role);
    // Demote to student and deactivate or delete
    const demoteRes = await usersCollection.updateOne(
      { email: "madhusujan593@gmail.com" },
      { $set: { role: "student" } }
    );
    console.log("Demoted madhusujan593@gmail.com to student:", demoteRes.modifiedCount);
  }

  // 5. Ensure NO OTHER user in the database has super_admin role
  const demoteOthers = await usersCollection.updateMany(
    { email: { $ne: superEmail }, role: { $in: ["super_admin", "superadmin"] } },
    { $set: { role: "student" } }
  );
  console.log("Demoted any other super_admins to student:", demoteOthers.modifiedCount);

  // 6. Verify final super admins in DB
  const finalSuperAdmins = await usersCollection.find({ role: { $in: ["super_admin", "superadmin"] } }).toArray();
  console.log("Final super admins in DB (should be ONLY 1):", finalSuperAdmins.map(u => ({ email: u.email, role: u.role, name: u.name })));

  // 7. Verify password comparison for Admin@145
  const verifiedUser = await usersCollection.findOne({ email: superEmail });
  const isMatch145 = await bcrypt.compare("Admin@145", verifiedUser.password);
  const isMatchOld = await bcrypt.compare("Admin@12345", verifiedUser.password);
  console.log("Verify Admin@145 matches:", isMatch145);
  console.log("Verify old Admin@12345 fails:", isMatchOld === false);

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
