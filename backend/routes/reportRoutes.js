import express from "express";
import {
    createDailyReport,
    getReports,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/tutup-buku", protect, authorize("Owner", "Admin"), createDailyReport);
router.get("/", protect, authorize("Owner", "Admin"), getReports);
export default router;