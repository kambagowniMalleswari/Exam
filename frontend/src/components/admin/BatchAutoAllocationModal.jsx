import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api.js";
import {
  UploadCloudIcon,
  DownloadIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UsersIcon,
  SearchIcon,
  RefreshIcon,
  FileTextIcon
} from "../common/Icons.jsx";
import "./BatchAutoAllocationModal.css";

const BatchAutoAllocationModal = ({ isOpen, onClose, existingBatches = [], onSuccess }) => {
  const [step, setStep] = useState("upload"); // "upload" | "preview" | "success" | "history"
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [defaultBatchId, setDefaultBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "matched" | "ambiguous" | "unmatched" | "duplicates" | "invalid"
  const [searchFilter, setSearchFilter] = useState("");
  const [resolutions, setResolutions] = useState({}); // rowNumber -> selected candidate studentId
  const [confirming, setConfirming] = useState(false);
  const [confirmedResult, setConfirmedResult] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setParsedRows([]);
    setDefaultBatchId("");
    setError("");
    setPreviewData(null);
    setActiveTab("all");
    setSearchFilter("");
    setResolutions({});
    setConfirming(false);
    setConfirmedResult(null);
  };

  if (!isOpen) return null;

  // 1. Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Registration Number": "REG2026-001",
        "Student ID": "STU-1001",
        "Student Name": "Aarav Patel",
        "Email Address": "student.aarav@itacademy.edu",
        "Department": "Computer Science",
        "Course": "B.Tech CSE",
        "Academic Year": "2026-2027",
        "Semester": "5",
        "Section": "A",
        "Batch Name": "CS-Alpha-2026"
      },
      {
        "Registration Number": "REG2026-002",
        "Student ID": "STU-1002",
        "Student Name": "Diya Reddy",
        "Email Address": "student.diya@itacademy.edu",
        "Department": "Electrical Engineering",
        "Course": "B.Tech EEE",
        "Academic Year": "2026-2027",
        "Semester": "3",
        "Section": "B",
        "Batch Name": "EEE-Beta-2026"
      },
      {
        "Registration Number": "REG2026-003",
        "Student ID": "STU-1003",
        "Student Name": "Kiran Kumar",
        "Email Address": "student.kiran@itacademy.edu",
        "Department": "Mechanical Engineering",
        "Course": "B.Tech MECH",
        "Academic Year": "2026-2027",
        "Semester": "1",
        "Section": "A",
        "Batch Name": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Allocation Template");
    XLSX.writeFile(wb, "AssessIQ_Student_Batch_Allocation_Template.xlsx");
  };

  // 2. Parse Uploaded File (.xlsx, .xls, .csv)
  const processFile = async (selectedFile) => {
    setError("");
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(fileExt)) {
      setError("Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    try {
      setLoading(true);
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows || rows.length === 0) {
        setError("Uploaded sheet is empty. Please ensure it contains student rows.");
        setLoading(false);
        return;
      }

      setFile(selectedFile);
      setParsedRows(rows);
      setLoading(false);
    } catch (err) {
      console.error("File parse error:", err);
      setError("Failed to parse file: " + (err.message || "Invalid spreadsheet format"));
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  // 3. Dry-Run Student Matching Preview
  const handleAnalyzeAndPreview = async () => {
    if (!parsedRows || parsedRows.length === 0) {
      setError("Please select a valid Excel or CSV file first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();
      const resolvedOrgId = storedUser?.organizationId || localStorage.getItem("organizationId") || undefined;

      const res = await api.post("/batches/allocation/preview", {
        rows: parsedRows,
        defaultBatchId: defaultBatchId || null,
        fileName: file?.name || "student_list.xlsx",
        organizationId: resolvedOrgId
      });

      if (res.data?.success) {
        setPreviewData(res.data);
        setStep("preview");
      } else {
        setError(res.data?.message || "Failed to analyze student records.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      if (err.response?.status === 403) {
        setError("Access restricted: Batch allocation is an administrative tool restricted to Faculty and Institutional Administrators. Please verify that your active account has educator or administrator privileges.");
      } else {
        setError(err.response?.data?.message || "Server error while matching students.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Download Unmatched Records
  const handleDownloadUnmatched = () => {
    if (!previewData?.records) return;

    const unmatchedList = previewData.records
      .filter((r) => r.status === "unmatched" || r.status === "ambiguous" || r.status === "invalid")
      .map((r) => ({
        "Status": r.status.toUpperCase(),
        "Reason": r.reason,
        "Registration Number": r.registrationNumber || "",
        "Student ID": r.studentId || "",
        "Student Name": r.name || "",
        "Email Address": r.email || "",
        "Department": r.department || "",
        "Course": r.course || "",
        "Section": r.section || "",
        "Batch Name": r.batchName || ""
      }));

    if (unmatchedList.length === 0) {
      alert("No unmatched or invalid records to download.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(unmatchedList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unmatched Records");
    XLSX.writeFile(wb, `Unmatched_Students_${file?.name || "export"}.xlsx`);
  };

  // 5. Confirm and Save Allocations
  const handleConfirmAllocation = async () => {
    if (!previewData) return;

    try {
      setConfirming(true);
      setError("");

      // Collect allocations from matched + resolved ambiguous items
      const finalAllocations = [];
      const unmatchedToLog = [];

      previewData.records.forEach((r) => {
        if (r.status === "matched" && r.matchedStudent && r.targetBatch) {
          finalAllocations.push({
            studentId: r.matchedStudent._id,
            name: r.targetBatch.name,
            batchNumber: r.targetBatch.batchNumber,
            batchId: r.targetBatch.batchId,
            department: r.department,
            academicYear: r.academicYear
          });
        } else if (r.status === "ambiguous") {
          const chosenStudentId = resolutions[r.rowNumber];
          if (chosenStudentId && r.targetBatch) {
            finalAllocations.push({
              studentId: chosenStudentId,
              name: r.targetBatch.name,
              batchNumber: r.targetBatch.batchNumber,
              batchId: r.targetBatch.batchId,
              department: r.department,
              academicYear: r.academicYear
            });
          } else {
            unmatchedToLog.push(r);
          }
        } else if (r.status === "unmatched" || r.status === "invalid") {
          unmatchedToLog.push(r);
        }
      });

      if (finalAllocations.length === 0) {
        setError("No valid students selected for allocation.");
        setConfirming(false);
        return;
      }

      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();
      const resolvedOrgId = storedUser?.organizationId || localStorage.getItem("organizationId") || undefined;

      const res = await api.post("/batches/allocation/confirm", {
        fileName: previewData.fileName || file?.name || "student_list.xlsx",
        allocations: finalAllocations,
        unmatchedRecords: unmatchedToLog,
        summary: previewData.summary,
        organizationId: resolvedOrgId
      });

      if (res.data?.success) {
        setConfirmedResult(res.data);
        setStep("success");
        if (onSuccess) onSuccess();
      } else {
        setError(res.data?.message || "Failed to confirm batch allocation.");
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.response?.data?.message || "Server error while confirming allocation.");
    } finally {
      setConfirming(false);
    }
  };

  // 6. View History Logs
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get("/batches/allocation/history");
      setHistoryLogs(res.data?.history || []);
      setStep("history");
    } catch (err) {
      console.error("Load history error:", err);
      setError("Failed to load allocation history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter records for tab display
  const getFilteredRecords = () => {
    if (!previewData?.records) return [];
    return previewData.records.filter((r) => {
      // Tab filter
      if (activeTab === "matched" && r.status !== "matched") return false;
      if (activeTab === "ambiguous" && r.status !== "ambiguous") return false;
      if (activeTab === "unmatched" && r.status !== "unmatched") return false;
      if (activeTab === "duplicates" && r.status !== "duplicate") return false;
      if (activeTab === "invalid" && r.status !== "invalid") return false;

      // Text search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const name = (r.name || r.matchedStudent?.name || "").toLowerCase();
        const email = (r.email || r.matchedStudent?.email || "").toLowerCase();
        const reg = (r.registrationNumber || r.matchedStudent?.registrationNumber || "").toLowerCase();
        const sId = (r.studentId || r.matchedStudent?.studentId || "").toLowerCase();
        const batch = (r.targetBatch?.name || r.batchName || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          reg.includes(q) ||
          sId.includes(q) ||
          batch.includes(q)
        );
      }
      return true;
    });
  };

  return (
    <div className="batch-modal-overlay">
      <div className="batch-modal-box auto-allocation-modal-box">
        {/* Modal Top Header */}
        <div className="modal-header">
          <div>
            <h3 className="auto-alloc-title">
              <UploadCloudIcon size={22} className="title-icon" />
              Automatic Student Matching & Batch Allocation
            </h3>
            <p className="auto-alloc-subtitle">
              Upload faculty student lists (Excel / CSV) to automatically match against the centralized student database and allocate cohorts.
            </p>
          </div>
          <div className="header-actions-wrap">
            {step !== "history" ? (
              <button
                type="button"
                className="btn-header-secondary"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                <FileTextIcon size={14} /> Audit History
              </button>
            ) : (
              <button
                type="button"
                className="btn-header-secondary"
                onClick={() => setStep(previewData ? "preview" : "upload")}
              >
                ← Back to Upload
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {error && (
          <div className="alloc-alert alert-error">
            <AlertTriangleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: UPLOAD & CONFIGURATION VIEW                                      */}
        {/* ========================================================================= */}
        {step === "upload" && (
          <div className="alloc-step-upload">
            {/* Template Bar */}
            <div className="template-helper-strip">
              <div>
                <strong>Need the standard spreadsheet format?</strong>
                <p>Download our pre-structured Excel template with registration numbers and batch columns.</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <a
                  href="/AssessIQ_Student_Roster_Batch_Allocation_Sample_1.xlsx"
                  download="AssessIQ_Student_Roster_Batch_Allocation_Sample_1.xlsx"
                  className="btn-template-download"
                  title="Download CS Department Sample Student Roster"
                >
                  <DownloadIcon size={14} /> Sample 1 (CS .xlsx)
                </a>
                <a
                  href="/AssessIQ_Student_Roster_Batch_Allocation_Sample_2.xlsx"
                  download="AssessIQ_Student_Roster_Batch_Allocation_Sample_2.xlsx"
                  className="btn-template-download"
                  title="Download ECE & IT Sample Student Roster"
                >
                  <DownloadIcon size={14} /> Sample 2 (ECE .xlsx)
                </a>
                <button
                  type="button"
                  className="btn-template-download secondary"
                  onClick={handleDownloadTemplate}
                  title="Generate Fresh Blank Template"
                >
                  <DownloadIcon size={14} /> Blank Template
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div
              className={`alloc-dropzone ${dragOver ? "dragover" : ""} ${file ? "has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <UploadCloudIcon size={44} className="dropzone-icon" />

              {file ? (
                <div className="file-ready-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-details">
                    {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} Records Loaded
                  </span>
                  <span className="file-change-hint">Click or drop another file to replace</span>
                </div>
              ) : (
                <div className="dropzone-text">
                  <span className="primary-text">Drag and drop your Excel or CSV file here</span>
                  <span className="secondary-text">Supports .xlsx, .xls, and .csv files containing student rosters</span>
                  <span className="browse-btn">Browse Files</span>
                </div>
              )}
            </div>

            {/* Default Batch Option */}
            <div className="upload-options-grid">
              <div className="form-group">
                <label>Fallback Target Batch (Optional)</label>
                <select
                  className="modal-input"
                  value={defaultBatchId}
                  onChange={(e) => setDefaultBatchId(e.target.value)}
                >
                  <option value="">Auto-derive from sheet (Department/Course/Section or Batch Column)</option>
                  {existingBatches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.batchNumber})
                    </option>
                  ))}
                </select>
                <small className="field-hint">
                  If the file does not specify a batch or department, students will be assigned to this batch.
                </small>
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="btn-batch-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary-gold"
                disabled={!file || loading}
                onClick={handleAnalyzeAndPreview}
              >
                {loading ? "Matching Students against Database..." : "Analyze & Preview Matching →"}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PREVIEW & CONFIRMATION VIEW                                      */}
        {/* ========================================================================= */}
        {step === "preview" && previewData && (
          <div className="alloc-step-preview">
            {/* KPI Summary Strip */}
            <div className="preview-kpi-strip">
              <div className="kpi-mini-card total">
                <span className="kpi-mini-num">{previewData.summary.totalRecords}</span>
                <span className="kpi-mini-title">Total Uploaded</span>
              </div>
              <div className="kpi-mini-card matched">
                <span className="kpi-mini-num">{previewData.summary.matchedCount}</span>
                <span className="kpi-mini-title">Matched in DB</span>
              </div>
              <div className="kpi-mini-card allocated">
                <span className="kpi-mini-num">{previewData.summary.allocatedCount}</span>
                <span className="kpi-mini-title">Ready to Allocate</span>
              </div>
              <div className="kpi-mini-card ambiguous">
                <span className="kpi-mini-num">{previewData.summary.ambiguousCount}</span>
                <span className="kpi-mini-title">Ambiguous Matches</span>
              </div>
              <div className="kpi-mini-card unmatched">
                <span className="kpi-mini-num">{previewData.summary.unmatchedCount}</span>
                <span className="kpi-mini-title">Unmatched</span>
              </div>
              <div className="kpi-mini-card duplicate">
                <span className="kpi-mini-num">{previewData.summary.duplicateCount}</span>
                <span className="kpi-mini-title">Already In Batch</span>
              </div>
              <div className="kpi-mini-card invalid">
                <span className="kpi-mini-num">{previewData.summary.invalidCount}</span>
                <span className="kpi-mini-title">Invalid</span>
              </div>
            </div>

            {/* Batches Generation Notice */}
            {(previewData.batchesToCreate?.length > 0 || previewData.batchesToUpdate?.length > 0) && (
              <div className="batch-impact-box">
                <strong>Batch Allocation Summary:</strong>
                <div className="batch-chips-wrap">
                  {previewData.batchesToCreate?.map((b) => (
                    <span key={b.batchKey} className="batch-chip chip-create">
                      + Create: <strong>{b.name}</strong> ({b.studentCount} students)
                    </span>
                  ))}
                  {previewData.batchesToUpdate?.map((b) => (
                    <span key={b.batchId} className="batch-chip chip-update">
                      Update: <strong>{b.name}</strong> (+{b.studentCount} students)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs & Search Toolbar */}
            <div className="preview-toolbar">
              <div className="tabs-header">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  All Records ({previewData.records.length})
                </button>
                <button
                  type="button"
                  className={`tab-btn tab-matched ${activeTab === "matched" ? "active" : ""}`}
                  onClick={() => setActiveTab("matched")}
                >
                  Matched ({previewData.summary.matchedCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn tab-ambiguous ${activeTab === "ambiguous" ? "active" : ""}`}
                  onClick={() => setActiveTab("ambiguous")}
                >
                  Ambiguous ({previewData.summary.ambiguousCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn tab-unmatched ${activeTab === "unmatched" ? "active" : ""}`}
                  onClick={() => setActiveTab("unmatched")}
                >
                  Unmatched ({previewData.summary.unmatchedCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn tab-dup ${activeTab === "duplicates" ? "active" : ""}`}
                  onClick={() => setActiveTab("duplicates")}
                >
                  Duplicates ({previewData.summary.duplicateCount})
                </button>
                <button
                  type="button"
                  className={`tab-btn tab-inv ${activeTab === "invalid" ? "active" : ""}`}
                  onClick={() => setActiveTab("invalid")}
                >
                  Invalid ({previewData.summary.invalidCount})
                </button>
              </div>

              <div className="filter-input-wrap">
                <SearchIcon size={14} />
                <input
                  type="text"
                  placeholder="Filter preview by name, email, reg no, or batch..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Records Table */}
            <div className="records-table-container">
              <table className="alloc-records-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>S.No</th>
                    <th>Uploaded Identifier</th>
                    <th>Status & Match Method</th>
                    <th>Matched Student in DB</th>
                    <th>Assigned Batch</th>
                    <th>Action / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredRecords().length > 0 ? (
                    getFilteredRecords().map((rec) => {
                      const isAmbiguous = rec.status === "ambiguous";

                      return (
                        <tr key={rec.rowNumber} className={`rec-row row-${rec.status}`}>
                          <td className="col-sno">#{rec.rowNumber}</td>
                          <td className="col-uploaded">
                            <strong>{rec.name || "—"}</strong>
                            <div className="sub-ids">
                              {rec.registrationNumber && (
                                <span className="id-tag">Reg: {rec.registrationNumber}</span>
                              )}
                              {rec.studentId && (
                                <span className="id-tag">ID: {rec.studentId}</span>
                              )}
                              {rec.email && (
                                <span className="email-sub">{rec.email}</span>
                              )}
                            </div>
                          </td>
                          <td className="col-status">
                            <span className={`status-pill pill-${rec.status}`}>
                              {rec.status.toUpperCase()}
                            </span>
                            {rec.matchMethod && (
                              <span className="match-method-text">
                                via {rec.matchMethod.replace(/_/g, " ")}
                              </span>
                            )}
                          </td>
                          <td className="col-matched">
                            {rec.matchedStudent ? (
                              <div className="matched-user-badge">
                                <strong>{rec.matchedStudent.name}</strong>
                                <span>{rec.matchedStudent.email}</span>
                                {rec.matchedStudent.registrationNumber && (
                                  <small>Reg: {rec.matchedStudent.registrationNumber}</small>
                                )}
                              </div>
                            ) : isAmbiguous ? (
                              <div className="ambiguous-candidates-box">
                                <span className="conflict-title">Pick matching student:</span>
                                {rec.candidates?.map((cand) => (
                                  <label key={cand._id} className="candidate-choice">
                                    <input
                                      type="radio"
                                      name={`ambig_${rec.rowNumber}`}
                                      checked={resolutions[rec.rowNumber] === cand._id}
                                      onChange={() =>
                                        setResolutions({ ...resolutions, [rec.rowNumber]: cand._id })
                                      }
                                    />
                                    <span>
                                      {cand.name} ({cand.email} - Reg: {cand.registrationNumber || "N/A"})
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">— Not Matched —</span>
                            )}
                          </td>
                          <td className="col-batch">
                            {rec.targetBatch ? (
                              <div className="batch-target-pill">
                                <strong>{rec.targetBatch.name}</strong>
                                <span>{rec.targetBatch.batchNumber}</span>
                                {rec.targetBatch.isNew && (
                                  <span className="new-batch-badge">New Batch</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="col-notes">
                            <span className="row-reason">{rec.reason}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-records-cell">
                        No records match the current tab filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="modal-actions preview-actions-bar">
              <div className="left-actions">
                <button
                  type="button"
                  className="btn-batch-secondary"
                  onClick={() => setStep("upload")}
                >
                  ← Upload Different File
                </button>
                {previewData.summary.unmatchedCount +
                  previewData.summary.ambiguousCount +
                  previewData.summary.invalidCount >
                  0 && (
                  <button
                    type="button"
                    className="btn-download-unmatched"
                    onClick={handleDownloadUnmatched}
                  >
                    <DownloadIcon size={14} /> Download Unmatched Records (.xlsx)
                  </button>
                )}
              </div>

              <div className="right-actions">
                <button type="button" className="btn-batch-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-gold"
                  disabled={confirming || previewData.summary.allocatedCount === 0}
                  onClick={handleConfirmAllocation}
                >
                  {confirming
                    ? "Allocating Students to Batches..."
                    : `Confirm & Allocate ${previewData.summary.allocatedCount} Student(s) →`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SUCCESS CONFIRMATION                                             */}
        {/* ========================================================================= */}
        {step === "success" && confirmedResult && (
          <div className="alloc-step-success">
            <div className="success-icon-wrap">
              <CheckCircleIcon size={56} />
            </div>
            <h4>Batch Allocation Completed Successfully!</h4>
            <p className="success-desc">
              {confirmedResult.message ||
                "All matched students have been assigned to their designated batches with zero re-registration needed."}
            </p>

            <div className="success-stats-box">
              <div className="stat-item">
                <span className="stat-val">{confirmedResult.allocatedCount}</span>
                <span className="stat-label">Students Assigned</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{confirmedResult.batchesCreatedCount}</span>
                <span className="stat-label">New Batches Created</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{confirmedResult.batchesUpdatedCount}</span>
                <span className="stat-label">Batches Updated</span>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: "center", marginTop: "2rem" }}>
              <button
                type="button"
                className="btn-primary-gold"
                onClick={() => {
                  onClose();
                  if (onSuccess) onSuccess();
                }}
              >
                View Batches & Enrolled Students →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HISTORY DRAWER / VIEW                                                    */}
        {/* ========================================================================= */}
        {step === "history" && (
          <div className="alloc-step-history">
            <h4>Past Student List Allocations & Audit Logs</h4>
            <p className="history-subtitle">
              Every spreadsheet import is securely audited with timestamp, author, and allocation summary.
            </p>

            {historyLoading ? (
              <div className="history-loading">Loading audit records...</div>
            ) : historyLogs.length > 0 ? (
              <div className="history-list">
                {historyLogs.map((log) => (
                  <div key={log._id} className="history-card">
                    <div className="history-card-header">
                      <div>
                        <strong>{log.fileName}</strong>
                        <span className="history-author">
                          Uploaded by: {log.uploadedBy?.name || "Admin"} ({log.uploadedBy?.email || ""})
                        </span>
                      </div>
                      <span className="history-date">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="history-metrics-row">
                      <span className="metric-pill metric-total">
                        Total: {log.summary?.totalRecords || 0}
                      </span>
                      <span className="metric-pill metric-allocated">
                        Allocated: {log.summary?.allocatedCount || 0}
                      </span>
                      <span className="metric-pill metric-unmatched">
                        Unmatched: {log.summary?.unmatchedCount || 0}
                      </span>
                      <span className="metric-pill metric-status">
                        Status: {log.status}
                      </span>
                    </div>

                    {log.batchAllocations?.length > 0 && (
                      <div className="history-batches-list">
                        Batches:{" "}
                        {log.batchAllocations.map((b) => (
                          <span key={b.batchId} className="batch-tag-small">
                            {b.batchName} ({b.studentCount} students)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="history-empty">
                No past student batch imports recorded for this institution yet.
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-batch-secondary"
                onClick={() => setStep("upload")}
              >
                ← Back to Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchAutoAllocationModal;
