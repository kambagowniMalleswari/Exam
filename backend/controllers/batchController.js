import Batch from "../models/Batch.js";
import User from "../models/User.js";

// 1. Get all batches for current organization
export const getBatches = async (req, res) => {
  try {
    const orgId = req.organizationId || req.user.organizationId;
    const query = {};

    if (req.user.role !== "super_admin" || orgId) {
      if (!orgId) {
        return res.status(200).json({
          success: true,
          count: 0,
          batches: []
        });
      }
      query.organizationId = orgId;
    } else if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }


    const batches = await Batch.find(query)
      .populate("createdBy", "name email")
      .populate("tests", "title duration totalMarks totalQuestions status numberOfAttempts")
      .populate("selectiveStudentIds", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const batchIds = batches.map((b) => b._id);
    const studentCounts = await User.aggregate([
      {
        $match: {
          role: "student",
          $or: [
            { batchIds: { $in: batchIds } },
            { batchId: { $in: batchIds } }
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
      { $match: { allBatches: { $in: batchIds } } },
      { $group: { _id: "$allBatches", count: { $sum: 1 } } }
    ]);
    const scMap = new Map(studentCounts.map((s) => [s._id.toString(), s.count]));

    const batchesWithCounts = batches.map((batch) => ({
      ...batch,
      studentCount: scMap.get(batch._id.toString()) || 0
    }));

    res.status(200).json({
      success: true,
      count: batchesWithCounts.length,
      batches: batchesWithCounts
    });
  } catch (error) {
    console.error("Get batches error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve batches",
      error: error.message
    });
  }
};

// 2. Get batch details and enrolled students
export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId || req.user.organizationId;

    const query = { _id: id };
    if (req.user.role !== "super_admin" && orgId) {
      query.organizationId = orgId;
    }

    const batch = await Batch.findOne(query)
      .populate("createdBy", "name email")
      .populate("tests", "title duration totalMarks totalQuestions status numberOfAttempts")
      .populate("selectiveStudentIds", "name email");
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found or unauthorized"
      });
    }

    const students = await User.find({
      $or: [{ batchIds: batch._id }, { batchId: batch._id }],
      role: "student"
    })
      .select("name email phone lastLogin createdAt batchNumber batchIds")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      batch: {
        ...batch.toObject(),
        studentCount: students.length
      },
      students
    });
  } catch (error) {
    console.error("Get batch by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load batch details",
      error: error.message
    });
  }
};

// 3. Create a new Batch
export const createBatch = async (req, res) => {
  try {
    const orgId = req.organizationId || req.user.organizationId || req.body.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization context is required to create a batch"
      });
    }

    const {
      name,
      batchNumber,
      department = "General",
      academicYear,
      description = "",
      tests = [],
      maxStudents = 50,
      enrollmentType = "open",
      selectiveStudentIds = [],
      accessCode = "",
      isPublished = true,
      isActive = true
    } = req.body;

    if (!name || !batchNumber) {
      return res.status(400).json({
        success: false,
        message: "Batch name and unique batch number/code are required"
      });
    }

    const cleanBatchNumber = batchNumber.toString().toUpperCase().trim();

    // Check uniqueness within organization
    const existing = await Batch.findOne({
      organizationId: orgId,
      batchNumber: cleanBatchNumber
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Batch code '${cleanBatchNumber}' already exists in this organization.`
      });
    }

    const parsedMaxStudents = Math.max(1, Number(maxStudents) || 50);

    const batch = await Batch.create({
      name: name.trim(),
      batchNumber: cleanBatchNumber,
      organizationId: orgId,
      createdBy: req.user.id,
      department: department.trim(),
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      description: description.trim(),
      tests: Array.isArray(tests) ? tests : [],
      maxStudents: parsedMaxStudents,
      enrollmentType: enrollmentType === "selective" ? "selective" : "open",
      selectiveStudentIds: Array.isArray(selectiveStudentIds) ? selectiveStudentIds : [],
      accessCode: accessCode ? accessCode.trim() : "",
      isPublished: isPublished !== false,
      isActive: isActive !== false
    });

    res.status(201).json({
      success: true,
      message: `Batch '${batch.name}' (${batch.batchNumber}) created successfully.`,
      batch
    });
  } catch (error) {
    console.error("Create batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create batch",
      error: error.message
    });
  }
};

// 4. Update Batch
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId || req.user.organizationId;

    const query = { _id: id };
    if (req.user.role !== "super_admin" && orgId) {
      query.organizationId = orgId;
    }

    const batch = await Batch.findOne(query);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    const {
      name,
      batchNumber,
      department,
      academicYear,
      description,
      tests,
      maxStudents,
      enrollmentType,
      selectiveStudentIds,
      accessCode,
      isPublished,
      isActive
    } = req.body;

    if (batchNumber && batchNumber.toUpperCase().trim() !== batch.batchNumber) {
      const cleanNewCode = batchNumber.toUpperCase().trim();
      const existing = await Batch.findOne({
        organizationId: batch.organizationId,
        batchNumber: cleanNewCode,
        _id: { $ne: batch._id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Batch code '${cleanNewCode}' is already used by another batch.`
        });
      }
      batch.batchNumber = cleanNewCode;

      // Update enrolled students with new batchNumber string
      await User.updateMany(
        { batchId: batch._id },
        { batchNumber: cleanNewCode }
      );
    }

    if (name) batch.name = name.trim();
    if (department !== undefined) batch.department = department.trim();
    if (academicYear !== undefined) batch.academicYear = academicYear.trim();
    if (description !== undefined) batch.description = description.trim();
    if (tests !== undefined && Array.isArray(tests)) batch.tests = tests;
    if (maxStudents !== undefined) batch.maxStudents = Math.max(1, Number(maxStudents) || 50);
    if (enrollmentType !== undefined) batch.enrollmentType = enrollmentType;
    if (selectiveStudentIds !== undefined && Array.isArray(selectiveStudentIds)) batch.selectiveStudentIds = selectiveStudentIds;
    if (accessCode !== undefined) batch.accessCode = accessCode.trim();
    if (isPublished !== undefined) batch.isPublished = Boolean(isPublished);
    if (isActive !== undefined) batch.isActive = isActive;

    await batch.save();

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch
    });
  } catch (error) {
    console.error("Update batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update batch",
      error: error.message
    });
  }
};

