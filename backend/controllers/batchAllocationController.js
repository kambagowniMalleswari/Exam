import Batch from "../models/Batch.js";
import User from "../models/User.js";
import BatchAllocationAudit from "../models/BatchAllocationAudit.js";
import { runStudentMatchingEngine } from "../services/studentMatcher.js";

// 1. Preview Batch Allocation (Dry Run)
export const previewBatchAllocation = async (req, res) => {
  try {
    const { rows, defaultBatchId, fileName = "student_list.xlsx" } = req.body;
    const orgId = req.organizationId || req.user.organizationId;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization reference is missing"
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No student records found in uploaded file"
      });
    }

    const previewResult = await runStudentMatchingEngine({
      rows,
      organizationId: orgId,
      defaultBatchId
    });

    res.status(200).json({
      success: true,
      fileName,
      ...previewResult
    });
  } catch (error) {
    console.error("Preview batch allocation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate batch allocation preview",
      error: error.message
    });
  }
};

// 2. Confirm and Execute Batch Allocation
export const confirmBatchAllocation = async (req, res) => {
  try {
    const {
      fileName = "student_list.xlsx",
      allocations = [],
      unmatchedRecords = [],
      summary = {}
    } = req.body;
    const orgId = req.organizationId || req.user.organizationId;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization reference is missing"
      });
    }

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No confirmed student allocations provided"
      });
    }

    // Step A: Group allocations by batch key/name
    const batchBuckets = new Map();

    for (const alloc of allocations) {
      if (!alloc.studentId) continue;
      const key = alloc.batchId
        ? alloc.batchId.toString()
        : (alloc.batchNumber || alloc.name || "DEFAULT").toUpperCase().trim();

      if (!batchBuckets.has(key)) {
        batchBuckets.set(key, {
          batchId: alloc.batchId || null,
          name: alloc.name || "General Student Cohort",
          batchNumber: alloc.batchNumber || key,
          department: alloc.department || "General",
          academicYear:
            alloc.academicYear ||
            `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          studentIds: new Set()
        });
      }
      batchBuckets.get(key).studentIds.add(alloc.studentId.toString());
    }

    // Step B: Resolve batches (fetch or create)
    const resolvedBatchAllocations = [];
    let batchesCreatedCount = 0;

    for (const [key, bucket] of batchBuckets.entries()) {
      let batchDoc = null;

      if (bucket.batchId) {
        batchDoc = await Batch.findOne({ _id: bucket.batchId, organizationId: orgId });
      }

      if (!batchDoc && bucket.batchNumber) {
        batchDoc = await Batch.findOne({
          organizationId: orgId,
          batchNumber: bucket.batchNumber.toUpperCase().trim()
        });
      }

      // Create batch if it does not exist
      if (!batchDoc) {
        let uniqueCode = bucket.batchNumber.toUpperCase().trim();
        // Check uniqueness and handle collision
        const exists = await Batch.findOne({ organizationId: orgId, batchNumber: uniqueCode });
        if (exists) {
          uniqueCode = `${uniqueCode}-${Date.now().toString().slice(-4)}`;
        }

        batchDoc = await Batch.create({
          name: bucket.name.trim(),
          batchNumber: uniqueCode,
          organizationId: orgId,
          createdBy: req.user.id,
          department: bucket.department || "General",
          academicYear: bucket.academicYear,
          description: `Auto-created via Student Matching & Batch Allocation (${fileName})`,
          maxStudents: Math.max(100, bucket.studentIds.size + 20),
          isPublished: true,
          enrollmentType: "open"
        });
        batchesCreatedCount++;
      }

      resolvedBatchAllocations.push({
        batchId: batchDoc._id,
        name: batchDoc.name,
        batchNumber: batchDoc.batchNumber,
        studentIds: Array.from(bucket.studentIds)
      });
    }

    // Step C: Execute bulkWrite to assign students
    const bulkOps = [];
    resolvedBatchAllocations.forEach((bAlloc) => {
      bAlloc.studentIds.forEach((sId) => {
        bulkOps.push({
          updateOne: {
            filter: {
              _id: sId,
              organizationId: orgId,
              role: "student"
            },
            update: {
              $addToSet: { batchIds: bAlloc.batchId },
              $set: { batchId: bAlloc.batchId, batchNumber: bAlloc.batchNumber }
            }
          }
        });
      });
    });

    let modifiedStudentsCount = 0;
    if (bulkOps.length > 0) {
      const bulkResult = await User.bulkWrite(bulkOps);
      modifiedStudentsCount = bulkResult.modifiedCount || bulkOps.length;
    }

    // Step D: Record Audit Log
    const auditRecord = await BatchAllocationAudit.create({
      organizationId: orgId,
      uploadedBy: req.user.id,
      fileName,
      summary: {
        totalRecords: summary.totalRecords || allocations.length + unmatchedRecords.length,
        matchedCount: summary.matchedCount || allocations.length,
        allocatedCount: modifiedStudentsCount,
        unmatchedCount: summary.unmatchedCount || unmatchedRecords.length,
        duplicateCount: summary.duplicateCount || 0,
        ambiguousCount: summary.ambiguousCount || 0,
        invalidCount: summary.invalidCount || 0
      },
      batchAllocations: resolvedBatchAllocations.map((b) => ({
        batchId: b.batchId,
        batchName: b.name,
        batchNumber: b.batchNumber,
        studentIds: b.studentIds,
        studentCount: b.studentIds.length
      })),
      unmatchedRecords: unmatchedRecords.map((r, idx) => ({
        rowNumber: r.rowNumber || idx + 1,
        data: r.raw || r,
        reason: r.reason || "Unmatched in student database"
      })),
      status: "confirmed"
    });

    res.status(200).json({
      success: true,
      message: `Successfully allocated ${modifiedStudentsCount} student(s) across ${resolvedBatchAllocations.length} batch(es).`,
      auditId: auditRecord._id,
      allocatedCount: modifiedStudentsCount,
      batchesCreatedCount,
      batchesUpdatedCount: resolvedBatchAllocations.length - batchesCreatedCount,
      summary: auditRecord.summary
    });
  } catch (error) {
    console.error("Confirm batch allocation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm batch allocation",
      error: error.message
    });
  }
};

// 3. Get Batch Allocation Audit History
export const getAllocationHistory = async (req, res) => {
  try {
    const orgId = req.organizationId || req.user.organizationId;
    const query = { organizationId: orgId };

    const logs = await BatchAllocationAudit.find(query)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      count: logs.length,
      history: logs
    });
  } catch (error) {
    console.error("Get allocation history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve allocation history",
      error: error.message
    });
  }
};
