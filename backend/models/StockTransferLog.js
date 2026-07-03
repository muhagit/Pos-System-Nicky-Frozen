import mongoose from "mongoose";

const stockTransferLogSchema = new mongoose.Schema(
    {
        produk_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        tipe: {
            type: String,
            enum: ["Transfer", "Adjustment"],
            required: true,
        },
        jumlah: {
            type: Number,
            required: true,
        },
        dari_cabang: {
            type: String,
            // Opsional, hanya diisi untuk tipe "Transfer"
        },
        ke_cabang: {
            type: String,
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        keterangan: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("StockTransferLog", stockTransferLogSchema);
