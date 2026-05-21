import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        nama_produk: {
            type: String,
            required: true,
        },
        kategori: {
            type: String,
            required: true,
        },
        harga: {
            type: Number,
            required: true,
        },
        stok_saat_ini: {
            type: Number,
            required: true,
            default: 0,
        },
        batas_stok_minimum: {
            type: Number,
            required: true,
            default: 5,
        },
        tanggal_expired: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Product", productSchema);
