import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/productRoutes.js"; // <-- Tambahkan ini
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Daftarkan route produk di sini
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
    res.send("API Sistem POS Nicky Frozen Berjalan dengan Baik!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
});
