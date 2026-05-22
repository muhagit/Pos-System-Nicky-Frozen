import express from "express";
import {
    createTransaction,
    getTransactions,
    getHoldTransactions,
    getReport,
    getNotifications,
} from "../controllers/transactionController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// transaksi
router.post("/", protect, authorize("Kasir", "Admin"), createTransaction);
router.get("/", protect, authorize("Owner"), getTransactions);

// hold
router.get("/hold", getHoldTransactions);

// report
router.get("/report", getReport);

// notifications
router.get("/notifications", getNotifications);

export default router;