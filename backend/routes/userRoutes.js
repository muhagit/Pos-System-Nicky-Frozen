import express from "express";
import {
    getUsers,
    registerUser,
    deleteUser,
    updateUser,
    verifyUserStep1,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// 0. VERIFY STEP 1: Cek username & email unik + aktif
router.post("/verify-step1", protect, authorize("Owner", "Admin"), verifyUserStep1);

// 1. READ: Mengambil semua user
router.get("/", protect, authorize("Owner", "Admin", "Kasir"), getUsers);

// 2. CREATE: Menambah user baru
router.post("/", protect, authorize("Owner", "Admin"), registerUser);

// 3. UPDATE: Mengedit user (PASTIKAN BARIS INI ADA SEBELUM EXPORT)
router.put("/:id", protect, authorize("Owner", "Admin"), updateUser);

// 4. DELETE: Menghapus user
router.delete("/:id", protect, authorize("Owner", "Admin"), deleteUser);

export default router;
