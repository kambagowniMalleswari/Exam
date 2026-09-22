import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function restore() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("Admin@12345", salt);

  await db.collection("users").updateOne(
    { email: "kambagownikmalleswari@gmail.com" },
    {
      $set: {
        role: "super_admin",
        password: hash,
        status: "active",
        isActive: true
      }
    }
  );

  console.log("Super Admin restored successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

restore().catch(console.error);
