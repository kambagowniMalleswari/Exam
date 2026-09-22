import mongoose from "mongoose";
import dotenv from "dotenv";
import generateToken from "../utils/generateToken.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function testEndpoints() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const user = await db.collection("users").findOne({ email: "nidigantiharipriya@gmail.com" });
  console.log("Found user:", user);

  const teacherApps = await db.collection("teacherapplications").find({ email: "nidigantiharipriya@gmail.com" }).toArray();
  console.log("Teacher Applications:", teacherApps);

  const orgApps = await db.collection("orgapplications").find({}).toArray();
  console.log("All Org Applications count:", orgApps.length);
  for (const o of orgApps) {
    console.log(`OrgApp: ${o.name} (${o.email}) - status: ${o.status}`);
  }

  const token = generateToken(user);

  const endpoints = [
    { method: "GET", url: "http://localhost:5000/api/batches" },
    { method: "GET", url: "http://localhost:5000/api/tests" },
    { method: "GET", url: "http://localhost:5000/api/users?role=student" },
    { method: "GET", url: "http://localhost:5000/api/reports/teacher" },
    { method: "GET", url: "http://localhost:5000/api/results/teacher" },
    { method: "GET", url: "http://localhost:5000/api/batches/available" }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json().catch(() => ({}));
      console.log(`${ep.method} ${ep.url} -> Status: ${res.status}`, data.message || (data.success !== undefined ? `success: ${data.success}` : ""));
    } catch (err) {
      console.log(`${ep.method} ${ep.url} -> ERROR:`, err.message);
    }
  }

  await mongoose.disconnect();
}

testEndpoints().catch(console.error);
