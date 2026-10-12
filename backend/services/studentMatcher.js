import User from "../models/User.js";
import Batch from "../models/Batch.js";

// Normalize helpers
export const normalizeEmail = (val) => {
  if (!val || typeof val !== "string") return "";
  return val.trim().toLowerCase();
};

export const normalizeId = (val) => {
  if (!val) return "";
  return String(val).trim().toUpperCase().replace(/\s+/g, "");
};

export const normalizeText = (val) => {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/\s+/g, " ");
};

// Flexible column mapping
export const mapRowFields = (row) => {
  const normalizedRow = {};
  for (const [key, value] of Object.entries(row)) {
    const k = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    normalizedRow[k] = value;
  }

  // Registration Number
  const regNo =
    normalizedRow.registrationnumber ||
    normalizedRow.regno ||
    normalizedRow.registerno ||
    normalizedRow.registernumber ||
    normalizedRow.usn ||
    normalizedRow.rollnumber ||
    normalizedRow.rollno ||
    "";

  // Email
  const email =
    normalizedRow.email ||
    normalizedRow.emailaddress ||
    normalizedRow.mail ||
    normalizedRow.studentemail ||
    "";

  // Student ID
  const studentId =
    normalizedRow.studentid ||
    normalizedRow.studentcode ||
    normalizedRow.admissionnumber ||
    normalizedRow.admissionno ||
    normalizedRow.id ||
    "";

  // Name
  const name =
    normalizedRow.name ||
    normalizedRow.studentname ||
    normalizedRow.fullname ||
    normalizedRow.candidatename ||
    "";

  // Department
  const department =
    normalizedRow.department ||
    normalizedRow.dept ||
    normalizedRow.branch ||
    "";

  // Course
  const course =
    normalizedRow.course ||
    normalizedRow.program ||
    normalizedRow.degree ||
    "";

  // Year / Academic Year
  const academicYear =
    normalizedRow.academicyear ||
    normalizedRow.year ||
    normalizedRow.batchyear ||
    "";

  // Semester
  const semester =
    normalizedRow.semester ||
    normalizedRow.sem ||
    "";

  // Section
  const section =
    normalizedRow.section ||
    normalizedRow.sec ||
    normalizedRow.division ||
    "";

  // Batch Name / Code
  const batchName =
    normalizedRow.batch ||
    normalizedRow.batchname ||
    normalizedRow.batchcode ||
    normalizedRow.batchnumber ||
    "";

  return {
    raw: row,
    registrationNumber: normalizeId(regNo),
    email: normalizeEmail(email),
    studentId: normalizeId(studentId),
    name: normalizeText(name),
    department: normalizeText(department),
    course: normalizeText(course),
    academicYear: normalizeText(academicYear),
    semester: normalizeText(semester),
    section: normalizeText(section),
    batchName: normalizeText(batchName)
  };
};

/**
 * High-performance 4-Tier Matching Engine for ~5,000+ students.
 * Queries database once via bulk `$in` criteria, builds in-memory maps,
 * and categorizes each uploaded record.
 */
