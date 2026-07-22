import Product from "../models/Product.js";
import ProductBatch from "../models/ProductBatch.js";
import Transaction from "../models/Transaction.js";
import StockTransferLog from "../models/StockTransferLog.js";
import Branch from "../models/Branch.js";

const startOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const expiryMeta = (date, today = startOfToday()) => {
    if (!date) return { bucket: "NORMAL", daysLeft: null, label: "No expiry" };
    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((expiry - today) / 86400000);
    if (daysLeft < 0) return { bucket: "EXPIRED", daysLeft, label: "Expired" };
    if (daysLeft === 0) return { bucket: "TODAY", daysLeft, label: "Expiring today" };
    if (daysLeft <= 7) return { bucket: "D7", daysLeft, label: "≤ 7 days" };
    if (daysLeft <= 30) return { bucket: "D30", daysLeft, label: "≤ 30 days" };
    return { bucket: "NORMAL", daysLeft, label: "Normal" };
};

const scopeProducts = (user) => (user?.role === "Admin" ? { [`stok_cabang.${user.cabang}`]: { $exists: true } } : {});

const productStock = (product, user) => user?.role === "Admin"
    ? (product.stok_cabang?.get(user.cabang) || 0)
    : product.stok_saat_ini;

export const getInventoryOverview = async (req, res) => {
    try {
        const today = startOfToday();
        const d7 = new Date(today); d7.setDate(d7.getDate() + 7);
        const d30 = new Date(today); d30.setDate(d30.getDate() + 30);
        const productQuery = { status: "ACTIVE", ...scopeProducts(req.user) };
        const batchScope = req.user?.role === "Admin" ? { [`stok_cabang.${req.user.cabang}`]: { $gt: 0 } } : {};
        const [products, batches, branches] = await Promise.all([
            Product.find(productQuery).lean(),
            ProductBatch.find({ status: { $ne: "ARCHIVED" }, ...batchScope }).populate("produk_id", "nama_produk kategori batas_stok_minimum").lean(),
            Branch.find({ isActive: true }).select("name").lean(),
        ]);
        const activeBatches = batches.filter((b) => b.status === "ACTIVE" && b.stok_saat_ini > 0);
        const lowStock = products.filter((p) => { const stock = productStock(p, req.user); return stock > 0 && stock <= p.batas_stok_minimum; });
        const outOfStock = products.filter((p) => productStock(p, req.user) === 0);
        const expiry = batches.map((b) => ({ ...b, ...expiryMeta(b.tanggal_expired, today) }));
        const byBranch = (req.user?.role === "Admin" ? [req.user.cabang] : branches.map((b) => b.name)).map((name) => ({
            name, stock: products.reduce((sum, p) => sum + (p.stok_cabang?.[name] || 0), 0),
        }));
        const categoryMap = products.reduce((map, p) => { map[p.kategori] = (map[p.kategori] || 0) + productStock(p, req.user); return map; }, {});
        const recommendations = [
            ...outOfStock.slice(0, 3).map((p) => ({ severity: "CRITICAL", type: "RESTOCK", productId: p._id, text: `Restock ${p.nama_produk}`, reason: "stok sudah habis." })),
            ...lowStock.slice(0, 4).map((p) => ({ severity: "WARNING", type: "RESTOCK", productId: p._id, text: `Restock ${p.nama_produk}`, reason: `stok tinggal ${productStock(p, req.user)} dari batas minimum ${p.batas_stok_minimum}.` })),
            ...expiry.filter((b) => ["EXPIRED", "TODAY", "D7"].includes(b.bucket) && b.stok_saat_ini > 0).slice(0, 4).map((b) => ({ severity: b.bucket === "EXPIRED" ? "CRITICAL" : "WARNING", type: "BATCH", productId: b.produk_id?._id, batchId: b._id, text: b.bucket === "EXPIRED" ? `Isolasi batch ${b.batch_number}` : `Segera jual ${b.produk_id?.nama_produk || "produk"}`, reason: b.bucket === "EXPIRED" ? "batch sudah expired." : `expired ${b.daysLeft} hari lagi.` })),
        ];
        const critical = outOfStock.length + expiry.filter((b) => b.bucket === "EXPIRED" && b.stok_saat_ini > 0).length;
        const warning = lowStock.length + expiry.filter((b) => ["TODAY", "D7", "D30"].includes(b.bucket) && b.stok_saat_ini > 0).length;
        res.json({
            cards: { totalActiveProducts: products.length, totalActiveBatches: activeBatches.length, totalInventory: products.reduce((s, p) => s + productStock(p, req.user), 0), lowStockProducts: lowStock.length, expiredBatches: expiry.filter((b) => b.bucket === "EXPIRED").length, expiring7Days: expiry.filter((b) => ["TODAY", "D7"].includes(b.bucket)).length, expiring30Days: expiry.filter((b) => b.bucket === "D30").length, outOfStock: outOfStock.length },
            health: { critical, warning, healthyPercent: products.length ? Math.max(0, Math.round(((products.length - new Set([...lowStock, ...outOfStock].map((p) => String(p._id))).size) / products.length) * 100)) : 100 },
            charts: { byBranch, byCategory: Object.entries(categoryMap).map(([name, stock]) => ({ name, stock })), batchStatus: ["ACTIVE", "DEPLETED", "EXPIRED"].map((name) => ({ name, value: batches.filter((b) => b.status === name).length })), expiryTrend: ["EXPIRED", "TODAY", "D7", "D30", "NORMAL"].map((name) => ({ name, value: expiry.filter((b) => b.bucket === name).length })), lowStockTrend: [{ name: "Critical", value: outOfStock.length }, { name: "Warning", value: lowStock.length }, { name: "Healthy", value: Math.max(0, products.length - outOfStock.length - lowStock.length) }] },
            recommendations,
            notifications: recommendations.slice(0, 8).map((item) => ({ ...item, title: item.severity === "CRITICAL" ? "Critical inventory alert" : "Inventory attention needed" })),
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getExpiryMonitoring = async (req, res) => {
    try {
        const { search = "", bucket = "ALL", page = 1, limit = 20, sort = "expiry" } = req.query;
        const today = startOfToday();
        const branchScope = req.user?.role === "Admin" ? { [`stok_cabang.${req.user.cabang}`]: { $gt: 0 } } : {};
        const batches = await ProductBatch.find({ status: { $ne: "ARCHIVED" }, ...branchScope }).populate("produk_id", "nama_produk sku kategori").lean();
        let rows = batches.map((b) => ({ ...b, ...expiryMeta(b.tanggal_expired, today), branch: req.user?.role === "Admin" ? req.user.cabang : "All branches" })).filter((b) => b.produk_id && (`${b.batch_number} ${b.produk_id.nama_produk} ${b.produk_id.sku || ""}`).toLowerCase().includes(search.toLowerCase()));
        if (bucket !== "ALL") rows = rows.filter((b) => b.bucket === bucket);
        rows.sort((a, b) => sort === "stock" ? a.stok_saat_ini - b.stok_saat_ini : (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity));
        const total = rows.length, take = Math.min(Math.max(Number(limit), 1), 100), current = Math.max(Number(page), 1);
        res.json({ rows: rows.slice((current - 1) * take, current * take), pagination: { total, page: current, limit: take, pages: Math.ceil(total / take) }, counts: ["EXPIRED", "TODAY", "D7", "D30", "NORMAL"].reduce((a, key) => ({ ...a, [key]: rows.filter((b) => b.bucket === key).length }), {}) });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getLowStockMonitoring = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 20 } = req.query;
        const products = await Product.find({ status: "ACTIVE", ...scopeProducts(req.user) }).lean();
        let rows = products.flatMap((p) => {
            const branches = req.user?.role === "Admin" ? [req.user.cabang] : Object.keys(p.stok_cabang || {});
            return branches.map((branch) => ({ product: p, branch, remainingStock: p.stok_cabang?.[branch] || 0, minimumStock: p.batas_stok_minimum || 5 })).filter((r) => r.remainingStock <= r.minimumStock);
        }).filter((r) => `${r.product.nama_produk} ${r.product.sku || ""} ${r.branch}`.toLowerCase().includes(search.toLowerCase()));
        rows.sort((a, b) => (a.remainingStock / Math.max(a.minimumStock, 1)) - (b.remainingStock / Math.max(b.minimumStock, 1)));
        const total = rows.length, take = Math.min(Math.max(Number(limit), 1), 100), current = Math.max(Number(page), 1);
        res.json({ rows: rows.slice((current - 1) * take, current * take), pagination: { total, page: current, limit: take, pages: Math.ceil(total / take) } });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getInventoryLedger = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 25 } = req.query;
        const logQuery = req.user?.role === "Admin" ? { $or: [{ dari_cabang: req.user.cabang }, { ke_cabang: req.user.cabang }] } : {};
        const trxQuery = req.user?.role === "Admin" ? { cabang: req.user.cabang } : {};
        const [logs, transactions] = await Promise.all([StockTransferLog.find(logQuery).populate("produk_id", "nama_produk").populate("user_id", "nama_lengkap").lean(), Transaction.find(trxQuery).populate("user_id", "nama_lengkap").populate("detail_transaksi.produk_id", "nama_produk").lean()]);
        let ledger = logs.map((l) => ({ id: `log-${l._id}`, date: l.createdAt, type: String(l.tipe || "ADJUSTMENT").toUpperCase(), product: l.produk_id?.nama_produk || "Deleted product", batch: "—", branch: l.ke_cabang || l.dari_cabang || "—", user: l.user_id?.nama_lengkap || "System", qty: l.jumlah, before: "—", after: "—", reason: l.keterangan || "Inventory movement" }));
        for (const trx of transactions) {
            for (const item of trx.detail_transaksi) {
                for (const allocation of item.batch_allocations || []) {
                    ledger.push({ id: `trx-${trx._id}-${allocation.batch_id}`, date: trx.createdAt, type: trx.is_hold ? "HOLD" : "CHECKOUT", product: item.produk_id?.nama_produk || "Deleted product", batch: allocation.batch_number, branch: trx.cabang, user: trx.user_id?.nama_lengkap || "System", qty: -allocation.kuantitas, before: "—", after: "—", reason: `Invoice ${trx.invoice}` });
                }
            }
        }
        ledger = ledger.filter((r) => `${r.product} ${r.batch} ${r.branch} ${r.type}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date));
        const total = ledger.length, take = Math.min(Math.max(Number(limit), 1), 100), current = Math.max(Number(page), 1);
        res.json({ rows: ledger.slice((current - 1) * take, current * take), pagination: { total, page: current, limit: take, pages: Math.ceil(total / take) } });
    } catch (error) { res.status(500).json({ message: error.message }); }
};
