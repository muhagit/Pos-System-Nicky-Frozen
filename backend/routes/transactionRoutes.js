import express from "express";
import {
    createTransaction,
    getTransactions,
    getHoldTransactions,
    getReport,
    getNotifications,
    deleteTransaction,
    finalizeTransaction,
} from "../controllers/transactionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// TRANSAKSI
// ==========================================
// Hanya Kasir dan Admin yang bisa membuat transaksi
router.post("/", protect, authorize("Kasir", "Admin"), createTransaction);
router.post("/finalize", protect, authorize("Kasir", "Admin"), finalizeTransaction);

// Owner, Kasir, dan Admin bisa melihat riwayat transaksi
router.get("/", protect, authorize("Owner", "Kasir", "Admin"), getTransactions);

// ==========================================
// HOLD TRANSAKSI
// ==========================================
// Kasir dan Admin butuh akses ke transaksi yang di-hold
router.get("/hold", protect, authorize("Kasir", "Admin"), getHoldTransactions);

// ==========================================
// REPORT (LAPORAN)
// ==========================================
// Laporan pendapatan biasanya rahasia, hanya untuk Owner dan Admin
router.get("/report", protect, authorize("Owner", "Admin"), getReport);

// ==========================================
// NOTIFICATIONS
// ==========================================
// Semua role yang berkepentingan bisa melihat notifikasi (stok menipis, dll)
router.get(
    "/notifications",
    protect,
    authorize("Owner", "Admin", "Kasir"),
    getNotifications,
);

router.delete("/:id", protect, authorize("Kasir"), deleteTransaction)

export default router;
