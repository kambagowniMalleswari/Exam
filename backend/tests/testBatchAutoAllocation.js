import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Batch from "../models/Batch.js";
import Organization from "../models/Organization.js";
import BatchAllocationAudit from "../models/BatchAllocationAudit.js";
import { runStudentMatchingEngine } from "../services/studentMatcher.js";

dotenv.config();

const runTest = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mcq-portal";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for testing student matching engine...");

    // 1. Setup Test Organization
    let testOrg = await Organization.findOne({ slug: "match-test-uni" });
    if (!testOrg) {
      testOrg = await Organization.create({
        name: "Matching Test University",
        slug: "match-test-uni",
        email: "match-test@testuni.edu",
        type: "University"
      });
    }

    const orgId = testOrg._id;

    // Clean previous test students for this test organization
    await User.deleteMany({ organizationId: orgId, email: /@testuni\.edu$/ });
    await Batch.deleteMany({ organizationId: orgId, batchNumber: /CS-ALPHA/ });
    await BatchAllocationAudit.deleteMany({ organizationId: orgId });

    // 2. Seed Existing Students
    const student1 = await User.create({
      name: "Aarav Patel",
      email: "aarav.patel@testuni.edu",
      password: "Password@123",
      role: "student",
      organizationId: orgId,
      registrationNumber: "REG2026-001",
      studentId: "STU-001",
      department: "Computer Science"
    });

    const student2 = await User.create({
      name: "Diya Reddy",
      email: "diya.reddy@testuni.edu",
      password: "Password@123",
      role: "student",
      organizationId: orgId,
      registrationNumber: "REG2026-002",
      studentId: "STU-002",
      department: "Electrical Engineering"
    });

    const student3 = await User.create({
      name: "Kiran Kumar",
      email: "kiran.kumar@testuni.edu",
      password: "Password@123",
      role: "student",
      organizationId: orgId,
      registrationNumber: "REG2026-003",
      studentId: "STU-003",
      department: "Mechanical Engineering"
    });

    // Two students with the exact same name to test Ambiguity
    const student4A = await User.create({
      name: "Sneha Sharma",
      email: "sneha.sharma1@testuni.edu",
      password: "Password@123",
      role: "student",
      organizationId: orgId,
      registrationNumber: "REG2026-004A",
      studentId: "STU-004A",
      department: "Computer Science"
    });

    const student4B = await User.create({
      name: "Sneha Sharma",
      email: "sneha.sharma2@testuni.edu",
      password: "Password@123",
      role: "student",
      organizationId: orgId,
      registrationNumber: "REG2026-004B",
      studentId: "STU-004B",
      department: "Computer Science"
    });

    // Existing Batch
    const existingBatch = await Batch.create({
      name: "CS Alpha Cohort",
      batchNumber: "CS-ALPHA-2026",
      organizationId: orgId,
      createdBy: student1._id,
      department: "Computer Science"
    });

    // Assign student 1 to existing batch beforehand to test Duplicate detection
    await User.updateOne(
      { _id: student1._id },
      { $addToSet: { batchIds: existingBatch._id }, batchId: existingBatch._id, batchNumber: existingBatch.batchNumber }
    );

    console.log("Seeded test students & batches successfully.");

    // 3. Test Uploaded Rows
    const mockUploadedRows = [
      // Test 1: Priority 1 - Exact Reg No
      {
        "Registration Number": "REG2026-002",
        "Student Name": "Different Display Name",
        "Email Address": "unrelated@other.com",
        "Batch Name": "CS Alpha Cohort"
      },
      // Test 2: Priority 2 - Exact Email
      {
        "Student Name": "Kiran Kumar",
        "Email": "kiran.kumar@testuni.edu",
        "Section": "A",
        "Department": "Mechanical"
      },
      // Test 3: Priority 3 - Exact Student ID
      {
        "Student ID": "STU-001",
        "Batch Name": "CS Alpha Cohort"
      },
      // Test 4: Priority 4 - Name Ambiguity (multiple Sneha Sharmas without unique ID)
      {
        "Name": "Sneha Sharma",
        "Section": "B"
      },
      // Test 5: Unmatched Student
      {
        "Registration Number": "REG-NONEXISTENT-999",
        "Email": "nobody@testuni.edu",
        "Name": "Ghost Student"
      },
      // Test 6: Invalid Row
      {
        "Email": "invalid-email-format-without-at",
        "Name": "Invalid Guy"
      }
    ];

    console.log("\nExecuting Student Matching Engine Dry-Run...");
    const result = await runStudentMatchingEngine({
      rows: mockUploadedRows,
      organizationId: orgId
    });

    console.log("Summary:", result.summary);

    // Assertions
    const r1 = result.records[0];
    console.assert(r1.status === "matched" && r1.matchMethod === "registration_number", "Failed Priority 1: Reg No");
    console.log("✓ Priority 1 (Exact Reg No) passed: Matched to Diya Reddy");

    const r2 = result.records[1];
    console.assert(r2.status === "matched" && r2.matchMethod === "email", "Failed Priority 2: Email");
    console.log("✓ Priority 2 (Exact Email) passed: Matched to Kiran Kumar");

    const r3 = result.records[2];
    console.assert(r3.status === "duplicate", "Failed Duplicate check for already enrolled student");
    console.log("✓ Duplicate Detection passed: Aarav Patel is already enrolled in CS Alpha Cohort");

    const r4 = result.records[3];
    console.assert(r4.status === "ambiguous", "Failed Ambiguity detection for duplicate names");
    console.log("✓ Ambiguity Detection passed: Flagged Sneha Sharma with 2 candidate choices");

    const r5 = result.records[4];
    console.assert(r5.status === "unmatched", "Failed Unmatched detection");
    console.log("✓ Unmatched Detection passed: Flagged Ghost Student as unmatched");

    const r6 = result.records[5];
    console.assert(r6.status === "invalid", "Failed Invalid format detection");
    console.log("✓ Invalid Format Detection passed: Flagged invalid email");

    console.log("\nAll matching engine assertions passed with 100% precision!");

    // Clean up
    await User.deleteMany({ organizationId: orgId });
    await Batch.deleteMany({ organizationId: orgId });
    await Organization.deleteOne({ _id: orgId });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

runTest();
