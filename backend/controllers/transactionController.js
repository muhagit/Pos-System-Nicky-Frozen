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
            is_hold,
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
            is_hold: is_hold || false,
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
            .sort({ createdAt: -1 });

        const formatted = transactions.map((trx) => ({
            id: trx._id,
            invoice: trx._id.toString().slice(-6).toUpperCase(),
            customer: trx.user_id?.nama_lengkap || "Walk In Customer",
            payment: trx.metode_pembayaran,
            total: trx.total_pembayaran,
            status: "Success",
            date: trx.createdAt,
        }));

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data transaksi",
            error: error.message,
        });
    }
};

export const getHoldTransactions = async (req, res) => {
    try {
        const data = await Transaction.find({ is_hold: true })
            .populate("user_id", "nama_lengkap")
            .sort({ createdAt: -1 });

        const formatted = data.map((trx) => ({
            id: trx._id,
            invoice: trx._id.toString().slice(-6).toUpperCase(),
            customer: trx.user_id?.nama_lengkap || "Walk In Customer",
            payment: trx.metode_pembayaran,
            total: trx.total_pembayaran,
            status: "Hold",
            date: trx.createdAt,
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReport = async (req, res) => {
    try {
        const transactions = await Transaction.find({ is_hold: false })
            .populate("user_id", "nama_lengkap")
            .sort({ createdAt: -1 });

        // TOTAL REVENUE
        const totalRevenue = transactions.reduce(
            (sum, trx) => sum + trx.total_pembayaran,
            0
        );

        // TOTAL TRANSACTIONS
        const totalTransactions = transactions.length;

        // PAYMENT METHODS COUNT
        const paymentMethods = {
            Cash: 0,
            QRIS: 0,
            Transfer: 0,
            Card: 0,
        };

        transactions.forEach((trx) => {
            if (paymentMethods[trx.metode_pembayaran] !== undefined) {
                paymentMethods[trx.metode_pembayaran]++;
            }
        });

        // RECENT TRANSACTIONS (limit 5)
        const recent = transactions.slice(0, 5).map((trx) => ({
            invoice: trx._id.toString().slice(-6).toUpperCase(),
            payment: trx.metode_pembayaran,
            cashier: trx.user_id?.nama_lengkap || "Unknown",
            date: trx.createdAt,
            total: trx.total_pembayaran,
        }));

        res.json({
            totalRevenue,
            totalTransactions,
            paymentMethods,
            recent,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getNotifications = async (req, res) => {
    try {
        const notifications = [];

        // =========================
        // 1. TRANSACTION NOTIF
        // =========================
        const transactions = await Transaction.find({})
            .populate("user_id", "nama_lengkap")
            .sort({ createdAt: -1 })
            .limit(10);

        transactions.forEach((trx) => {
            notifications.push({
                type: trx.is_hold ? "hold" : "success",
                title: trx.is_hold
                    ? "Transaction Hold"
                    : "Transaction Success",
                message: `Invoice ${trx._id
                    .toString()
                    .slice(-6)
                    .toUpperCase()} has been processed.`,
                time: trx.createdAt,
            });
        });

        // =========================
        // 2. PRODUCT LOW STOCK
        // =========================
        const products = await Product.find({});

        products.forEach((p) => {
            if (p.stok_saat_ini <= 5 && p.stok_saat_ini > 0) {
                notifications.push({
                    type: "warning",
                    title: "Low Stock Alert",
                    message: `${p.nama_produk} stock is running low (${p.stok_saat_ini} left).`,
                    time: new Date(),
                });
            }

            if (p.stok_saat_ini === 0) {
                notifications.push({
                    type: "expired",
                    title: "Out of Stock",
                    message: `${p.nama_produk} is out of stock.`,
                    time: new Date(),
                });
            }
        });

        // SORT NEWEST FIRST
        notifications.sort(
            (a, b) => new Date(b.time) - new Date(a.time)
        );

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};