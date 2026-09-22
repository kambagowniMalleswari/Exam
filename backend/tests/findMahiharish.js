import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function searchAll() {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("=== SEARCHING ALL COLLECTIONS FOR mahiharish6 ===");
  for (const col of collections) {
    const records = await mongoose.connection.db.collection(col.name).find({
      $or: [
        { email: { $regex: "mahiharish6", $options: "i" } },
        { adminName: { $regex: "Kumar", $options: "i" } },
        { name: { $regex: "Capgemini", $options: "i" } }
      ]
    }).toArray();
    if (records.length > 0) {
      console.log(`Found in collection [${col.name}] (${records.length} records):`);
      console.log(JSON.stringify(records, null, 2));
    }
  }
  await mongoose.disconnect();
}

searchAll().catch(console.error);
