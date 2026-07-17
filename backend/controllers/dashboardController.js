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

        let start = null;
        let end = null;
        let isFiltered = false;

        const query = { is_hold: false };

        if (req.query.startDate || req.query.endDate) {
            isFiltered = true;
            query.createdAt = {};
            if (req.query.startDate) {
                start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (req.query.endDate) {
                end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // 1. AMBIL DATA TRANSAKSI
        const trxToday = await Transaction.find(query);
        
        let trxYesterday = [];
        if (isFiltered && start && end) {
            const duration = end - start;
            const prevStart = new Date(start.getTime() - duration);
            const prevEnd = new Date(start.getTime());
            trxYesterday = await Transaction.find({
                createdAt: { $gte: prevStart, $lt: prevEnd },
                is_hold: false,
            });
        }

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
        
        const reportQuery = {};
        if (isFiltered && start && end) {
            reportQuery.tanggal_laporan = { $gte: start, $lt: end };
        }
        const reportsToday = await DailyReport.find(reportQuery);

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

            const shiftQuery = { cabang: name };
            if (isFiltered && start && end) {
                shiftQuery.tanggal = {
                    $gte: start.toISOString().slice(0, 10),
                    $lte: end.toISOString().slice(0, 10)
                };
            }
            const shiftsToday = await ShiftRecord.find(shiftQuery);
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

        // 5. DATA CHART KATEGORI (Metode Pembayaran - Cash vs E-Money)
        const metodeMap = { Cash: 0, "E-Money": 0 };
        trxToday.forEach((t) => {
            if (t.metode_pembayaran === "Cash") {
                metodeMap["Cash"] += t.total_pembayaran;
            } else {
                metodeMap["E-Money"] += t.total_pembayaran;
            }
        });
        const categoryData = Object.keys(metodeMap)
            .map((key) => ({ metode: key, jumlah: metodeMap[key] }))
            .filter((item) => item.jumlah > 0);

        // 6. DATA CHART REVENUE (Tren Berdasarkan Filter)
        const allBranches = await Branch.find({});

        let startTrend = new Date();
        startTrend.setDate(startTrend.getDate() - 6);
        startTrend.setHours(0, 0, 0, 0);

        let endTrend = new Date();
        endTrend.setDate(endTrend.getDate() + 1);
        endTrend.setHours(0, 0, 0, 0);

        if (isFiltered) {
            if (start) startTrend = new Date(start);
            if (end) endTrend = new Date(end);
        } else {
            const oldestTrx = await Transaction.findOne({ is_hold: false }).sort({ createdAt: 1 });
            if (oldestTrx) {
                startTrend = new Date(oldestTrx.createdAt);
                startTrend.setHours(0, 0, 0, 0);
            }
        }

        const diffTime = Math.abs(endTrend - startTrend);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const revenueMap = {};

        if (diffDays <= 1) {
            // Group by hour
            for (let i = 0; i < 24; i++) {
                const hourStr = `${String(i).padStart(2, '0')}:00`;
                revenueMap[hourStr] = { hari: hourStr };
                allBranches.forEach(b => {
                    revenueMap[hourStr][b.name] = 0;
                });
            }
            trxToday.forEach((t) => {
                const hour = t.createdAt.getHours();
                const hourStr = `${String(hour).padStart(2, '0')}:00`;
                if (revenueMap[hourStr] && t.cabang) {
                    revenueMap[hourStr][t.cabang] += t.total_pembayaran;
                }
            });
        } else if (diffDays <= 31) {
            // Group by day
            const daysShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
            for (let i = 0; i < diffDays; i++) {
                const d = new Date(startTrend);
                d.setDate(d.getDate() + i);
                const label = diffDays <= 7 
                    ? daysShort[d.getDay()] 
                    : `${d.getDate()}/${d.getMonth() + 1}`;
                revenueMap[label] = { hari: label };
                allBranches.forEach(b => {
                    revenueMap[label][b.name] = 0;
                });
            }
            trxToday.forEach((t) => {
                const label = diffDays <= 7 
                    ? daysShort[t.createdAt.getDay()] 
                    : `${t.createdAt.getDate()}/${t.createdAt.getMonth() + 1}`;
                if (revenueMap[label] && t.cabang) {
                    revenueMap[label][t.cabang] += t.total_pembayaran;
                }
            });
        } else {
            // Group by month
            const startYear = startTrend.getFullYear();
            const startMonth = startTrend.getMonth();
            const endYear = endTrend.getFullYear();
            const endMonth = endTrend.getMonth();

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

            let currentYear = startYear;
            let currentMonth = startMonth;

            while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
                const label = `${monthNames[currentMonth]} ${String(currentYear).slice(-2)}`;
                revenueMap[label] = { hari: label };
                allBranches.forEach(b => {
                    revenueMap[label][b.name] = 0;
                });

                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
            }

            trxToday.forEach((t) => {
                const tYear = t.createdAt.getFullYear();
                const tMonth = t.createdAt.getMonth();
                const label = `${monthNames[tMonth]} ${String(tYear).slice(-2)}`;
                if (revenueMap[label] && t.cabang) {
                    revenueMap[label][t.cabang] += t.total_pembayaran;
                }
            });
        }
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
