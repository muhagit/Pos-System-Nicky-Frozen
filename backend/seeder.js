import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Transaction from "./models/Transaction.js";
import User from "./models/User.js";

// Load env vars & koneksi DB langsung di sini
dotenv.config();

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Terhubung untuk Seeding..."))
    .catch((err) => {
        console.error("Koneksi Gagal:", err.message);
        process.exit(1);
    });

const importData = async () => {
    try {
        // 1. Bersihkan data lama (opsional, agar tidak duplikat jika dijalankan berkali-kali)
        await Product.deleteMany();
        await Transaction.deleteMany();

        console.log("Data lama dibersihkan. Memulai injeksi data baru...");

        // 2. Cari satu User Admin/Kasir untuk dijadikan penanggung jawab transaksi
        const adminUser = await User.findOne({ role: "Admin" });

        if (!adminUser) {
            console.error(
                "ERROR: Anda belum memiliki User Admin. Buat dulu via Postman!",
            );
            process.exit(1);
        }

        // 3. Siapkan Data Dummy Produk (Sengaja dibuat ada yang kritis dan menipis)
        const products = [
            {
                nama_produk: "Chicken Nugget Premium 500g",
                kategori: "Nugget",
                harga: 45000,
                stok_saat_ini: 120,
                batas_stok_minimum: 10,
                tanggal_expired: "2026-12-31",
            },
            {
                nama_produk: "Beef Meatball Super",
                kategori: "Meatball",
                harga: 35000,
                stok_saat_ini: 45, // Stok Normal
                batas_stok_minimum: 50, // Menipis (karena di bawah batas)
                tanggal_expired: "2026-10-15",
            },
            {
                nama_produk: "Mixed Vegetables 1kg",
                kategori: "Vegetables",
                harga: 28000,
                stok_saat_ini: 0, // Kritis!
                batas_stok_minimum: 15,
                tanggal_expired: "2027-01-20",
            },
            {
                nama_produk: "Fish Fillet Dory",
                kategori: "Seafood",
                harga: 55000,
                stok_saat_ini: 180,
                batas_stok_minimum: 20,
                tanggal_expired: "2026-11-30",
            },
            {
                nama_produk: "French Fries Crinkle Cut",
                kategori: "Fries",
                harga: 32000,
                stok_saat_ini: 320,
                batas_stok_minimum: 30,
                tanggal_expired: "2027-05-10",
            },
            {
                nama_produk: "Squid Ring Breaded",
                kategori: "Seafood",
                harga: 48000,
                stok_saat_ini: 12, // Menipis
                batas_stok_minimum: 15,
                tanggal_expired: "2026-08-25",
            },
        ];

        // Masukkan Produk ke Database dan simpan hasilnya (untuk mengambil _id mereka)
        const createdProducts = await Product.insertMany(products);
        console.log("Produk berhasil diinjeksi!");

        // 4. Siapkan Data Dummy Transaksi berdasarkan Produk yang baru dibuat
        const transactions = [
            {
                invoice: "TRX001",
                user_id: adminUser._id,
                cabang: adminUser.cabang,
                metode_pembayaran: "Cash",
                total_pembayaran: 90000,
                detail_transaksi: [
                    {
                        produk_id: createdProducts[0]._id, // Beli Chicken Nugget
                        kuantitas: 2,
                        harga_satuan: 45000,
                        subtotal: 90000,
                    },
                ],
            },
            {
                invoice: "TRX002",
                user_id: adminUser._id,
                cabang: adminUser.cabang,
                metode_pembayaran: "QRIS",
                total_pembayaran: 110000,
                detail_transaksi: [
                    {
                        produk_id: createdProducts[3]._id, // Beli Fish Fillet
                        kuantitas: 2,
                        harga_satuan: 55000,
                        subtotal: 110000,
                    },
                ],
            },
            {
                invoice: "TRX003",
                user_id: adminUser._id,
                cabang: adminUser.cabang,
                metode_pembayaran: "QRIS",
                total_pembayaran: 128000,
                detail_transaksi: [
                    {
                        produk_id: createdProducts[4]._id, // Beli French Fries
                        kuantitas: 4,
                        harga_satuan: 32000,
                        subtotal: 128000,
                    },
                ],
            },
        ];

        // Masukkan Transaksi ke Database
        await Transaction.insertMany(transactions);
        console.log("Transaksi berhasil diinjeksi!");

        console.log("✅ SEMUA DATA DUMMY BERHASIL DITAMBAHKAN!");
        process.exit();
    } catch (error) {
        console.error("❌ Gagal menginjeksi data:", error);
        process.exit(1);
    }
};

// Jalankan fungsi
importData();
