import mongoose from "mongoose";

const shiftRecordSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        cabang: {
            type: String,
            required: true,
        },
        shift: {
            type: String,
            required: true,
            enum: ["Shift 1", "Shift 2"],
        },
        tanggal: {
            type: String, // Format: YYYY-MM-DD untuk grouping harian
            required: true,
        },
        modal_awal: {
            type: Number,
            default: 0, // Hanya Shift 1 yang punya modal awal
        },
        total_pendapatan: {
            type: Number,
            default: 0,
        },
        total_cash: {
            type: Number,
            default: 0,
        },
        total_digital: {
            type: Number,
            default: 0,
        },
        jumlah_transaksi: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            required: true,
            enum: ["Aktif", "Selesai"],
            default: "Aktif",
        },
        waktu_mulai: {
            type: Date,
            required: true,
        },
        waktu_selesai: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("ShiftRecord", shiftRecordSchema);
