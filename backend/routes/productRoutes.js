import express from "express";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js"; // <-- Import multer

const router = express.Router();

router.get("/", protect, getProducts);

// <-- Tambahkan upload.single("gambar") di sini
router.post(
    "/",
    protect,
    authorize("Owner", "Admin"),
    upload.single("gambar"),
    createProduct,
);

// <-- Tambahkan upload.single("gambar") di sini
router.put(
    "/:id",
    protect,
    authorize("Owner", "Admin"),
    upload.single("gambar"),
    updateProduct,
);

router.delete("/:id", protect, authorize("Owner", "Admin"), deleteProduct);

export default router;
