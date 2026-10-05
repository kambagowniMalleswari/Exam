import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "assert";
import User from "../models/User.js";
import Batch from "../models/Batch.js";
import Organization from "../models/Organization.js";

dotenv.config();

const runTest = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for multi-batch verification...");

    const org = await Organization.findOne();
    if (!org) throw new Error("No organization found to test!");

    const teacher = await User.findOne({ role: "teacher", organizationId: org._id }) || await User.findOne({ role: "org_admin" });

    // 1. Create two test batches
    const testCodeA = `TEST-A-${Date.now()}`;
    const testCodeB = `TEST-B-${Date.now()}`;

    const batchA = await Batch.create({
      name: "Test Batch Alpha",
      batchNumber: testCodeA,
      organizationId: org._id,
      createdBy: teacher._id,
      maxStudents: 50,
      isPublished: true,
      isActive: true
    });

    const batchB = await Batch.create({
      name: "Test Batch Beta",
      batchNumber: testCodeB,
      organizationId: org._id,
      createdBy: teacher._id,
      maxStudents: 50,
      isPublished: true,
      isActive: true
    });

    console.log(`✓ Created test batches: ${batchA.batchNumber} and ${batchB.batchNumber}`);

    // 2. Find or create a test student
    let student = await User.findOne({ role: "student", organizationId: org._id });
    if (!student) {
      student = await User.create({
        name: "Test Scholar Student",
        email: `scholar.test.${Date.now()}@example.com`,
        password: "HashedPassword123!",
        role: "student",
        organizationId: org._id
      });
    }

    // 3. Enroll student in Batch A
    if (!student.batchIds) student.batchIds = [];
    student.batchIds.push(batchA._id);
    student.batchId = batchA._id;
    student.batchNumber = batchA.batchNumber;
    await student.save();

    // 4. Enroll student in Batch B (Multiple Batch Enrollment)
    student.batchIds.push(batchB._id);
    student.batchId = batchB._id;
    student.batchNumber = batchB.batchNumber;
    await student.save();

    // Verify student is enrolled in both
    const reloadedStudent = await User.findById(student._id);
    const hasBatchA = reloadedStudent.batchIds.some((id) => id.toString() === batchA._id.toString());
    const hasBatchB = reloadedStudent.batchIds.some((id) => id.toString() === batchB._id.toString());
    assert(hasBatchA && hasBatchB, "Student must be enrolled in BOTH batches!");
    console.log(`✓ Student successfully enrolled in MULTIPLE batches: [${batchA.batchNumber}, ${batchB.batchNumber}]`);

    // 5. Test aggregation count across multiple batches
    const testBatchIds = [batchA._id, batchB._id];
    const studentCounts = await User.aggregate([
      {
        $match: {
          role: "student",
          $or: [
            { batchIds: { $in: testBatchIds } },
            { batchId: { $in: testBatchIds } }
          ]
        }
      },
      {
        $project: {
          allBatches: {
            $setUnion: [
              { $ifNull: ["$batchIds", []] },
              { $cond: [{ $ifNull: ["$batchId", false] }, ["$batchId"], []] }
            ]
          }
        }
      },
      { $unwind: "$allBatches" },
      { $match: { allBatches: { $in: testBatchIds } } },
      { $group: { _id: "$allBatches", count: { $sum: 1 } } }
    ]);

    const scMap = new Map(studentCounts.map((s) => [s._id.toString(), s.count]));
    assert(scMap.get(batchA._id.toString()) >= 1, "Batch A must count the enrolled student");
    assert(scMap.get(batchB._id.toString()) >= 1, "Batch B must count the enrolled student");
    console.log(`✓ Batch counts correctly reflect multi-enrolled student: Batch A count = ${scMap.get(batchA._id.toString())}, Batch B count = ${scMap.get(batchB._id.toString())}`);

    // Cleanup test data
    await User.updateOne(
      { _id: student._id },
      { $pull: { batchIds: { $in: [batchA._id, batchB._id] } } }
    );
    await Batch.deleteOne({ _id: batchA._id });
    await Batch.deleteOne({ _id: batchB._id });
    console.log("✓ Cleaned up test batches successfully.");

    console.log("\n=======================================================");
    console.log("ALL MULTI-BATCH ENROLLMENT VERIFICATION CHECKS PASSED!");
    console.log("=======================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTest();
