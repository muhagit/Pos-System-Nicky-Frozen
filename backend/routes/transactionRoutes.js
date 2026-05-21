import express from "express";
import {
    createTransaction,
    getTransactions,
} from "../controllers/transactionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Hanya Kasir yang biasanya menginput transaksi langsung
router.post("/", protect, authorize("Kasir", "Admin"), createTransaction);

// Hanya Owner yang boleh melihat semua riwayat transaksi untuk audit
router.get("/", protect, authorize("Owner"), getTransactions);

export default router;
