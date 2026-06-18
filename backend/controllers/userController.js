import User from "../models/User.js";
import bcrypt from "bcryptjs";
export const getUsers = async (req, res) => {
    try {
        // Mengambil semua user dari database, kecuali password-nya
        const users = await User.find({}).select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data user",
            error: error.message,
        });
    }
};

// @desc    Menghapus user
// @route   DELETE /api/users/:id
// @access  Private (Owner, Admin)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await User.findByIdAndDelete(req.params.id);
            res.json({ message: "User berhasil dihapus" });
        } else {
            res.status(404).json({ message: "User tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Gagal menghapus user",
            error: error.message,
        });
    }
};

// @desc    Memperbarui/Mengedit data user
// @route   PUT /api/users/:id
// @access  Private (Owner, Admin)
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Sesuaikan nama field dengan schema database Anda
            user.nama_lengkap = req.body.nama_lengkap || user.nama_lengkap;
            user.username = req.body.username || user.username;
            user.role = req.body.role || user.role;
            user.cabang = req.body.cabang || user.cabang;
            user.status = req.body.status || user.status;

            // Jika user mengganti password dari form edit
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                nama_lengkap: updatedUser.nama_lengkap,
                username: updatedUser.username,
                role: updatedUser.role,
                cabang: updatedUser.cabang,
                status: updatedUser.status,
            });
        } else {
            res.status(404).json({ message: "User tidak ditemukan" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Gagal memperbarui user",
            error: error.message,
        });
    }
};

// @desc    Mendaftarkan/Menambah user baru
// @route   POST /api/users
// @access  Private (Owner, Admin)
export const registerUser = async (req, res) => {
    try {
        const { nama_lengkap, username, password, role, cabang, status } =
            req.body;

        // Cek apakah username sudah dipakai di database
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({
                message: "Username sudah digunakan, silakan pilih yang lain",
            });
        }

        // ==================== 2. HASH PASSWORD DI SINI ====================
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // ==================================================================

        // 3. Buat user baru dengan password yang sudah terenkripsi (hashedPassword)
        const user = await User.create({
            nama_lengkap,
            username,
            password: hashedPassword, // <--- Masukkan hasil enkripsi ke sini
            role,
            cabang,
            status: status || "Active",
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                role: user.role,
                cabang: user.cabang,
                status: user.status,
            });
        } else {
            res.status(400).json({ message: "Data user tidak valid" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Gagal membuat user baru",
            error: error.message,
        });
    }
};