export const runStudentMatchingEngine = async ({
  rows,
  organizationId,
  defaultBatchId = null
}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      summary: {
        totalRecords: 0,
        matchedCount: 0,
        allocatedCount: 0,
        unmatchedCount: 0,
        ambiguousCount: 0,
        duplicateCount: 0,
        invalidCount: 0
      },
      records: [],
      batchesToCreate: [],
      batchesToUpdate: []
    };
  }

  // 1. Map rows and collect query targets
  const mappedRows = [];
  const targetRegNos = new Set();
  const targetEmails = new Set();
  const targetStudentIds = new Set();
  const targetNames = new Set();

  rows.forEach((r, idx) => {
    const mapped = mapRowFields(r);
    mapped.rowNumber = idx + 1;
    mappedRows.push(mapped);

    if (mapped.registrationNumber) targetRegNos.add(mapped.registrationNumber);
    if (mapped.email) targetEmails.add(mapped.email);
    if (mapped.studentId) targetStudentIds.add(mapped.studentId);
    if (mapped.name) targetNames.add(mapped.name.toLowerCase());
  });

  // 2. Query all candidate students in organization with bulk indexed search
  const orCriteria = [];
  if (targetRegNos.size > 0) {
    orCriteria.push({ registrationNumber: { $in: Array.from(targetRegNos) } });
  }
  if (targetEmails.size > 0) {
    orCriteria.push({ email: { $in: Array.from(targetEmails) } });
  }
  if (targetStudentIds.size > 0) {
    orCriteria.push({ studentId: { $in: Array.from(targetStudentIds) } });
  }
  if (targetNames.size > 0) {
    orCriteria.push({
      name: {
        $in: Array.from(targetNames).map((n) => new RegExp(`^${n}$`, "i"))
      }
    });
  }

  const query = {
    organizationId,
    role: "student"
  };
  if (orCriteria.length > 0) {
    query.$or = orCriteria;
  }

  const existingStudents = orCriteria.length > 0
    ? await User.find(query)
        .select(
          "_id name email registrationNumber studentId department course academicYear semester section batchId batchIds"
        )
        .lean()
    : [];

  // 3. Build in-memory lookup indices for O(1) matching
  const regNoMap = new Map();
  const emailMap = new Map();
  const studentIdMap = new Map();
  const nameMap = new Map();

  existingStudents.forEach((student) => {
    const reg = normalizeId(student.registrationNumber);
    if (reg) {
      if (!regNoMap.has(reg)) regNoMap.set(reg, []);
      regNoMap.get(reg).push(student);
    }

    const em = normalizeEmail(student.email);
    if (em) {
      if (!emailMap.has(em)) emailMap.set(em, []);
      emailMap.get(em).push(student);
    }

    const sId = normalizeId(student.studentId);
    if (sId) {
      if (!studentIdMap.has(sId)) studentIdMap.set(sId, []);
      studentIdMap.get(sId).push(student);
    }

    const nm = normalizeText(student.name).toLowerCase();
    if (nm) {
      if (!nameMap.has(nm)) nameMap.set(nm, []);
      nameMap.get(nm).push(student);
    }
  });

  // 4. Fetch all existing batches in this organization
  const existingBatches = await Batch.find({ organizationId }).lean();
  const batchByName = new Map();
  const batchByNumber = new Map();
  const batchById = new Map();

  existingBatches.forEach((b) => {
    batchByName.set((b.name || "").trim().toLowerCase(), b);
    batchByNumber.set((b.batchNumber || "").trim().toUpperCase(), b);
    batchById.set(b._id.toString(), b);
  });

  // 5. Run Prioritized Matching on each row
  const processedRecords = [];
  const batchesToCreateMap = new Map(); // batchKey -> batch metadata
  const allocatedStudentIdsPerBatch = new Map(); // batchKey -> Set<studentId>

  const summary = {
    totalRecords: mappedRows.length,
    matchedCount: 0,
    allocatedCount: 0,
    unmatchedCount: 0,
    ambiguousCount: 0,
    duplicateCount: 0,
    invalidCount: 0
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const item of mappedRows) {
    const hasAnyId = item.registrationNumber || item.email || item.studentId || item.name;

    // Validation
    if (!hasAnyId) {
      summary.invalidCount++;
      processedRecords.push({
        ...item,
        status: "invalid",
        matchMethod: null,
        matchedStudent: null,
        targetBatch: null,
        reason: "Row is completely empty or missing student identifiers."
      });
      continue;
    }

    if (item.email && !emailRegex.test(item.email)) {
      summary.invalidCount++;
      processedRecords.push({
        ...item,
        status: "invalid",
        matchMethod: null,
        matchedStudent: null,
        targetBatch: null,
        reason: `Invalid email address format: '${item.email}'`
      });
      continue;
    }

    let matchedStudent = null;
    let matchMethod = null;
    let candidates = [];
    let isAmbiguous = false;

    // ==========================================
    // Priority 1: Exact Registration Number
    // ==========================================
    if (item.registrationNumber && regNoMap.has(item.registrationNumber)) {
      const matches = regNoMap.get(item.registrationNumber);
      if (matches.length === 1) {
        matchedStudent = matches[0];
        matchMethod = "registration_number";
      } else {
        isAmbiguous = true;
        candidates = matches;
        matchMethod = "registration_number_conflict";
      }
    }

    // ==========================================
    // Priority 2: Exact Email Address
    // ==========================================
    if (!matchedStudent && !isAmbiguous && item.email && emailMap.has(item.email)) {
      const matches = emailMap.get(item.email);
      if (matches.length === 1) {
        matchedStudent = matches[0];
        matchMethod = "email";
      } else {
        isAmbiguous = true;
        candidates = matches;
        matchMethod = "email_conflict";
      }
    }

    // ==========================================
    // Priority 3: Exact Student ID
    // ==========================================
    if (!matchedStudent && !isAmbiguous && item.studentId && studentIdMap.has(item.studentId)) {
      const matches = studentIdMap.get(item.studentId);
      if (matches.length === 1) {
        matchedStudent = matches[0];
        matchMethod = "student_id";
      } else {
        isAmbiguous = true;
        candidates = matches;
        matchMethod = "student_id_conflict";
      }
    }

    // ==========================================
    // Priority 4: Name Matching (Secondary)
    // ==========================================
    if (!matchedStudent && !isAmbiguous && item.name && nameMap.has(item.name.toLowerCase())) {
      let matches = nameMap.get(item.name.toLowerCase());

      // If department or course is given, narrow down candidate matches
      if (matches.length > 1 && (item.department || item.course)) {
        const filtered = matches.filter((s) => {
          const deptMatch = !item.department || (s.department || "").toLowerCase() === item.department.toLowerCase();
          const courseMatch = !item.course || (s.course || "").toLowerCase() === item.course.toLowerCase();
          return deptMatch && courseMatch;
        });
        if (filtered.length > 0) matches = filtered;
      }

      if (matches.length === 1) {
        matchedStudent = matches[0];
        matchMethod = "name_secondary";
      } else {
        isAmbiguous = true;
        candidates = matches;
        matchMethod = "name_ambiguous";
      }
    }

    // Handle Ambiguous Match
    if (isAmbiguous) {
      summary.ambiguousCount++;
      processedRecords.push({
        ...item,
        status: "ambiguous",
        matchMethod,
        matchedStudent: null,
        candidates: candidates.map((c) => ({
          _id: c._id,
          name: c.name,
          email: c.email,
          registrationNumber: c.registrationNumber,
          studentId: c.studentId,
          department: c.department
        })),
        targetBatch: null,
        reason: `Multiple (${candidates.length}) students match this record. Manual review required.`
      });
      continue;
    }

    // Handle Unmatched
    if (!matchedStudent) {
      summary.unmatchedCount++;
      processedRecords.push({
        ...item,
        status: "unmatched",
        matchMethod: null,
        matchedStudent: null,
        candidates: [],
        targetBatch: null,
        reason: "No matching student found in centralized student database."
      });
      continue;
    }

    // ==========================================
    // Student Matched -> Determine Batch Allocation
    // ==========================================
    summary.matchedCount++;

    let targetBatchName = "";
    let targetBatchCode = "";
    let existingTargetBatch = null;

    if (item.batchName) {
      targetBatchName = item.batchName;
      targetBatchCode = normalizeId(item.batchName);
      existingTargetBatch =
        batchByName.get(item.batchName.toLowerCase()) ||
        batchByNumber.get(targetBatchCode);
    } else if (item.department || item.course || item.section) {
      const deptPart = item.department || item.course || "Cohort";
      const yearPart = item.academicYear || new Date().getFullYear();
      const secPart = item.section ? `Sec-${item.section}` : "A";
      targetBatchName = `${deptPart} ${yearPart} ${secPart}`.trim();
      targetBatchCode = normalizeId(`${deptPart}-${yearPart}-${secPart}`);
      existingTargetBatch =
        batchByName.get(targetBatchName.toLowerCase()) ||
        batchByNumber.get(targetBatchCode);
    } else if (defaultBatchId && batchById.has(defaultBatchId)) {
      existingTargetBatch = batchById.get(defaultBatchId);
      targetBatchName = existingTargetBatch.name;
      targetBatchCode = existingTargetBatch.batchNumber;
    } else {
      targetBatchName = "General Student Cohort";
      targetBatchCode = "GEN-COHORT";
      existingTargetBatch =
        batchByName.get(targetBatchName.toLowerCase()) ||
        batchByNumber.get(targetBatchCode);
    }

    const batchKey = existingTargetBatch
      ? existingTargetBatch._id.toString()
      : targetBatchCode;

    // Check if student is already in this batch (prevent duplicate assignment)
    const existingStudentBatchIds = (matchedStudent.batchIds || []).map((id) =>
      id ? id.toString() : ""
    );
    if (matchedStudent.batchId) {
      existingStudentBatchIds.push(matchedStudent.batchId.toString());
    }

    const isAlreadyInBatch =
      existingTargetBatch &&
      existingStudentBatchIds.includes(existingTargetBatch._id.toString());

    if (isAlreadyInBatch) {
      summary.duplicateCount++;
      processedRecords.push({
        ...item,
        status: "duplicate",
        matchMethod,
        matchedStudent: {
          _id: matchedStudent._id,
          name: matchedStudent.name,
          email: matchedStudent.email,
          registrationNumber: matchedStudent.registrationNumber,
          studentId: matchedStudent.studentId,
          department: matchedStudent.department
        },
        targetBatch: {
          batchId: existingTargetBatch._id,
          name: existingTargetBatch.name,
          batchNumber: existingTargetBatch.batchNumber,
          isNew: false
        },
        reason: `Student '${matchedStudent.name}' is already assigned to batch '${existingTargetBatch.name}'.`
      });
      continue;
    }

    // Register batch to create if not existing
    if (!existingTargetBatch) {
      if (!batchesToCreateMap.has(batchKey)) {
        batchesToCreateMap.set(batchKey, {
          batchKey,
          name: targetBatchName,
          batchNumber: targetBatchCode,
          department: item.department || "General",
          academicYear: item.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          description: `Auto-generated batch for student import (${item.course || item.department || "Cohort"})`,
          isNew: true
        });
      }
    }

    if (!allocatedStudentIdsPerBatch.has(batchKey)) {
      allocatedStudentIdsPerBatch.set(batchKey, new Set());
    }
    allocatedStudentIdsPerBatch.get(batchKey).add(matchedStudent._id.toString());

    summary.allocatedCount++;
    processedRecords.push({
      ...item,
      status: "matched",
      matchMethod,
      matchedStudent: {
        _id: matchedStudent._id,
        name: matchedStudent.name,
        email: matchedStudent.email,
        registrationNumber: matchedStudent.registrationNumber,
        studentId: matchedStudent.studentId,
        department: matchedStudent.department
      },
      targetBatch: {
        batchKey,
        batchId: existingTargetBatch ? existingTargetBatch._id : null,
        name: targetBatchName,
        batchNumber: targetBatchCode,
        isNew: !existingTargetBatch
      },
      reason: "Matched and ready for allocation."
    });
  }

  // Format batches to create & summary
  const batchesToCreate = Array.from(batchesToCreateMap.values()).map((b) => ({
    ...b,
    studentCount: (allocatedStudentIdsPerBatch.get(b.batchKey) || new Set()).size
  }));

  const batchesToUpdate = Array.from(allocatedStudentIdsPerBatch.entries())
    .filter(([key]) => batchById.has(key))
    .map(([key, idSet]) => {
      const b = batchById.get(key);
      return {
        batchId: b._id,
        name: b.name,
        batchNumber: b.batchNumber,
        studentCount: idSet.size
      };
    });

  return {
    summary,
    records: processedRecords,
    batchesToCreate,
    batchesToUpdate
  };
};
