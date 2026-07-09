import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        order_id: { type: String }, // Tambahkan ini
        snap_token: { type: String }, // Tambahkan ini
        customer_name: { type: String }, // Nama pelanggan / penanda transaksi tunda
        invoice: { type: String, required: true, unique: true },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User", // Berelasi dengan model User (Kasir yang melayani)
        },
        cabang: {
            type: String,
            required: true,
        },
        metode_pembayaran: {
            type: String,
            required: true,
            enum: ["Cash", "QRIS", "Transfer", "Card"],
        },
        total_pembayaran: {
            type: Number,
            required: true,
        },
        is_hold: {
            type: Boolean,
            default: false,
        },
        shift: {
            type: String, // Menyimpan shift aktif saat transaksi difinalisasi (e.g. "Shift 1", "Shift 2")
        },
        // Ini adalah representasi entitas Transaction_Details di ERD kita
        detail_transaksi: [
            {
                produk_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "Product", // Berelasi dengan model Product
                },
                kuantitas: { type: Number, required: true },
                harga_satuan: { type: Number, required: true },
                subtotal: { type: Number, required: true },
            },
        ],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Transaction", transactionSchema);
