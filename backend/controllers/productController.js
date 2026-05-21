import Product from "../models/Product.js";

// @desc    Menambahkan produk baru
// @route   POST /api/products
// @access  Private (Nantinya kita lindungi dengan token untuk Admin)
export const createProduct = async (req, res) => {
    try {
        const {
            nama_produk,
            kategori,
            harga,
            stok_saat_ini,
            batas_stok_minimum,
            tanggal_expired,
        } = req.body;

        // Validasi sederhana
        if (!nama_produk || !kategori || !harga || !tanggal_expired) {
            return res
                .status(400)
                .json({ message: "Semua field wajib harus diisi" });
        }

        const product = await Product.create({
            nama_produk,
            kategori,
            harga,
            stok_saat_ini,
            batas_stok_minimum,
            tanggal_expired,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Gagal menambahkan produk",
            error: error.message,
        });
    }
};

// @desc    Mengambil semua data produk
// @route   GET /api/products
// @access  Public (Bisa diakses Kasir dan Admin)
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data produk",
            error: error.message,
        });
    }
};
