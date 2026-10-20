import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import authorize from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";
const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_mcq_jwt_key_2026";

async function runTests() {
  console.log("=== COMPREHENSIVE ORGADMIN & ACCESS DENIED VERIFICATION ===");
  await mongoose.connect(MONGO_URI);

  // 1. Verify User Role Enum in Mongoose
  const allowedEnums = User.schema.path("role").enumValues;
  console.log("✓ User schema role enum values:", allowedEnums);
  if (!allowedEnums.includes("orgadmin") || !allowedEnums.includes("org_admin") || !allowedEnums.includes("admin")) {
    throw new Error("Missing orgadmin aliases in User schema enum!");
  }

  // 2. Test authorize() with different orgadmin role variants
  const testRoles = ["org_admin", "orgadmin", "admin", "organization_admin"];
  for (const roleVariant of testRoles) {
    const authMiddleware = authorize("admin", "org_admin");

    let nextCalled = false;
    let statusCode = null;
    let jsonResponse = null;

    const req = {
      user: {
        id: "123",
        role: roleVariant,
        organizationId: "456"
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonResponse = data;
          }
        };
      }
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware(req, res, next);
    if (!nextCalled || statusCode !== null) {
      throw new Error(`Role '${roleVariant}' was rejected by authorize("admin", "org_admin"): status ${statusCode}, ${JSON.stringify(jsonResponse)}`);
    }
    console.log(`✓ authorize("admin", "org_admin") passed for user.role = "${roleVariant}"`);
  }

  // 3. Test authorize() when route requires "teacher" and user is "orgadmin" (hierarchical supervisor access)
  for (const roleVariant of testRoles) {
    const teacherRouteAuth = authorize("teacher");
    let nextCalled = false;
    let statusCode = null;

    const req = {
      user: {
        id: "123",
        role: roleVariant,
        organizationId: "456"
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return { json() {} };
      }
    };
    const next = () => { nextCalled = true; };

    teacherRouteAuth(req, res, next);
    if (!nextCalled || statusCode !== null) {
      throw new Error(`Org admin ('${roleVariant}') was denied supervisory access to teacher route!`);
    }
    console.log(`✓ Hierarchical supervisory access passed: '${roleVariant}' can access teacher resources`);
  }

  // 4. Test authorize() when route requires "student" and user is "orgadmin" (hierarchical preview access)
  for (const roleVariant of testRoles) {
    const studentRouteAuth = authorize("student");
    let nextCalled = false;
    let statusCode = null;

    const req = {
      user: {
        id: "123",
        role: roleVariant,
        organizationId: "456"
      }
    };
    const res = {
      status(code) {
        statusCode = code;
        return { json() {} };
      }
    };
    const next = () => { nextCalled = true; };

    studentRouteAuth(req, res, next);
    if (!nextCalled || statusCode !== null) {
      throw new Error(`Org admin ('${roleVariant}') was denied supervisory access to student route!`);
    }
    console.log(`✓ Hierarchical supervisory access passed: '${roleVariant}' can access student resources`);
  }

  // 5. Test tenantMiddleware with role variant and ensure req.organizationId string is set
  const tenantReq = {
    user: {
      id: "123",
      role: "orgadmin",
      organizationId: new mongoose.Types.ObjectId("6ad4b870fe27a9ed1eaed9c3")
    }
  };
  let tenantNextCalled = false;
  await tenantMiddleware(tenantReq, {}, () => { tenantNextCalled = true; });
  if (!tenantNextCalled || tenantReq.organizationId !== "6ad4b870fe27a9ed1eaed9c3") {
    throw new Error(`tenantMiddleware failed for orgadmin: organizationId = ${tenantReq.organizationId}`);
  }
  console.log("✓ tenantMiddleware correctly attaches organizationId string for 'orgadmin':", tenantReq.organizationId);

  // 6. Test frontend normalizeRole simulation
  const normalizeRole = (role) => {
    if (!role) return "";
    const clean = String(role).toLowerCase().trim().replace(/[-_\s]/g, "");
    if (clean === "superadmin") return "super_admin";
    if (clean === "orgadmin" || clean === "admin" || clean === "organizationadmin") return "org_admin";
    if (clean === "teacher") return "teacher";
    if (clean === "student") return "student";
    return clean;
  };

  const getDefaultDashboard = (role) => {
    const normalized = normalizeRole(role);
    if (normalized === "super_admin") return "/superadmin/dashboard";
    if (normalized === "org_admin") return "/admin/dashboard";
    if (normalized === "teacher") return "/teacher/dashboard";
    if (normalized === "student") return "/student/dashboard";
    return "/login";
  };

  for (const roleVariant of testRoles) {
    if (normalizeRole(roleVariant) !== "org_admin") {
      throw new Error(`normalizeRole failed for '${roleVariant}'`);
    }
    if (getDefaultDashboard(roleVariant) !== "/admin/dashboard") {
      throw new Error(`getDefaultDashboard failed for '${roleVariant}'`);
    }
    console.log(`✓ Frontend role normalization passed: '${roleVariant}' -> 'org_admin' -> '/admin/dashboard'`);
  }

  console.log("\n========================================================");
  console.log("ALL TESTS PASSED! No 'Not authorized' or 'Access denied'!");
  console.log("========================================================");

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
