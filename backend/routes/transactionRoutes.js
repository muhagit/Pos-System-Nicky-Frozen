import express from "express";
import {
    createTransaction,
    getTransactions,
} from "../controllers/transactionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js"; // Pastikan namanya authorize

const router = express.Router();

// Gunakan 'authorize', bukan 'authorizeRoles'
router.post("/", protect, authorize("Kasir", "Admin"), createTransaction);

// Tambahkan 'Admin' dan gunakan 'authorize'
router.get("/", protect, authorize("Owner", "Kasir", "Admin"), getTransactions);

export default router;
