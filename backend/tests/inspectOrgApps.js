import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  const OrgApp = mongoose.model("OrgApplication", new mongoose.Schema({}, { strict: false }));
  const apps = await OrgApp.find({});
  console.log("=== ORG APPLICATIONS IN DB ===");
  console.log("Count:", apps.length);
  for (const a of apps) {
    console.log(JSON.stringify({
      _id: a._id,
      name: a.name,
      adminName: a.adminName,
      email: a.email,
      status: a.status,
      createdAt: a.createdAt
    }, null, 2));
  }

  // Also check Organizations
  const Org = mongoose.model("Organization", new mongoose.Schema({}, { strict: false }));
  const orgs = await Org.find({});
  console.log("=== ORGANIZATIONS IN DB ===");
  console.log("Count:", orgs.length);
  for (const o of orgs) {
    console.log(JSON.stringify({
      _id: o._id,
      name: o.name,
      slug: o.slug,
      email: o.email
    }, null, 2));
  }

  // Also check Users with role super_admin or org_admin
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const admins = await User.find({ role: { $in: ["super_admin", "org_admin"] } }, { password: 0 });
  console.log("=== ADMIN USERS IN DB ===");
  for (const u of admins) {
    console.log(JSON.stringify({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      organizationId: u.organizationId
    }, null, 2));
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
