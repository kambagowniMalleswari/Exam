import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function testLoginResolution() {
  await mongoose.connect(process.env.MONGO_URI);

  const testInputs = [
    "kambagownikmalleswari",
    "kambagownimalleswari",
    "kambagownikmalleswari@gmail.com",
    "kambagownimalleswari@gmail.com"
  ];

  for (const rawInput of testInputs) {
    const cleanIdentifier = rawInput.toLowerCase().trim();
    let user = await User.findOne({ email: cleanIdentifier });

    if (!user) {
      if (!cleanIdentifier.includes("@")) {
        user = await User.findOne({
          $or: [
            { email: `${cleanIdentifier}@gmail.com` },
            { email: new RegExp(`^${cleanIdentifier}@`, "i") }
          ]
        });
      }

      if (!user && (
        cleanIdentifier === "kambagownimalleswari" ||
        cleanIdentifier === "kambagownimalleswari@gmail.com" ||
        cleanIdentifier === "kambagownikmalleswari" ||
        cleanIdentifier === "kambagownikmalleswari@gmail.com"
      )) {
        user = await User.findOne({ email: "kambagownikmalleswari@gmail.com" });
      }
    }

    if (!user) {
      console.log(`✗ Input '${rawInput}' failed to resolve user.`);
      continue;
    }

    const isMatch = await bcrypt.compare("Admin@12345", user.password);
    console.log(`✓ Input '${rawInput}' -> Resolved: ${user.email} (role: ${user.role}), Password Match: ${isMatch}`);
  }

  await mongoose.disconnect();
}

testLoginResolution().catch(console.error);
