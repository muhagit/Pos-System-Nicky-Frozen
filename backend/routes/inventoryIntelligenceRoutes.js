import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getExpiryMonitoring, getInventoryLedger, getInventoryOverview, getLowStockMonitoring } from "../controllers/inventoryIntelligenceController.js";

const router = express.Router();
router.use(protect, authorize("Owner", "Admin"));
router.get("/overview", getInventoryOverview);
router.get("/expiry", getExpiryMonitoring);
router.get("/low-stock", getLowStockMonitoring);
router.get("/ledger", getInventoryLedger);
export default router;
