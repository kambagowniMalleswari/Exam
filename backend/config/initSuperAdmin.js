// Auto-initialization and Strict Enforcement of Platform Super Admin
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const initSuperAdmin = async () => {
  try {
    const adminEmails = [
      (process.env.SUPER_ADMIN_EMAIL || "kambagownikmalleswari@gmail.com").toLowerCase().trim(),
      "madhusujan593@gmail.com"
    ];
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@12345";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    for (const email of adminEmails) {
      if (!email) continue;
      const superAdmin = await User.findOne({ email });

      if (superAdmin) {
        superAdmin.role = "super_admin";
        superAdmin.organizationId = null;
        superAdmin.status = "active";
        superAdmin.isActive = true;
        // Don't overwrite existing working password if already set, but ensure active role
        if (!superAdmin.password) {
          superAdmin.password = hashedPassword;
        }
        await superAdmin.save();
        console.log(`[Super Admin] Verified & synchronized Super Admin: ${email}`);
      } else {
        await User.create({
          name: email.includes("madhusujan") ? "Madhusujan (Super Admin)" : "Malleswari (Super Admin)",
          email,
          phone: "9876543210",
          password: hashedPassword,
          role: "super_admin",
          organizationId: null,
          status: "active",
          isActive: true
        });
        console.log(`[Super Admin] Created Super Admin: ${email}`);
      }
    }
  } catch (error) {
    console.error("[Super Admin Init Warning]:", error.message);
  }
};

export default initSuperAdmin;

