import express from "express";
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCategories);
router.post("/", protect, authorize("Owner", "Admin"), createCategory);
router.put("/:id", protect, authorize("Owner", "Admin"), updateCategory);
router.delete("/:id", protect, authorize("Owner", "Admin"), deleteCategory);

export default router;
