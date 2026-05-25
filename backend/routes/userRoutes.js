import express from "express";
import {
    getUsers,
    registerUser,
    deleteUser,
    updateUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route untuk mengambil semua data user (Ini yang memicu 404 jika tidak ada)
router.get("/", protect, authorize("Owner", "Admin"), getUsers);

// Route lainnya...
router.post("/", protect, authorize("Owner", "Admin"), registerUser);
router.delete("/:id", protect, authorize("Owner", "Admin"), deleteUser);

export default router;
