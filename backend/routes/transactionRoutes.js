import express from "express";
import {
    createTransaction,
    getTransactions,
    getHoldTransactions,
    getReport,
    getNotifications,
} from "../controllers/transactionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js"; // Pastikan namanya authorize


const router = express.Router();

// transaksi
router.post("/", protect, authorize("Kasir", "Admin"), createTransaction);
router.get("/", protect, authorize("Owner", "Kasir", "Admin"), getTransactions);

// hold
router.get("/hold", getHoldTransactions);

// report
router.get("/report", getReport);

// notifications
router.get("/notifications", getNotifications);

export default router;