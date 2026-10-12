import mongoose from "mongoose";

const batchAllocationAuditSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileHash: {
      type: String,
      default: "",
      trim: true
    },
    summary: {
      totalRecords: { type: Number, default: 0 },
      matchedCount: { type: Number, default: 0 },
      allocatedCount: { type: Number, default: 0 },
      unmatchedCount: { type: Number, default: 0 },
      duplicateCount: { type: Number, default: 0 },
      ambiguousCount: { type: Number, default: 0 },
      invalidCount: { type: Number, default: 0 }
    },
    batchAllocations: [
      {
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Batch"
        },
        batchName: { type: String, default: "" },
        batchNumber: { type: String, default: "" },
        studentIds: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          }
        ],
        studentCount: { type: Number, default: 0 }
      }
    ],
    unmatchedRecords: [
      {
        rowNumber: { type: Number },
        data: { type: mongoose.Schema.Types.Mixed },
        reason: { type: String, default: "No matching student found" }
      }
    ],
    status: {
      type: String,
      enum: ["previewed", "confirmed", "cancelled"],
      default: "confirmed"
    }
  },
  {
    timestamps: true
  }
);

batchAllocationAuditSchema.index({ organizationId: 1, createdAt: -1 });

const BatchAllocationAudit = mongoose.model(
  "BatchAllocationAudit",
  batchAllocationAuditSchema
);

export default BatchAllocationAudit;
