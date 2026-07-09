import Product from "../models/Product.js";
import StockTransferLog from "../models/StockTransferLog.js";

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

        // Cek apakah produk dengan nama yang sama sudah ada (case-insensitive & trimmed)
        const existingProduct = await Product.findOne({
            nama_produk: { $regex: new RegExp(`^${nama_produk.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
        });

        if (existingProduct) {
            return res.status(400).json({
                message: "Produk dengan nama tersebut sudah ada."
            });
        }

        // 2. Tangkap path gambar dari middleware multer (jika ada file yang diunggah)
        const gambar = req.file ? `/uploads/${req.file.filename}` : "";

        // 3. Simpan data ke database
        let initialStokCabang;
        let calculatedStok;

        if (req.user && req.user.role === "Admin") {
            const adminCabang = req.user.cabang || "Cabang Jogja";
            initialStokCabang = {
                [adminCabang]: Number(stok_saat_ini) || 0
            };
            calculatedStok = Number(stok_saat_ini) || 0;
        } else {
            initialStokCabang = req.body.stok_cabang || {
                "Cabang Jogja": Number(stok_saat_ini) || 0
            };
            calculatedStok = req.body.stok_cabang
                ? Object.values(req.body.stok_cabang).reduce((a, b) => a + Number(b), 0)
                : (Number(stok_saat_ini) || 0);
        }

        const product = await Product.create({
            nama_produk,
            kategori,
            harga,
            stok_saat_ini: calculatedStok,
            stok_cabang: initialStokCabang,
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
        const { search, kategori, allBranches } = req.query;
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

        // Jika user adalah Kasir atau Admin, tampilkan stok khusus cabang kasir/admin tersebut bertugas (kecuali allBranches=true)
        if (req.user && (req.user.role === "Kasir" || req.user.role === "Admin") && allBranches !== "true") {
            const cabang = req.user.cabang || "Cabang Jogja";
            const mappedProducts = products.map((product) => {
                const pObj = product.toJSON();
                // Jika stok_cabang belum terdefinisi, default ke 0
                pObj.stok_saat_ini = product.stok_cabang 
                    ? (product.stok_cabang.get(cabang) || 0)
                    : 0;
                return pObj;
            });
            return res.status(200).json(mappedProducts);
        }

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
            // Cek apakah nama produk yang baru sudah digunakan oleh produk lain
            if (nama_produk) {
                const existingProduct = await Product.findOne({
                    _id: { $ne: req.params.id },
                    nama_produk: { $regex: new RegExp(`^${nama_produk.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
                });
                if (existingProduct) {
                    return res.status(400).json({
                        message: "Produk dengan nama tersebut sudah ada."
                    });
                }
            }

            // Perbarui teks datanya
            product.nama_produk = nama_produk || product.nama_produk;
            product.kategori = kategori || product.kategori;
            product.harga = harga || product.harga;
            if (req.user && req.user.role === "Admin") {
                if (stok_saat_ini !== undefined) {
                    const cabang = req.user.cabang || "Cabang Jogja";
                    product.stok_cabang.set(cabang, Number(stok_saat_ini));
                    product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
                }
            } else {
                if (req.body.stok_cabang) {
                    const stokObj = typeof req.body.stok_cabang === "string"
                        ? JSON.parse(req.body.stok_cabang)
                        : req.body.stok_cabang;
                    for (const [key, val] of Object.entries(stokObj)) {
                        product.stok_cabang.set(key, Number(val));
                    }
                    product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
                } else if (stok_saat_ini !== undefined) {
                    const newStock = Number(stok_saat_ini);
                    const diff = newStock - product.stok_saat_ini;
                    const currentCabangJogja = product.stok_cabang.get("Cabang Jogja") || 0;
                    product.stok_cabang.set("Cabang Jogja", Math.max(0, currentCabangJogja + diff));
                    product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
                }
            }
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

// @desc    Transfer stok produk antar cabang
// @route   POST /api/products/transfer
// @access  Private (Hanya Admin/Owner)
export const transferStock = async (req, res) => {
    try {
        const { produk_id, dari_cabang, ke_cabang, jumlah, keterangan } = req.body;

        if (!produk_id || !dari_cabang || !ke_cabang || !jumlah) {
            return res.status(400).json({ message: "Semua field transfer wajib diisi" });
        }

        if (req.user && req.user.role === "Admin") {
            if (dari_cabang !== req.user.cabang && ke_cabang !== req.user.cabang) {
                return res.status(403).json({
                    message: "Admin hanya bisa melakukan transfer dari atau ke cabang sendiri"
                });
            }
        }

        const qty = Number(jumlah);
        if (qty <= 0) {
            return res.status(400).json({ message: "Jumlah transfer harus lebih dari 0" });
        }

        if (dari_cabang === ke_cabang) {
            return res.status(400).json({ message: "Cabang asal dan tujuan tidak boleh sama" });
        }

        const product = await Product.findById(produk_id);
        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan" });
        }

        const currentDariStock = product.stok_cabang ? (product.stok_cabang.get(dari_cabang) || 0) : 0;
        if (currentDariStock < qty) {
            return res.status(400).json({
                message: `Stok ${product.nama_produk} di ${dari_cabang} tidak mencukupi! Sisa stok: ${currentDariStock}`
            });
        }

        // Jalankan transfer
        const currentKeStock = product.stok_cabang ? (product.stok_cabang.get(ke_cabang) || 0) : 0;
        product.stok_cabang.set(dari_cabang, currentDariStock - qty);
        product.stok_cabang.set(ke_cabang, currentKeStock + qty);
        
        // Pastikan total stok ter-update
        product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
        await product.save();

        // Buat Log Mutasi
        const log = await StockTransferLog.create({
            produk_id,
            tipe: "Transfer",
            jumlah: qty,
            dari_cabang,
            ke_cabang,
            user_id: req.user._id,
            keterangan: keterangan || `Transfer ${qty} unit dari ${dari_cabang} ke ${ke_cabang}`
        });

        res.status(200).json({
            message: "Transfer stok berhasil diproses!",
            product,
            log
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal memproses transfer stok",
            error: error.message
        });
    }
};

// @desc    Penyesuaian stok (Stock Opname) manual pada cabang tertentu
// @route   POST /api/products/adjust
// @access  Private (Hanya Admin/Owner)
export const adjustStock = async (req, res) => {
    try {
        const { produk_id, cabang, jumlah, keterangan } = req.body;

        if (!produk_id || !cabang || jumlah === undefined || !keterangan) {
            return res.status(400).json({ message: "Field Produk, Cabang, Jumlah, dan Alasan Penyesuaian wajib diisi" });
        }

        if (req.user && req.user.role === "Admin" && cabang !== req.user.cabang) {
            return res.status(403).json({
                message: "Admin hanya bisa melakukan penyesuaian stok di cabang sendiri"
            });
        }

        const newQty = Number(jumlah);
        if (newQty < 0) {
            return res.status(400).json({ message: "Jumlah penyesuaian stok tidak boleh negatif" });
        }

        const product = await Product.findById(produk_id);
        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan" });
        }

        const oldQty = product.stok_cabang ? (product.stok_cabang.get(cabang) || 0) : 0;
        const diff = newQty - oldQty;

        // update stok cabang
        product.stok_cabang.set(cabang, newQty);
        product.stok_saat_ini = Array.from(product.stok_cabang.values()).reduce((a, b) => a + b, 0);
        await product.save();

        // Buat Log Mutasi
        const log = await StockTransferLog.create({
            produk_id,
            tipe: "Adjustment",
            jumlah: Math.abs(diff),
            dari_cabang: diff < 0 ? cabang : undefined, // Cabang asal kehilangan stok jika negatif
            ke_cabang: cabang,
            user_id: req.user._id,
            keterangan: keterangan || `Manual Adjust dari ${oldQty} ke ${newQty} (Selisih: ${diff})`
        });

        res.status(200).json({
            message: "Penyesuaian stok berhasil disimpan!",
            product,
            log
        });
    } catch (error) {
        res.status(500).json({
            message: "Gagal menyimpan penyesuaian stok",
            error: error.message
        });
    }
};

// @desc    Mendapatkan semua log mutasi transfer/penyesuaian stok
// @route   GET /api/products/transfer-logs
// @access  Private (Hanya Admin/Owner)
export const getTransferLogs = async (req, res) => {
    try {
        const query = {};
        if (req.user && req.user.role === "Admin") {
            query.$or = [
                { dari_cabang: req.user.cabang },
                { ke_cabang: req.user.cabang }
            ];
        }
        const logs = await StockTransferLog.find(query)
            .populate("produk_id", "nama_produk kategori harga")
            .populate("user_id", "nama_lengkap username role")
            .sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil log mutasi stok",
            error: error.message
        });
    }
};
