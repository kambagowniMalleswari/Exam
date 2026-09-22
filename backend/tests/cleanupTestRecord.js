import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await mongoose.connection.db.collection("orgapplications").deleteOne({ email: /test_inst_/ });
  console.log("Cleaned up dummy test record:", res.deletedCount);
  await mongoose.disconnect();
}

cleanup().catch(console.error);
