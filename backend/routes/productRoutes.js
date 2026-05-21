import express from "express";
import {
    createProduct,
    getProducts,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js"; // <-- Import middleware

const router = express.Router();

// Hanya bisa diakses jika sudah login DAN memiliki role Admin atau Owner
router.post("/", protect, authorize("Admin", "Owner"), createProduct);

// Bisa diakses oleh siapa saja yang sudah login (Kasir, Admin, Owner)
router.get("/", protect, getProducts);

export default router;
