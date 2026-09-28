import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const apps = await mongoose.connection.db.collection("orgapplications").find().toArray();
  console.log("All Org Applications:");
  for (const a of apps) {
    console.log({
      id: a._id,
      name: a.name,
      adminName: a.adminName,
      email: a.email,
      status: a.status,
      reviewedAt: a.reviewedAt,
      reviewedBy: a.reviewedBy,
      createdOrganizationId: a.createdOrganizationId,
      createdAdminUserId: a.createdAdminUserId
    });
  }

  const users = await mongoose.connection.db.collection("users").find({
    role: { $in: ["org_admin", "admin"] }
  }).toArray();
  console.log("\nAll Org Admin Users in DB:");
  for (const u of users) {
    console.log({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      organizationId: u.organizationId,
      status: u.status,
      isActive: u.isActive
    });
  }

  const orgs = await mongoose.connection.db.collection("organizations").find().toArray();
  console.log("\nAll Organizations in DB:");
  for (const o of orgs) {
    console.log({
      id: o._id,
      name: o.name,
      slug: o.slug,
      email: o.email,
      adminName: o.adminName,
      status: o.status,
      isActive: o.isActive
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
