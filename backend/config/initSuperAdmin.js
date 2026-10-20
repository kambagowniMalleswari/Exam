// Auto-initialization and Maintenance of Platform Administrators
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

export const initSuperAdmin = async () => {
  try {
    const primarySuperEmail = (process.env.SUPER_ADMIN_EMAIL || "kambagownikmalleswari@gmail.com").toLowerCase().trim();
    const smtpAdminEmail = (process.env.SMTP_USER || "admin@vmsclass.com").toLowerCase().trim();
    const plainPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@145";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 1. Maintain primary Super Admin
    let superAdmin = await User.findOne({ email: primarySuperEmail });
    if (superAdmin) {
      superAdmin.role = "super_admin";
      superAdmin.status = "active";
      superAdmin.isActive = true;
      if (!superAdmin.password) {
        superAdmin.password = hashedPassword;
      }
      await superAdmin.save();
      console.log(`[Super Admin] Verified & synchronized primary Super Admin: ${primarySuperEmail}`);
    } else {
      await User.create({
        name: "Malleswari (Super Admin)",
        email: primarySuperEmail,
        phone: "9876543210",
        password: hashedPassword,
        role: "super_admin",
        organizationId: null,
        status: "active",
        isActive: true
      });
      console.log(`[Super Admin] Created primary Super Admin: ${primarySuperEmail}`);
    }

    // 2. Maintain SMTP Admin (admin@vmsclass.com) as platform administrator
    if (smtpAdminEmail && smtpAdminEmail !== primarySuperEmail) {
      let smtpAdmin = await User.findOne({ email: smtpAdminEmail });
      if (smtpAdmin) {
        smtpAdmin.role = "super_admin";
        smtpAdmin.status = "active";
        smtpAdmin.isActive = true;
        await smtpAdmin.save();
        console.log(`[Super Admin] Verified & synchronized SMTP Admin: ${smtpAdminEmail}`);
      } else {
        await User.create({
          name: "VMS Platform Admin",
          email: smtpAdminEmail,
          phone: "9876543211",
          password: hashedPassword,
          role: "super_admin",
          organizationId: null,
          status: "active",
          isActive: true
        });
        console.log(`[Super Admin] Created SMTP Admin user: ${smtpAdminEmail}`);
      }
    }

    // 3. Ensure primary Organization exists and is active
    let primaryOrg = await Organization.findOne({ isActive: true });
    if (!primaryOrg) {
      primaryOrg = await Organization.create({
        name: "VMS Educational Academy",
        slug: "vms-academy",
        email: smtpAdminEmail,
        adminName: "VMS Administrator",
        status: "active",
        isActive: true,
        subscriptionPlan: "enterprise",
        subscriptionStatus: "active"
      });
      console.log("[Organization Init] Created default active organization: VMS Educational Academy");
    }

  } catch (error) {
    console.error("[Super Admin Init Warning]:", error.message);
  }
};

export default initSuperAdmin;
