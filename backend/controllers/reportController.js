import DailyReport from "../models/DailyReport.js";
import Transaction from "../models/Transaction.js";
import ShiftRecord from "../models/ShiftRecord.js";

// ============================================================
// SHIFT MANAGEMENT
// ============================================================

// @desc    Mulai shift baru
// @route   POST /api/reports/start-shift
export const startShift = async (req, res) => {
    try {
        const { shift, modal_awal } = req.body;
        const cabang = req.user.cabang;
        const todayStr = new Date().toISOString().slice(0, 10);

        // Cek apakah sudah ada shift aktif di cabang ini
        const activeShift = await ShiftRecord.findOne({ cabang, status: "Aktif" });
        if (activeShift) {
            return res.status(400).json({
                message: `Masih ada ${activeShift.shift} yang aktif di cabang ini. Akhiri shift terlebih dahulu.`
            });
        }

        // Cek apakah shift ini sudah pernah dibuka hari ini
        const existingShift = await ShiftRecord.findOne({ cabang, tanggal: todayStr, shift });
        if (existingShift) {
            return res.status(400).json({
                message: `${shift} sudah pernah dibuka hari ini.`
            });
        }

        // Shift 2 tidak perlu modal awal — lanjutkan dari Shift 1
        const startingCash = shift === "Shift 1" ? (Number(modal_awal) || 0) : 0;

        const record = await ShiftRecord.create({
            user_id: req.user._id,
            cabang,
            shift,
            tanggal: todayStr,
            modal_awal: startingCash,
            status: "Aktif",
            waktu_mulai: new Date(),
        });

        res.status(201).json({
            message: `${shift} berhasil dimulai`,
            record,
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal memulai shift", error: error.message });
    }
};

// @desc    Akhiri shift aktif — hitung total transaksi shift ini
// @route   POST /api/reports/end-shift
export const endShift = async (req, res) => {
    try {
        const cabang = req.user.cabang;

        const activeShift = await ShiftRecord.findOne({ cabang, status: "Aktif" });
        if (!activeShift) {
            return res.status(400).json({ message: "Tidak ada shift aktif untuk diakhiri." });
        }

        // Hitung transaksi dari waktu mulai shift sampai sekarang
        const transactions = await Transaction.find({
            cabang,
            createdAt: { $gte: activeShift.waktu_mulai, $lte: new Date() },
            is_hold: { $ne: true },
        });

        const total_cash = transactions
            .filter(t => t.metode_pembayaran === "Cash")
            .reduce((sum, t) => sum + t.total_pembayaran, 0);

        const total_digital = transactions
            .filter(t => t.metode_pembayaran !== "Cash")
            .reduce((sum, t) => sum + t.total_pembayaran, 0);

        const total_pendapatan = total_cash + total_digital;
        const jumlah_transaksi = transactions.length;

        // Update shift record
        activeShift.total_pendapatan = total_pendapatan;
        activeShift.total_cash = total_cash;
        activeShift.total_digital = total_digital;
        activeShift.jumlah_transaksi = jumlah_transaksi;
        activeShift.status = "Selesai";
        activeShift.waktu_selesai = new Date();
        await activeShift.save();

        res.status(200).json({
            message: `${activeShift.shift} berhasil diakhiri`,
            record: activeShift,
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengakhiri shift", error: error.message });
    }
};

// @desc    Cek shift aktif di cabang
// @route   GET /api/reports/active-shift
export const getActiveShift = async (req, res) => {
    try {
        const cabang = req.user.cabang;
        const activeShift = await ShiftRecord.findOne({ cabang, status: "Aktif" }).populate("user_id", "nama_lengkap");

        // Juga ambil shift records hari ini untuk info di frontend
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayShifts = await ShiftRecord.find({ cabang, tanggal: todayStr })
            .populate("user_id", "nama_lengkap")
            .sort({ createdAt: 1 });

        res.status(200).json({
            activeShift: activeShift || null,
            todayShifts,
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengecek shift", error: error.message });
    }
};

// ============================================================
// TUTUP BUKU HARIAN
// ============================================================

// @desc    Melakukan Tutup Buku Harian (gabungan Shift 1 + Shift 2)
// @route   POST /api/reports/tutup-buku
export const createDailyReport = async (req, res) => {
    try {
        const { total_kas_fisik } = req.body;
        const cabang = req.user.cabang;
        const todayStr = new Date().toISOString().slice(0, 10);

        // Cek apakah tutup buku hari ini sudah pernah dilakukan di cabang ini
        const dateObj = new Date();
        const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

        const existingReport = await DailyReport.findOne({
            cabang,
            tanggal_laporan: { $gte: startOfDay, $lte: endOfDay },
        });

        if (existingReport) {
            return res.status(400).json({
                message: "Tutup buku harian untuk hari ini sudah dilakukan di cabang ini."
            });
        }

        // 1. Ambil semua shift record hari ini di cabang ini
        const todayShifts = await ShiftRecord.find({ cabang, tanggal: todayStr, status: "Selesai" });

        if (todayShifts.length === 0) {
            return res.status(400).json({
                message: "Tidak ada data shift yang selesai hari ini. Akhiri shift terlebih dahulu."
            });
        }

        // 2. Gabungkan data dari semua shift
        let modal_awal = 0;
        let total_pendapatan_cash = 0;
        let total_pendapatan_digital = 0;

        todayShifts.forEach(s => {
            if (s.shift === "Shift 1") {
                modal_awal = s.modal_awal; // Modal awal dari Shift 1
            }
            total_pendapatan_cash += s.total_cash;
            total_pendapatan_digital += s.total_digital;
        });

        const total_pendapatan_sistem = total_pendapatan_cash + total_pendapatan_digital;

        // 3. Hitung selisih kas fisik laci
        // Selisih = Kas Fisik - (Modal Awal + Pendapatan Cash)
        // Digital tidak masuk laci fisik tapi tetap direkam
        const expected_kas_fisik = modal_awal + total_pendapatan_cash;
        const selisih = total_kas_fisik - expected_kas_fisik;

        // 4. Simpan Laporan Tutup Buku
        const report = await DailyReport.create({
            diperiksa_oleh: req.user._id,
            tanggal_laporan: new Date(),
            cabang,
            shift: "Tutup Buku Harian",
            modal_awal,
            total_pendapatan_sistem,
            total_pendapatan_cash,
            total_pendapatan_digital,
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

// ============================================================
// GET REPORTS
// ============================================================

// @desc    Mendapatkan Semua Laporan Harian
// @route   GET /api/reports
export const getReports = async (req, res) => {
    try {
        const query = {};
        if (req.user && (req.user.role === "Admin" || req.user.role === "Kasir")) {
            query.cabang = req.user.cabang;
        } else if (req.query.cabang) {
            query.cabang = req.query.cabang;
        }

        // Filter range tanggal_laporan
        if (req.query.startDate || req.query.endDate) {
            query.tanggal_laporan = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                start.setHours(0, 0, 0, 0);
                query.tanggal_laporan.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.tanggal_laporan.$lte = end;
            }
        }

        const reports = await DailyReport.find(query)
            .populate("diperiksa_oleh", "nama_lengkap role")
            .sort({ tanggal_laporan: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil laporan",
            error: error.message,
        });
    }
};

// @desc    Mendapatkan detail report (shift breakdown) untuk satu hari
// @route   GET /api/reports/detail/:tanggal
export const getReportDetail = async (req, res) => {
    try {
        const { tanggal } = req.params; // format: YYYY-MM-DD
        let cabang = req.user.cabang;
        if (req.user && (req.user.role === "Owner" || req.user.role === "Admin") && req.query.cabang) {
            cabang = req.query.cabang;
        }

        // Ambil shift records hari itu
        const shifts = await ShiftRecord.find({ cabang, tanggal })
            .populate("user_id", "nama_lengkap")
            .sort({ createdAt: 1 });

        // Ambil transaksi hari itu
        const dateObj = new Date(tanggal);
        const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

        const transactions = await Transaction.find({
            cabang,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            is_hold: { $ne: true },
        }).populate("user_id", "nama_lengkap")
          .populate("detail_transaksi.produk_id", "nama_produk")
          .sort({ createdAt: -1 });

        // Ambil daily report hari itu
        const report = await DailyReport.findOne({
            cabang,
            tanggal_laporan: { $gte: startOfDay, $lte: endOfDay },
        }).populate("diperiksa_oleh", "nama_lengkap");

        res.status(200).json({ shifts, transactions, report });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil detail", error: error.message });
    }
};

// ============================================================
// DOWNLOAD ECHO (untuk export PDF/Excel)
// ============================================================

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
