import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";

const generateUniqueInvoiceCode = async () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isUnique = false;
    let code = "";
    while (!isUnique) {
        code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const exists = await Transaction.findOne({ invoice: code });
        if (!exists) {
            isUnique = true;
        }
    }
    return code;
};

export const createTransaction = async (req, res) => {
    try {
        const {
            user_id,
            cabang,
            metode_pembayaran,
            total_pembayaran,
            detail_transaksi,
            is_hold,
            order_id,
            snap_token, // KUNCI UTAMA: Menangkap snap_token dari request React
        } = req.body;

        const branchName = (cabang && cabang !== "Pusat") ? cabang : "Cabang Jogja";

        if (!detail_transaksi || detail_transaksi.length === 0) {
            return res
                .status(400)
                .json({ message: "Tidak ada produk dalam transaksi" });
        }
        const baseOrderId = order_id.split("-REV")[0];
        // 1. CEK APAKAH TRANSAKSI SUDAH ADA (Melanjutkan dari Hold)
        const existingTrx = await Transaction.findOne({
            order_id: { $regex: new RegExp("^" + baseOrderId) },
        });
        if (existingTrx) {
            // Jika transaksi sudah lunas / sukses (bukan hold lagi), abaikan request penulisan ulang stok
            if (!existingTrx.is_hold) {
                return res.status(200).json({
                    message: "Transaksi sudah berhasil diproses sebelumnya.",
                    transaction: existingTrx,
                });
            }

            // Resolve branch name
            const branchName = (cabang && cabang !== "Pusat") ? cabang : "Cabang Jogja";
            const virtualStocks = {};

            // Tambahkan stok dari transaksi hold lama ke virtual map
            for (const item of existingTrx.detail_transaksi) {
                const prodId = item.produk_id.toString();
                if (!virtualStocks[prodId]) {
                    const product = await Product.findById(item.produk_id);
                    const initStock = product ? (product.stok_cabang ? (product.stok_cabang.get(branchName) || 0) : 0) : 0;
                    virtualStocks[prodId] = {
                        product,
                        stok: initStock,
                    };
                }
                virtualStocks[prodId].stok += item.kuantitas;
            }

            // Kurangi stok berdasarkan keranjang belanja yang baru di virtual map dan validasi
            for (const item of detail_transaksi) {
                const prodId = item.produk_id.toString();
                if (!virtualStocks[prodId]) {
                    const product = await Product.findById(item.produk_id);
                    const initStock = product ? (product.stok_cabang ? (product.stok_cabang.get(branchName) || 0) : 0) : 0;
                    virtualStocks[prodId] = {
                        product,
                        stok: initStock,
                    };
                }

                if (!virtualStocks[prodId].product) {
                    return res.status(404).json({
                        message: "Produk tidak ditemukan",
                    });
                }

                if (virtualStocks[prodId].stok < item.kuantitas) {
                    return res.status(400).json({
                        message: `Stok ${virtualStocks[prodId].product.nama_produk} tidak mencukupi di ${branchName}!`,
                    });
                }
                virtualStocks[prodId].stok -= item.kuantitas;
            }

            // Jika semua validasi lolos, barulah kita simpan data stok baru ke database secara aman
            for (const prodId in virtualStocks) {
                const { product, stok } = virtualStocks[prodId];
                if (product) {
                    product.stok_cabang.set(branchName, stok);
                    product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
                    await product.save();
                }
            }

            // Update data transaksi lama dengan data revisi baru dari kasir
            existingTrx.user_id = user_id;
            existingTrx.order_id = order_id; // KUNCI: Menyimpan ID baru yang memiliki suffix -REV agar sinkron dengan Midtrans
            existingTrx.metode_pembayaran = metode_pembayaran;
            existingTrx.total_pembayaran = total_pembayaran;
            existingTrx.detail_transaksi = detail_transaksi;
            existingTrx.is_hold = is_hold !== undefined ? is_hold : false;

            if (snap_token) {
                existingTrx.snap_token = snap_token;
            }

            if (!existingTrx.invoice) {
                existingTrx.invoice = await generateUniqueInvoiceCode();
            }

            await existingTrx.save();

            return res.status(200).json({
                message: "Transaksi berhasil diperbarui!",
                transaction: existingTrx,
            });
        }

        // ========================================================
        // 2. JIKA MERUPAKAN TRANSAKSI BARU GRES
        // ========================================================
        for (const item of detail_transaksi) {
            const product = await Product.findById(item.produk_id);
            if (!product)
                return res
                    .status(404)
                    .json({ message: `Produk tidak ditemukan` });
            
            const currentBranchStock = product.stok_cabang ? (product.stok_cabang.get(branchName) || 0) : 0;
            if (currentBranchStock < item.kuantitas) {
                return res.status(400).json({
                    message: `Stok ${product.nama_produk} tidak mencukupi di ${branchName}! Sisa stok: ${currentBranchStock}`,
                });
            }
        }

        for (const item of detail_transaksi) {
            const product = await Product.findById(item.produk_id);
            const currentBranchStock = product.stok_cabang ? (product.stok_cabang.get(branchName) || 0) : 0;
            product.stok_cabang.set(branchName, Math.max(0, currentBranchStock - item.kuantitas));
            product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
            await product.save();
        }

        const invoiceCode = await generateUniqueInvoiceCode();

        const transaction = await Transaction.create({
            order_id: order_id,
            user_id,
            cabang,
            metode_pembayaran,
            total_pembayaran,
            detail_transaksi,
            is_hold: is_hold !== undefined ? is_hold : false,
            snap_token: snap_token || "", // Simpan token ke database
            invoice: invoiceCode,
        });

        res.status(201).json({
            message: "Transaksi berhasil diproses",
            transaction,
        });
    } catch (error) {
        // Log tambahan agar jika terjadi error, alasannya terlihat jelas di terminal VSCode
        console.error("Backend Error:", error);
        res.status(500).json({
            message: "Gagal memproses transaksi",
            error: error.message,
        });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const query = { is_hold: false };
        if (req.user && (req.user.role === "Admin" || req.user.role === "Kasir")) {
            query.cabang = req.user.cabang;
        }
        const transactions = await Transaction.find(query)
            .populate("user_id", "nama_lengkap")
            .populate({
                path: "detail_transaksi.produk_id",
                select: "nama_produk harga kategori",
            })
            .sort({ createdAt: -1 });

        const formatted = transactions.map((trx) => ({
            id: trx._id,
            invoice: trx.invoice || trx._id.toString().slice(-6).toUpperCase(),
            customer: trx.user_id?.nama_lengkap || "Walk In Customer",
            payment: trx.metode_pembayaran,
            total: trx.total_pembayaran,
            status: "Success",
            date: trx.createdAt,
            details: trx.detail_transaksi,
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
        const query = { is_hold: true };
        if (req.user && (req.user.role === "Admin" || req.user.role === "Kasir")) {
            query.cabang = req.user.cabang;
        }
        // Jangan di-map/format ulang, kirim data utuh (raw document) ke frontend
        const data = await Transaction.find(query)
            .populate("user_id", "nama_lengkap")
            // Populate produk_id di dalam detail_transaksi agar nama produk terbawa ke frontend
            .populate({
                path: "detail_transaksi.produk_id",
                select: "nama_produk harga stok_saat_ini",
            })
            .sort({ createdAt: -1 });

        // Frontend HoldPage yang baru dibuat sebelumnya sudah menyesuaikan
        // untuk membaca properti bawaan MongoDB seperti hold._id, hold.createdAt
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const trx = await Transaction.findById(id);

        if (!trx) {
            return res
                .status(404)
                .json({ message: "Transaksi tidak ditemukan" });
        }

        // Jika transaksi ini adalah Hold, kembalikan stok produknya ke rak
        if (trx.is_hold) {
            for (const item of trx.detail_transaksi) {
                const product = await Product.findById(item.produk_id);
                if (product) {
                    product.stok_saat_ini += item.kuantitas;
                    await product.save();
                }
            }
        }

        // Hapus dari database
        await Transaction.findByIdAndDelete(id);

        res.status(200).json({
            message: "Transaksi berhasil dihapus dan stok telah dikembalikan",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReport = async (req, res) => {
    try {
        const query = { is_hold: false };
        if (req.user && (req.user.role === "Admin" || req.user.role === "Kasir")) {
            query.cabang = req.user.cabang;
        }
        const transactions = await Transaction.find(query)
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
        const isAdminOrKasir = req.user && (req.user.role === "Admin" || req.user.role === "Kasir");
        const cabang = isAdminOrKasir ? req.user.cabang : null;

        // =========================
        // 1. TRANSACTION NOTIF
        // =========================
        const query = {};
        if (isAdminOrKasir) {
            query.cabang = cabang;
        }
        const transactions = await Transaction.find(query)
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
            const stock = isAdminOrKasir 
                ? (p.stok_cabang ? (p.stok_cabang.get(cabang) || 0) : 0)
                : p.stok_saat_ini;
            if (stock <= 5 && stock > 0) {
                notifications.push({
                    type: "warning",
                    title: "Low Stock Alert",
                    message: `${p.nama_produk} stock is running low (${stock} left).`,
                    time: new Date(),
                });
            }

            if (stock === 0) {
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

export const finalizeTransaction = async (req, res) => {
    try {
        const { order_id } = req.body;
        const baseOrderId = order_id.split("-REV")[0];
        const trx = await Transaction.findOne({
            order_id: { $regex: new RegExp("^" + baseOrderId) },
        });

        if (!trx) {
            return res
                .status(404)
                .json({ message: "Transaksi tidak ditemukan" });
        }

        if (trx.is_hold) {
            trx.is_hold = false;
            await trx.save();
            console.log(`Transaksi ${order_id} berhasil difinalisasi via fallback.`);
        }

        res.status(200).json({
            message: "Transaksi berhasil difinalisasi",
            transaction: trx,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};