// 5. Delete Batch
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.organizationId || req.user.organizationId;

    const query = { _id: id };
    if (req.user.role !== "super_admin" && orgId) {
      query.organizationId = orgId;
    }

    const batch = await Batch.findOne(query);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    // Unassign students from this batch without removing them from other batches
    await User.updateMany(
      { $or: [{ batchId: batch._id }, { batchIds: batch._id }] },
      {
        $pull: { batchIds: batch._id }
      }
    );
    await User.updateMany(
      { batchId: batch._id },
      { batchId: null, batchNumber: "" }
    );

    await Batch.deleteOne({ _id: batch._id });

    res.status(200).json({
      success: true,
      message: `Batch '${batch.name}' deleted and assigned students unlinked.`
    });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete batch",
      error: error.message
    });
  }
};

// 6. Bulk assign students to a batch (supports multiple batches per student)
export const assignStudentsToBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;
    const orgId = req.organizationId || req.user.organizationId;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An array of student IDs is required"
      });
    }

    const query = { _id: id };
    if (req.user.role !== "super_admin" && orgId) {
      query.organizationId = orgId;
    }

    const batch = await Batch.findOne(query);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    // Assign students into batchIds array while preserving existing batches
    const updateResult = await User.updateMany(
      {
        _id: { $in: studentIds },
        organizationId: batch.organizationId,
        role: "student"
      },
      {
        $addToSet: { batchIds: batch._id },
        $set: { batchId: batch._id, batchNumber: batch.batchNumber }
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${updateResult.modifiedCount} student(s) to batch '${batch.name}'.`,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Assign students to batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign students to batch",
      error: error.message
    });
  }
};

// 7. Remove single student from batch
export const removeStudentFromBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    const orgId = req.organizationId || req.user.organizationId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required"
      });
    }

    const query = { _id: id };
    if (req.user.role !== "super_admin" && orgId) {
      query.organizationId = orgId;
    }

    const batch = await Batch.findOne(query);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    // Pull batch from student's batchIds
    const userToUpdate = await User.findById(studentId);
    if (userToUpdate) {
      await User.updateOne(
        { _id: studentId },
        {
          $pull: { batchIds: batch._id }
        }
      );

      // If primary batchId was this batch, set batchId to remaining batch or null
      if (userToUpdate.batchId && userToUpdate.batchId.toString() === batch._id.toString()) {
        const remaining = (userToUpdate.batchIds || []).filter(
          (b) => b.toString() !== batch._id.toString()
        );
        const nextBatchId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
        let nextBatchNum = "";
        if (nextBatchId) {
          const nextB = await Batch.findById(nextBatchId);
          nextBatchNum = nextB?.batchNumber || "";
        }
        await User.updateOne({ _id: studentId }, { batchId: nextBatchId, batchNumber: nextBatchNum });
      }
    }

    res.status(200).json({
      success: true,
      message: "Student unassigned from batch"
    });
  } catch (error) {
    console.error("Remove student from batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove student from batch",
      error: error.message
    });
  }
};

// 8. Get available published batches for student self-enrollment
export const getAvailableBatchesForStudent = async (req, res) => {
  try {
    const orgId = req.organizationId || req.user.organizationId;
    if (!orgId) {
      return res.status(200).json({ success: true, count: 0, batches: [] });
    }

    const batches = await Batch.find({
      organizationId: orgId,
      isActive: true,
      isPublished: true
    })
      .populate("createdBy", "name email")
      .populate("tests", "title duration totalMarks totalQuestions status numberOfAttempts")
      .sort({ createdAt: -1 })
      .lean();

    const studentUser = await User.findById(req.user.id).lean();

    const batchIds = batches.map((b) => b._id);
    const studentCounts = await User.aggregate([
      {
        $match: {
          role: "student",
          $or: [
            { batchIds: { $in: batchIds } },
            { batchId: { $in: batchIds } }
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
      { $match: { allBatches: { $in: batchIds } } },
      { $group: { _id: "$allBatches", count: { $sum: 1 } } }
    ]);
    const scMap = new Map(studentCounts.map((s) => [s._id.toString(), s.count]));

    const batchesWithStatus = batches.map((b) => {
      const studentCount = scMap.get(b._id.toString()) || 0;
      const isEnrolled =
        (studentUser?.batchIds && studentUser.batchIds.some((id) => id.toString() === b._id.toString())) ||
        (studentUser?.batchId && studentUser.batchId.toString() === b._id.toString());
      const maxLimit = b.maxStudents || 50;
      const isFull = studentCount >= maxLimit;

      let isAuthorized = true;
      if (b.enrollmentType === "selective") {
        isAuthorized = b.selectiveStudentIds?.some(
          (id) => id.toString() === studentUser?._id.toString()
        );
      }

      return {
        ...b,
        studentCount,
        maxStudents: maxLimit,
        isEnrolled,
        isFull,
        isAuthorized
      };
    });

    res.status(200).json({
      success: true,
      count: batchesWithStatus.length,
      batches: batchesWithStatus
    });
  } catch (error) {
    console.error("Get available batches for student error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve available batches",
      error: error.message
    });
  }
};

// 9. Student self-enroll in a batch with limit & authorization checks (Supports Multiple Batches)
export const enrollStudentInBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessCode } = req.body;
    const studentUser = await User.findById(req.user.id);

    if (!studentUser) {
      return res.status(404).json({ success: false, message: "Student account not found." });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    // 1. Organization Check
    if (studentUser.organizationId && batch.organizationId.toString() !== studentUser.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        unauthorized: true,
        message: "Unauthorized: This batch belongs to another academic institution."
      });
    }

    // 2. Check if student is already enrolled in THIS batch
    const alreadyEnrolledInThisBatch =
      (studentUser.batchIds && studentUser.batchIds.some((bId) => bId.toString() === batch._id.toString())) ||
      (studentUser.batchId && studentUser.batchId.toString() === batch._id.toString());

    if (alreadyEnrolledInThisBatch) {
      return res.status(400).json({
        success: false,
        alreadyEnrolled: true,
        message: `You are already enrolled in batch '${batch.name}' (${batch.batchNumber}).`
      });
    }

    // 3. Batch active & published check
    if (!batch.isActive || !batch.isPublished) {
      return res.status(400).json({
        success: false,
        message: "This batch is currently closed and not accepting new student enrollments."
      });
    }

    // 4. Capacity limit check across both batchIds and batchId
    const currentCount = await User.countDocuments({
      $or: [{ batchIds: batch._id }, { batchId: batch._id }],
      role: "student"
    });
    const maxLimit = batch.maxStudents || 50;

    if (currentCount >= maxLimit) {
      return res.status(400).json({
        success: false,
        isFull: true,
        message: `Batch capacity reached! This batch is full (Maximum ${maxLimit} students allowed).`
      });
    }

    // 5. Selective batch authorization check
    if (batch.enrollmentType === "selective") {
      const isWhitelisted = batch.selectiveStudentIds?.some(
        (sid) => sid.toString() === studentUser._id.toString()
      );
      if (!isWhitelisted) {
        return res.status(403).json({
          success: false,
          unauthorized: true,
          message: "Unauthorized: You are not authorized or whitelisted to enroll in this selective batch. Please contact your instructor."
        });
      }
    }

    // 6. Access Code verification (if required)
    if (batch.accessCode && batch.accessCode.trim() !== "") {
      if (!accessCode || accessCode.trim().toUpperCase() !== batch.accessCode.trim().toUpperCase()) {
        return res.status(403).json({
          success: false,
          invalidCode: true,
          message: "Invalid enrollment passcode. Please verify the code with your teacher."
        });
      }
    }

    // 7. Enroll student in multiple batches
    if (!studentUser.batchIds) {
      studentUser.batchIds = [];
    }
    // Retain previous batchId in array if not already included
    if (studentUser.batchId && !studentUser.batchIds.some((b) => b.toString() === studentUser.batchId.toString())) {
      studentUser.batchIds.push(studentUser.batchId);
    }
    studentUser.batchIds.push(batch._id);
    studentUser.batchId = batch._id;
    studentUser.batchNumber = batch.batchNumber;
    if (!studentUser.organizationId) {
      studentUser.organizationId = batch.organizationId;
    }
    await studentUser.save();

    res.status(200).json({
      success: true,
      message: `Successfully enrolled in batch '${batch.name}' (${batch.batchNumber})!`,
      batch: {
        id: batch._id,
        name: batch.name,
        batchNumber: batch.batchNumber,
        studentCount: currentCount + 1,
        maxStudents: maxLimit
      }
    });
  } catch (error) {
    console.error("Student batch enrollment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enroll in batch",
      error: error.message
    });
  }
};
