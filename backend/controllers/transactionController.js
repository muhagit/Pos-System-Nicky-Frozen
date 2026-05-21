import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";

export const createTransaction = async (req, res) => {
    try {
        const {
            user_id,
            cabang,
            metode_pembayaran,
            total_pembayaran,
            detail_transaksi,
        } = req.body;

        if (!detail_transaksi || detail_transaksi.length === 0) {
            return res
                .status(400)
                .json({ message: "Tidak ada produk dalam transaksi" });
        }

        // 1. Cek Ketersediaan Stok
        for (const item of detail_transaksi) {
            const product = await Product.findById(item.produk_id);

            if (!product) {
                return res
                    .status(404)
                    .json({ message: `Produk tidak ditemukan` });
            }

            if (product.stok_saat_ini < item.kuantitas) {
                return res.status(400).json({
                    message: `Stok ${product.nama_produk} tidak mencukupi! Sisa stok: ${product.stok_saat_ini}`,
                });
            }
        }

        // 2. Kurangi Stok Produk
        for (const item of detail_transaksi) {
            const product = await Product.findById(item.produk_id);
            product.stok_saat_ini -= item.kuantitas;
            await product.save();
        }

        // 3. Simpan Data Transaksi
        const transaction = await Transaction.create({
            user_id,
            cabang,
            metode_pembayaran,
            total_pembayaran,
            detail_transaksi,
        });

        res.status(201).json({
            message: "Transaksi berhasil diproses",
            transaction,
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal memproses transaksi",
            error: error.message,
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({})
            .populate("user_id", "nama_lengkap")
            .populate("detail_transaksi.produk_id", "nama_produk harga");

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data transaksi",
            error: error.message,
        });
    }
};
