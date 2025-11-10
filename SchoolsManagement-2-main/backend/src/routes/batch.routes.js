import express from "express";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  updateBatchStatus,
  getPendingBatches
} from "../controllers/batch.controllers.js";
import { requireSignIn, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireSignIn);

// Create a new batch
router.post("/", createBatch);

// Get all batches with filters
router.get("/", getAllBatches);

// Get pending batches (Super Admin only)
router.get("/pending/all", isAdmin, getPendingBatches);

// Get batch by ID
router.get("/:id", getBatchById);

// Update batch
router.put("/:id", updateBatch);

// Update batch status (Admin only)
router.patch("/:id/status", isAdmin, updateBatchStatus);

// Delete batch
router.delete("/:id", deleteBatch);

export default router;
