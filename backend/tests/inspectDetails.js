import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function check() {
  try {
    console.log("Starting DB connection to:", MONGO_URI);
    const conn = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully!");
    const db = conn.connection.db;

    console.log("=== CHECKING kambagownikmalleswari@gmail.com ===");
    const superAdmin = await db.collection("users").findOne({ email: "kambagownikmalleswari@gmail.com" });
    if (superAdmin) {
      console.log("User role:", superAdmin.role);
      console.log("Compare Admin@1234:", await bcrypt.compare("Admin@1234", superAdmin.password));
      console.log("Compare Admin@12345:", await bcrypt.compare("Admin@12345", superAdmin.password));
    }

    console.log("\n=== CHECKING nanisree65@gmail.com ===");
    const naniUser = await db.collection("users").findOne({ email: "nanisree65@gmail.com" });
    if (naniUser) {
      console.log("Found user:", {
        id: naniUser._id,
        name: naniUser.name,
        email: naniUser.email,
        role: naniUser.role,
        organizationId: naniUser.organizationId
      });
      console.log("Compare OrgAdmin#85ppaz!:", await bcrypt.compare("OrgAdmin#85ppaz!", naniUser.password));
      console.log("Compare password123:", await bcrypt.compare("password123", naniUser.password));
      console.log("Compare Admin@1234:", await bcrypt.compare("Admin@1234", naniUser.password));
    } else {
      console.log("nanisree65@gmail.com NOT found in users collection.");
    }

    console.log("\n=== CHECKING OrgApplications ===");
    const orgApps = await db.collection("orgapplications").find({}).toArray();
    console.log("Total Org Applications:", orgApps.length);
    orgApps.forEach(app => {
      console.log("OrgApp:", {
        id: app._id,
        orgName: app.orgName,
        adminName: app.adminName,
        email: app.email,
        status: app.status,
        createdAdminUserId: app.createdAdminUserId
      });
    });

    console.log("\n=== CHECKING TeacherApplications ===");
    const teacherApps = await db.collection("teacherapplications").find({}).toArray();
    console.log("Total Teacher Applications:", teacherApps.length);
    teacherApps.forEach(app => {
      console.log("TeacherApp:", {
        id: app._id,
        name: app.name,
        email: app.email,
        status: app.status,
        organizationId: app.organizationId
      });
    });

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Inspection error:", err);
    process.exit(1);
  }
}

check();
