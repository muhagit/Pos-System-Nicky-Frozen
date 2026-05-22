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

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // Gunakan deleteOne() atau findByIdAndDelete() tergantung versi Mongoose Anda
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: "Produk berhasil dihapus" });
        } else {
            res.status(404).json({ message: "Produk tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message,
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { 
            nama_produk, 
            kategori, 
            harga, 
            stok_saat_ini, 
            batas_stok_minimum, 
            tanggal_expired 
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            // Perbarui data jika ada input baru, jika tidak ada gunakan data lama
            product.nama_produk = nama_produk || product.nama_produk;
            product.kategori = kategori || product.kategori;
            product.harga = harga || product.harga;
            product.stok_saat_ini = stok_saat_ini !== undefined ? stok_saat_ini : product.stok_saat_ini;
            product.batas_stok_minimum = batas_stok_minimum !== undefined ? batas_stok_minimum : product.batas_stok_minimum;
            product.tanggal_expired = tanggal_expired || product.tanggal_expired;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Produk tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};