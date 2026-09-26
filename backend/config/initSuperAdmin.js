// Auto-initialization and Strict Enforcement of Platform Super Admin
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const initSuperAdmin = async () => {
  try {
    const adminEmail = "kambagownikmalleswari@gmail.com";
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@12345";

    // 1. Demote any other accounts that erroneously have super_admin role
    await User.updateMany(
      { email: { $ne: adminEmail }, role: "super_admin" },
      { $set: { role: "admin" } }
    );

    // 2. Hash target password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Upsert authorized Super Admin
    let superAdmin = await User.findOne({ email: adminEmail });

    if (superAdmin) {
      superAdmin.role = "super_admin";
      superAdmin.organizationId = null;
      superAdmin.status = "active";
      superAdmin.isActive = true;
      superAdmin.password = hashedPassword;
      await superAdmin.save();
      console.log(`[Super Admin] Verified & synchronized default Super Admin: ${adminEmail}`);
    } else {
      superAdmin = await User.create({
        name: "Malleswari (Super Admin)",
        email: adminEmail,
        phone: "9876543210",
        password: hashedPassword,
        role: "super_admin",
        organizationId: null,
        status: "active",
        isActive: true
      });
      console.log(`[Super Admin] Created default Super Admin: ${adminEmail}`);
    }
  } catch (error) {
    console.error("[Super Admin Init Warning]:", error.message);
  }
};

export default initSuperAdmin;
