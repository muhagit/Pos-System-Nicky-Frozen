import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";
import DailyReport from "../models/DailyReport.js";
import ShiftRecord from "../models/ShiftRecord.js";
import Branch from "../models/Branch.js";

export const getOwnerDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        // 1. AMBIL DATA TRANSAKSI
        const trxToday = await Transaction.find({
            createdAt: { $gte: today, $lt: tomorrow },
            is_hold: false,
        });
        const trxYesterday = await Transaction.find({
            createdAt: { $gte: yesterday, $lt: today },
            is_hold: false,
        });

        // 2. KALKULASI STATS CARD
        const penjualanHariIni = trxToday.reduce(
            (sum, t) => sum + t.total_pembayaran,
            0,
        );
        const penjualanKemarin = trxYesterday.reduce(
            (sum, t) => sum + t.total_pembayaran,
            0,
        );
        const totalTransaksi = trxToday.length;
        const transaksiKemarin = trxYesterday.length;

        const calcPersentase = (now, prev) => {
            if (prev === 0) return now > 0 ? "+100%" : "0%";
            const diff = ((now - prev) / prev) * 100;
            return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        };

        const persentasePenjualan = calcPersentase(
            penjualanHariIni,
            penjualanKemarin,
        );
        const persentaseTransaksi = calcPersentase(
            totalTransaksi,
            transaksiKemarin,
        );

        // 3. PRODUK HAMPIR HABIS & NOTIFIKASI
        const products = await Product.find({});
        let produkHampirHabis = 0;
        const notifikasi = [];

        products.forEach((p) => {
            if (p.stok_saat_ini <= p.batas_stok_minimum) {
                produkHampirHabis++;
                notifikasi.push({
                    _id: p._id,
                    tipe: p.stok_saat_ini === 0 ? "expired" : "stok",
                    cabang: "Pusat",
                    pesan: `${p.nama_produk} sisa ${p.stok_saat_ini} unit`,
                    waktu: "Hari ini",
                });
            }
        });

        // 4. RINGKASAN CABANG (Group by Cabang)
        const activeBranches = await Branch.find({ isActive: true });
        const branchesList = activeBranches.map(b => b.name);
        const reportsToday = await DailyReport.find({
            createdAt: { $gte: today, $lt: tomorrow }
        });
        const cabang = [];
        for (const name of branchesList) {
            const branchTrxToday = trxToday.filter(t => t.cabang === name);
            const penjualan = branchTrxToday.reduce((sum, t) => sum + t.total_pembayaran, 0);
            const transaksi = branchTrxToday.length;

            const report = reportsToday.find(r => r.cabang === name);
            const selisih = report ? (report.selisih !== 0) : false;
            const nominalSelisih = report ? report.selisih : 0;

            const activeShift = await ShiftRecord.findOne({ cabang: name, status: "Aktif" });
            const isOnline = !!activeShift;

            const lastTrx = await Transaction.findOne({ cabang: name }).sort({ createdAt: -1 });
            const lastSync = lastTrx ? lastTrx.createdAt : null;

            const shiftsToday = await ShiftRecord.find({
                cabang: name,
                tanggal: new Date().toISOString().slice(0, 10)
            });
            const modalAwal = shiftsToday.reduce((sum, s) => sum + (s.modal_awal || 0), 0);
            const cashToday = branchTrxToday
                .filter(t => t.metode_pembayaran === "Cash")
                .reduce((sum, t) => sum + t.total_pembayaran, 0);
            const kas = modalAwal + cashToday;

            cabang.push({
                nama: name,
                penjualan,
                transaksi,
                kas,
                selisih,
                nominalSelisih,
                isOnline,
                lastSync
            });
        }

        // 5. DATA CHART KATEGORI (Metode Pembayaran Hari Ini)
        const metodeMap = { Cash: 0, QRIS: 0, Transfer: 0, Card: 0 };
        trxToday.forEach((t) => {
            if (metodeMap[t.metode_pembayaran] !== undefined) {
                metodeMap[t.metode_pembayaran] += t.total_pembayaran;
            }
        });
        const categoryData = Object.keys(metodeMap)
            .map((key) => ({ metode: key, jumlah: metodeMap[key] }))
            .filter((item) => item.jumlah > 0); // Hanya tampilkan metode yang ada transaksinya

        // 6. DATA CHART REVENUE (7 Hari Terakhir)
        const trx7Days = await Transaction.find({
            createdAt: { $gte: sevenDaysAgo, $lt: tomorrow },
            is_hold: false,
        });
        const allBranches = await Branch.find({});
        const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const revenueMap = {};

        // Inisialisasi struktur 7 hari
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dayName = days[d.getDay()];
            revenueMap[dayName] = { hari: dayName };
            allBranches.forEach(b => {
                revenueMap[dayName][b.name] = 0;
            });
        }

        trx7Days.forEach((t) => {
            const dayName = days[t.createdAt.getDay()];
            if (revenueMap[dayName] && t.cabang) {
                if (revenueMap[dayName][t.cabang] !== undefined) {
                    revenueMap[dayName][t.cabang] += t.total_pembayaran;
                } else {
                    revenueMap[dayName][t.cabang] = t.total_pembayaran;
                }
            }
        });
        const revenueData = Object.values(revenueMap);

        const selisihKas = reportsToday.reduce((sum, r) => sum + Math.abs(r.selisih), 0);

        // KIRIM RESPONS KE FRONTEND
        res.json({
            stats: {
                penjualanHariIni,
                persentasePenjualan,
                totalTransaksi,
                persentaseTransaksi,
                selisihKas,
                produkHampirHabis,
            },
            cabang,
            notifikasi: notifikasi.slice(0, 5),
            categoryData:
                categoryData.length > 0
                    ? categoryData
                    : [{ metode: "Belum Ada", jumlah: 0 }],
            revenueData,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
