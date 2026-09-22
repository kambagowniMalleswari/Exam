import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function investigate() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  console.log("=== CHECKING ALL USERS ===");
  const users = await db.collection("users").find({}).toArray();
  for (const u of users) {
    const is85ppaz = await bcrypt.compare("OrgAdmin#85ppaz!", u.password);
    console.log(`User: ${u.email} | Name: ${u.name} | Role: ${u.role} | Org: ${u.organizationId} | Matches 85ppaz: ${is85ppaz}`);
  }

  console.log("\n=== Org 'vms' details ===");
  const vmsOrg = await db.collection("organizations").findOne({ slug: "vms" });
  console.log("VMS org:", vmsOrg);

  await mongoose.disconnect();
  process.exit(0);
}

investigate().catch(console.error);
