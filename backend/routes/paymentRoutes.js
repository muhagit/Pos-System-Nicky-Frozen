import express from "express";
// Ingat, di ES Module Node.js wajib menyertakan ekstensi .js di akhir import file lokal
import {
    createTransaction,
    handleWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

// Endpoint: POST /api/payment/create
router.post("/create", createTransaction);

// Endpoint: POST /api/payment/webhook
router.post("/webhook", handleWebhook);

export default router;
