import express from "express";
import { getOwnerDashboard } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/owner", protect, authorize("Owner", "Admin"), getOwnerDashboard);

export default router;
