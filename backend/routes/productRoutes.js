import express from "express";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    transferStock,
    adjustStock,
    getTransferLogs,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js"; // <-- Import multer

const router = express.Router();

router.get("/", protect, getProducts);

// Route untuk transfer stok antar cabang
router.post(
    "/transfer",
    protect,
    authorize("Owner", "Admin"),
    transferStock
);

// Route untuk adjustment stok (Stock Opname) manual per cabang
router.post(
    "/adjust",
    protect,
    authorize("Owner", "Admin"),
    adjustStock
);

// Route untuk mengambil logs mutasi transfer & adjust
router.get(
    "/transfer-logs",
    protect,
    authorize("Owner", "Admin"),
    getTransferLogs
);

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
