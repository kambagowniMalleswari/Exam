import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.db.collection("users").updateOne(
    { email: "kambagownikmalleswari@gmail.com" },
    { $set: { organizationId: null, role: "super_admin" } }
  );
  console.log("Super Admin organizationId reset to null.");
  await mongoose.disconnect();
}

reset().catch(console.error);
