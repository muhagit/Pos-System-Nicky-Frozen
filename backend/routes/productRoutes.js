import express from "express";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua user yang login (termasuk kasir) biasanya boleh melihat daftar produk
router.get("/", protect, getProducts);

// CREATE: Pastikan Admin dan Owner boleh menambah produk
router.post("/", protect, authorize("Owner", "Admin"), createProduct);

// UPDATE: Pastikan Admin dan Owner boleh mengedit produk
router.put("/:id", protect, authorize("Owner", "Admin"), updateProduct);

// DELETE: Pastikan Admin dan Owner boleh menghapus produk
router.delete("/:id", protect, authorize("Owner", "Admin"), deleteProduct);

export default router;
