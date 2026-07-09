import Category from "../models/Category.js";
import Product from "../models/Product.js";

// @desc    Menambahkan kategori baru
// @route   POST /api/categories
// @access  Private (Hanya Admin/Owner)
export const createCategory = async (req, res) => {
    try {
        const { nama_kategori } = req.body;

        if (!nama_kategori || !nama_kategori.trim()) {
            return res.status(400).json({ message: "Nama kategori harus diisi" });
        }

        const trimmedName = nama_kategori.trim();

        // Cek keunikan nama kategori (case-insensitive)
        const existingCategory = await Category.findOne({
            nama_kategori: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
        });

        if (existingCategory) {
            return res.status(400).json({
                message: "Kategori tersebut sudah ada."
            });
        }

        const category = await Category.create({
            nama_kategori: trimmedName
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({
            message: "Gagal menambahkan kategori",
            error: error.message
        });
    }
};

// @desc    Mendapatkan semua kategori dengan opsi search & sort
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
    try {
        const { search, sort } = req.query;
        let query = {};

        if (search) {
            query.nama_kategori = { $regex: search, $options: "i" };
        }

        let sortOption = { createdAt: -1 }; // Default terbaru
        if (sort === "oldest") {
            sortOption = { createdAt: 1 };
        } else if (sort === "asc") {
            sortOption = { nama_kategori: 1 };
        } else if (sort === "desc") {
            sortOption = { nama_kategori: -1 };
        }

        const categories = await Category.find(query).sort(sortOption);
        res.json(categories);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data kategori",
            error: error.message
        });
    }
};

// @desc    Mengubah nama kategori & cascade update produk
// @route   PUT /api/categories/:id
// @access  Private (Hanya Admin/Owner)
export const updateCategory = async (req, res) => {
    try {
        const { nama_kategori } = req.body;
        const categoryId = req.params.id;

        if (!nama_kategori || !nama_kategori.trim()) {
            return res.status(400).json({ message: "Nama kategori harus diisi" });
        }

        const trimmedName = nama_kategori.trim();

        // Cari kategori saat ini
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Kategori tidak ditemukan" });
        }

        // Cek nama kembar di kategori lain (case-insensitive)
        const duplicateCategory = await Category.findOne({
            _id: { $ne: categoryId },
            nama_kategori: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
        });

        if (duplicateCategory) {
            return res.status(400).json({
                message: "Kategori tersebut sudah ada."
            });
        }

        const oldName = category.nama_kategori;
        category.nama_kategori = trimmedName;
        await category.save();

        // Cascade update: ubah nama kategori pada seluruh produk yang memakainya
        await Product.updateMany(
            { kategori: oldName },
            { $set: { kategori: trimmedName } }
        );

        res.json(category);
    } catch (error) {
        res.status(500).json({
            message: "Gagal memperbarui kategori",
            error: error.message
        });
    }
};

// @desc    Menghapus kategori (Hanya jika tidak ada produk memakainya)
// @route   DELETE /api/categories/:id
// @access  Private (Hanya Admin/Owner)
export const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Kategori tidak ditemukan" });
        }

        // Cek apakah ada produk yang masih memakai kategori ini
        const productCount = await Product.countDocuments({ kategori: category.nama_kategori });
        if (productCount > 0) {
            return res.status(400).json({
                message: "Kategori tidak bisa dihapus karena sedang digunakan oleh beberapa produk."
            });
        }

        await category.deleteOne();
        res.json({ message: "Kategori berhasil dihapus" });
    } catch (error) {
        res.status(500).json({
            message: "Gagal menghapus kategori",
            error: error.message
        });
    }
};
