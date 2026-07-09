import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        nama_produk: {
            type: String,
            required: true,
            unique: true,
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
        stok_cabang: {
            type: Map,
            of: Number,
            default: {}
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
        gambar: {
            type: String,
            default: "", // Akan menyimpan path/URL gambar
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Product", productSchema);
