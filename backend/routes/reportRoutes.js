import express from "express";
import {
    createDailyReport,
    getReports,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/tutup-buku", protect, authorize("Owner"), createDailyReport);
router.get("/", protect, authorize("Owner"), getReports);
export default router;
