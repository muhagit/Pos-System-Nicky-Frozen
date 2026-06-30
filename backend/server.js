import "dotenv/config"; // Gunakan cara ini agar .env dibaca paling pertama sebelum import lainnya!
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import path from "path";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js"; 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi Database
connectDB();

// Daftarkan semua route di sini
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Konfigurasi folder statis untuk gambar
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Route utama (Test server)
app.get("/", (req, res) => {
    res.send("API Sistem POS Nicky Frozen Berjalan dengan Baik!");
});

// Menjalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
});
