import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const superAdmin = await db.collection("users").findOne({ email: "kambagownikmalleswari@gmail.com" });
  console.log("Super Admin Record:", {
    email: superAdmin.email,
    passwordPrefix: superAdmin.password ? superAdmin.password.substring(0, 15) : "none"
  });

  console.log("Matches Admin@12345:", await bcrypt.compare("Admin@12345", superAdmin.password));
  console.log("Matches Admin@1234:", await bcrypt.compare("Admin@1234", superAdmin.password));

  // If it doesn't match Admin@12345, update it to Admin@12345
  if (!(await bcrypt.compare("Admin@12345", superAdmin.password))) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Admin@12345", salt);
    await db.collection("users").updateOne(
      { email: "kambagownikmalleswari@gmail.com" },
      { $set: { password: hash } }
    );
    console.log("Reset password to Admin@12345");
  }

  // Also check nanisree65@gmail.com
  const nani = await db.collection("users").findOne({ email: "nanisree65@gmail.com" });
  console.log("Nani Record:", {
    email: nani.email,
    role: nani.role,
    passwordPrefix: nani.password ? nani.password.substring(0, 15) : "none"
  });
  console.log("Nani Matches OrgAdmin#85ppaz!:", await bcrypt.compare("OrgAdmin#85ppaz!", nani.password));
  if (!(await bcrypt.compare("OrgAdmin#85ppaz!", nani.password))) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("OrgAdmin#85ppaz!", salt);
    await db.collection("users").updateOne(
      { email: "nanisree65@gmail.com" },
      { $set: { password: hash, role: "org_admin" } }
    );
    console.log("Reset Nani password to OrgAdmin#85ppaz!");
  }

  // Now test both logins via fetch
  console.log("\nTesting login for nanisree65@gmail.com via fetch...");
  const naniRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nanisree65@gmail.com", password: "OrgAdmin#85ppaz!" })
  });
  console.log("Nani status:", naniRes.status, await naniRes.json());

  console.log("\nTesting login for kambagownikmalleswari@gmail.com via fetch...");
  const superRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "kambagownikmalleswari@gmail.com", password: "Admin@12345" })
  });
  console.log("SuperAdmin status:", superRes.status, await superRes.json());

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(console.error);
