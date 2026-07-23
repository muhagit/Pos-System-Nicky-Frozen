import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import { connectDB } from "./config/db.js";

import productRoutes from "./routes/productRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";

const app = express();

/* ============================================================
   DATABASE
============================================================ */
connectDB();

/* ============================================================
   CORS CONFIGURATION
============================================================ */
const allowedOrigins = [
    "http://localhost:5173", // Development
    process.env.FRONTEND_URL, // Production (Vercel)
].filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

app.use(
    cors({
        origin: (origin, callback) => {
            // Mengizinkan request tanpa Origin (Postman, Thunder Client, dll.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.warn(`CORS blocked request from: ${origin}`);
            return callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

/* ============================================================
   MIDDLEWARE
============================================================ */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ============================================================
   DEBUG (Development Only)
============================================================ */
if (process.env.NODE_ENV !== "production") {
    console.log("JWT_SECRET Loaded :", !!process.env.JWT_SECRET);
    console.log("MONGO_URI Loaded  :", !!process.env.MONGO_URI);
}

/* ============================================================
   STATIC FILES
============================================================ */
const __dirname = path.resolve();

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

/* ============================================================
   ROUTES
============================================================ */
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/branches", branchRoutes);

/* ============================================================
   HEALTH CHECK
============================================================ */
app.get("/", (req, res) => {
    res.status(200).send("API Sistem POS Nicky Frozen Berjalan dengan Baik!");
});

/* ============================================================
   404 HANDLER
============================================================ */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint tidak ditemukan.",
    });
});

/* ============================================================
   GLOBAL ERROR HANDLER
============================================================ */
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Terjadi kesalahan pada server.",
    });
});

/* ============================================================
   START SERVER
============================================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan pada port ${PORT}`);
});