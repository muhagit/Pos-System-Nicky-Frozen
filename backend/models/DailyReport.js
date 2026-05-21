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
        cabang: {
            type: String,
            required: true,
        },
        total_pendapatan_sistem: {
            type: Number,
            required: true,
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
