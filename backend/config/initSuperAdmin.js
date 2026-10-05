// Auto-initialization and Strict Enforcement of Platform Super Admin
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const initSuperAdmin = async () => {
  try {
    const authorizedSuperEmail = (process.env.SUPER_ADMIN_EMAIL || "kambagownikmalleswari@gmail.com").toLowerCase().trim();
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@145";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 1. Maintain the ONLY authorized Super Admin
    const superAdmin = await User.findOne({ email: authorizedSuperEmail });
    if (superAdmin) {
      superAdmin.role = "super_admin";
      superAdmin.organizationId = null;
      superAdmin.status = "active";
      superAdmin.isActive = true;
      if (!superAdmin.password) {
        superAdmin.password = hashedPassword;
      }
      await superAdmin.save();
      console.log(`[Super Admin] Verified & synchronized primary Super Admin: ${authorizedSuperEmail}`);
    } else {
      await User.create({
        name: "Malleswari (Super Admin)",
        email: authorizedSuperEmail,
        phone: "9876543210",
        password: hashedPassword,
        role: "super_admin",
        organizationId: null,
        status: "active",
        isActive: true
      });
      console.log(`[Super Admin] Created primary Super Admin: ${authorizedSuperEmail}`);
    }

    // 2. Strictly ensure NO other account possesses the super_admin role
    await User.updateMany(
      { email: { $ne: authorizedSuperEmail }, role: { $in: ["super_admin", "superadmin"] } },
      { $set: { role: "student" } }
    );
  } catch (error) {
    console.error("[Super Admin Init Warning]:", error.message);
  }
};

export default initSuperAdmin;

