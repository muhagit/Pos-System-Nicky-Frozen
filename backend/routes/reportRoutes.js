import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    createDailyReport,
    getReports,
    getReportDetail,
    downloadEcho,
    startShift,
    endShift,
    getActiveShift,
} from "../controllers/reportController.js";

const router = express.Router();

// Shift management routes (Kasir)
router.post("/start-shift", protect, authorize("Owner", "Admin", "Kasir"), startShift);
router.post("/end-shift", protect, authorize("Owner", "Admin", "Kasir"), endShift);
router.get("/active-shift", protect, authorize("Owner", "Admin", "Kasir"), getActiveShift);

// Tutup buku & reports
router.post("/tutup-buku", protect, authorize("Owner", "Admin", "Kasir"), createDailyReport);
router.get("/", protect, authorize("Owner", "Admin", "Kasir"), getReports);
router.get("/detail/:tanggal", protect, authorize("Owner", "Admin", "Kasir"), getReportDetail);

// Download echo (public, no auth needed for form submission)
router.post("/download-echo", downloadEcho);

export default router;