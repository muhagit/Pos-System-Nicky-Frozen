import express from "express";
import {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch
} from "../controllers/branchController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua user terotentikasi bisa mengambil daftar cabang untuk dropdown/filter
router.get("/", protect, getBranches);

// Hanya Owner yang bisa menambah, mengubah, atau menghapus cabang
router.post("/", protect, authorize("Owner"), createBranch);
router.put("/:id", protect, authorize("Owner"), updateBranch);
router.delete("/:id", protect, authorize("Owner"), deleteBranch);

export default router;
