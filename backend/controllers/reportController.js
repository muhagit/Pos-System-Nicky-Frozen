import DailyReport from "../models/DailyReport.js";
import Transaction from "../models/Transaction.js";

// @desc    Melakukan Tutup Buku Harian
// @route   POST /api/reports/tutup-buku
export const createDailyReport = async (req, res) => {
    try {
        const { diperiksa_oleh, cabang, total_kas_fisik, tanggal_laporan } =
            req.body;

        const reportCabang = req.user && req.user.role === "Admin" ? req.user.cabang : cabang;

        // 1. Tentukan rentang waktu untuk hari ini (dari 00:00:00 sampai 23:59:59)
        const startOfDay = new Date(tanggal_laporan);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(tanggal_laporan);
        endOfDay.setHours(23, 59, 59, 999);

        // 2. Cari semua transaksi di cabang tersebut pada hari itu
        const transactions = await Transaction.find({
            cabang: reportCabang,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        // 3. Hitung total pendapatan dari sistem
        const total_pendapatan_sistem = transactions.reduce(
            (acc, curr) => acc + curr.total_pembayaran,
            0,
        );

        // 4. Hitung selisih (Kas Fisik - Pendapatan Sistem)
        // Jika minus berarti uang kurang, jika plus berarti uang lebih
        const selisih = total_kas_fisik - total_pendapatan_sistem;

        // 5. Simpan Laporan Tutup Buku
        const report = await DailyReport.create({
            diperiksa_oleh,
            tanggal_laporan,
            cabang: reportCabang,
            total_pendapatan_sistem,
            total_kas_fisik,
            selisih,
            status_tutup_buku: "Terkunci",
        });

        res.status(201).json({
            message: "Tutup buku harian berhasil dikunci",
            report,
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal melakukan tutup buku",
            error: error.message,
        });
    }
};

// @desc    Mendapatkan Semua Laporan Harian (Untuk Owner)
// @route   GET /api/reports
export const getReports = async (req, res) => {
    try {
        const query = {};
        if (req.user && req.user.role === "Admin") {
            query.cabang = req.user.cabang;
        }
        const reports = await DailyReport.find(query).populate(
            "diperiksa_oleh",
            "nama_lengkap role",
        );
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil laporan",
            error: error.message,
        });
    }
};

// @desc    Echo base64 data back as a downloadable file attachment
// @route   POST /api/reports/download-echo
export const downloadEcho = async (req, res) => {
    try {
        const { base64Data, filename, contentType } = req.body;
        if (!base64Data || !filename || !contentType) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const buffer = Buffer.from(base64Data, "base64");

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", buffer.length);

        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
