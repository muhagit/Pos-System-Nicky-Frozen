import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";

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
        const cabangMap = {};
        trxToday.forEach((t) => {
            if (!cabangMap[t.cabang]) {
                cabangMap[t.cabang] = {
                    nama: t.cabang,
                    penjualan: 0,
                    transaksi: 0,
                    kas: 0,
                    selisih: false,
                    nominalSelisih: 0,
                };
            }
            cabangMap[t.cabang].penjualan += t.total_pembayaran;
            cabangMap[t.cabang].transaksi += 1;
            cabangMap[t.cabang].kas += t.total_pembayaran;
        });
        const cabang = Object.values(cabangMap);

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
        const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const revenueMap = {};

        // Inisialisasi struktur 7 hari
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dayName = days[d.getDay()];
            revenueMap[dayName] = { hari: dayName, cabangA: 0, cabangB: 0 };
        }

        trx7Days.forEach((t) => {
            const dayName = days[t.createdAt.getDay()];
            if (revenueMap[dayName]) {
                // Mapping cabang dinamis (sesuaikan dengan nama cabang di database Anda)
                if (t.cabang === "Pusat")
                    revenueMap[dayName].cabangA += t.total_pembayaran;
                else revenueMap[dayName].cabangB += t.total_pembayaran;
            }
        });
        const revenueData = Object.values(revenueMap);

        // KIRIM RESPONS KE FRONTEND
        res.json({
            stats: {
                penjualanHariIni,
                persentasePenjualan,
                totalTransaksi,
                persentaseTransaksi,
                selisihKas: 0, // Default 0
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
