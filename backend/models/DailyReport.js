import mongoose from "mongoose";

const dailyReportSchema = new mongoose.Schema(
    {
        diperiksa_oleh: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User", // Owner yang melakukan tutup buku
        },
        tanggal_laporan: {
            type: Date,
            required: true,
        },
        shift: {
            type: String,
            required: true,
            enum: ["Shift 1", "Shift 2", "Tutup Buku Harian"],
            default: "Tutup Buku Harian",
        },
        modal_awal: {
            type: Number,
            required: true,
            default: 0,
        },
        cabang: {
            type: String,
            required: true,
        },
        total_pendapatan_sistem: {
            type: Number,
            required: true,
        },
        total_pendapatan_cash: {
            type: Number,
            default: 0,
        },
        total_pendapatan_digital: {
            type: Number,
            default: 0,
        },
        total_kas_fisik: {
            type: Number,
            required: true,
        },
        selisih: {
            type: Number,
            required: true,
        },
        status_tutup_buku: {
            type: String,
            required: true,
            enum: ["Terbuka", "Terkunci"],
            default: "Terkunci",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("DailyReport", dailyReportSchema);
