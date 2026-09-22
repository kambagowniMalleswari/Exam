import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function run() {
  try {
    console.log("Connecting to Mongo:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to Mongo.");

    const db = mongoose.connection.db;
    const usersCol = db.collection("users");
    const orgsCol = db.collection("organizations");

    const emails = ["nanisree65@gmail.com", "kambagownikmalleswari@gmail.com"];

    for (const email of emails) {
      console.log(`\n================ Checking: ${email} ================`);
      const user = await usersCol.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log("❌ User NOT found in database!");
        // Check if there is an application in orgApplications or teacherApplications
        const orgApp = await db.collection("orgapplications").findOne({ email: email.toLowerCase() });
        if (orgApp) {
          console.log("Found in orgapplications:", {
            status: orgApp.status,
            orgName: orgApp.orgName,
            reviewedAt: orgApp.reviewedAt
          });
        }
        const teacherApp = await db.collection("teacherapplications").findOne({ email: email.toLowerCase() });
        if (teacherApp) {
          console.log("Found in teacherapplications:", {
            status: teacherApp.status,
            subject: teacherApp.subject
          });
        }
      } else {
        console.log("✓ User found:");
        console.log({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isActive: user.isActive,
          organizationId: user.organizationId
        });

        if (user.organizationId) {
          const org = await orgsCol.findOne({ _id: user.organizationId });
          console.log("Organization details:", org ? {
            _id: org._id,
            name: org.name,
            slug: org.slug,
            status: org.status,
            isActive: org.isActive
          } : "NOT FOUND");
        }

        const testPass = email === "nanisree65@gmail.com" ? "OrgAdmin#85ppaz!" : "Admin@12345";
        const isMatch = await bcrypt.compare(testPass, user.password);
        console.log(`Password comparison with "${testPass}": ${isMatch ? "✅ MATCH" : "❌ MISMATCH"}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
