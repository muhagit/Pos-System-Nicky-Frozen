import Product from "../models/Product.js";

// @desc    Menambahkan produk baru (termasuk upload gambar)
// @route   POST /api/products
// @access  Private (Hanya Admin/Owner)
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

        // 1. Validasi input: pastikan field yang wajib sudah terisi
        if (!nama_produk || !kategori || !harga || !tanggal_expired) {
            return res
                .status(400)
                .json({ message: "Semua field wajib harus diisi" });
        }

        // 2. Tangkap path gambar dari middleware multer (jika ada file yang diunggah)
        const gambar = req.file ? `/uploads/${req.file.filename}` : "";

        // 3. Simpan data ke database
        const product = await Product.create({
            nama_produk,
            kategori,
            harga,
            stok_saat_ini: stok_saat_ini || 0,
            batas_stok_minimum: batas_stok_minimum || 5,
            tanggal_expired,
            gambar, // Menyimpan URL gambar
        });

        // 4. Kirim respons berhasil
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Gagal menambahkan produk",
            error: error.message,
        });
    }
};

// @desc    Mengambil semua data produk (mendukung search & filter)
// @route   GET /api/products
// @access  Private (Bisa diakses Kasir, Admin, Owner)
export const getProducts = async (req, res) => {
    try {
        // Menangkap parameter dari URL (misal: /api/products?search=ayam&kategori=Nugget)
        const { search, kategori } = req.query;
        let query = {};

        // Filter berdasarkan nama produk (case-insensitive)
        if (search) {
            query.nama_produk = { $regex: search, $options: "i" };
        }

        // Filter berdasarkan kategori yang dipilih
        if (kategori) {
            query.kategori = kategori;
        }

        // Ambil data dari database yang sesuai kriteria dan urutkan dari yang terbaru
        const products = await Product.find(query).sort({ createdAt: -1 });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data produk",
            error: error.message,
        });
    }
};

// @desc    Menghapus produk
// @route   DELETE /api/products/:id
// @access  Private (Hanya Admin/Owner)
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: "Produk berhasil dihapus" });

            // Catatan: Jika ingin lebih efisien, Anda juga bisa menambahkan script (misalnya fs.unlink)
            // untuk menghapus file fisik gambarnya di dalam folder 'uploads' agar storage tidak penuh.
        } else {
            res.status(404).json({ message: "Produk tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Terjadi kesalahan pada server saat menghapus produk",
            error: error.message,
        });
    }
};

// @desc    Mengupdate data produk (termasuk mengganti gambar)
// @route   PUT /api/products/:id
// @access  Private (Hanya Admin/Owner)
export const updateProduct = async (req, res) => {
    try {
        const {
            nama_produk,
            kategori,
            harga,
            stok_saat_ini,
            batas_stok_minimum,
            tanggal_expired,
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            // Perbarui teks datanya
            product.nama_produk = nama_produk || product.nama_produk;
            product.kategori = kategori || product.kategori;
            product.harga = harga || product.harga;
            product.stok_saat_ini =
                stok_saat_ini !== undefined
                    ? stok_saat_ini
                    : product.stok_saat_ini;
            product.batas_stok_minimum =
                batas_stok_minimum !== undefined
                    ? batas_stok_minimum
                    : product.batas_stok_minimum;
            product.tanggal_expired =
                tanggal_expired || product.tanggal_expired;

            // Jika admin mengupload gambar baru, timpa URL gambar yang lama
            if (req.file) {
                product.gambar = `/uploads/${req.file.filename}`;
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Produk tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Terjadi kesalahan pada server saat mengupdate produk",
            error: error.message,
        });
    }
};
