import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dns from "dns";
import sendEmail from "../utils/sendEmail.js";
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

            if (req.body.email) {
                const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
                if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                    return res.status(400).json({ message: "Email sudah digunakan oleh user lain" });
                }
                user.email = req.body.email.toLowerCase();
            }

            // Jika user mengganti password dari form edit
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                nama_lengkap: updatedUser.nama_lengkap,
                username: updatedUser.username,
                email: updatedUser.email,
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
        const { nama_lengkap, username, email, password, role, cabang, status } =
            req.body;

        // Cek apakah username sudah dipakai di database
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({
                message: "Username sudah digunakan, silakan pilih yang lain",
            });
        }

        if (!email) {
            return res.status(400).json({ message: "Email harus diisi" });
        }
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({
                message: "Email sudah digunakan, silakan pilih yang lain",
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
            email: email.toLowerCase(),
            password: hashedPassword, // <--- Masukkan hasil enkripsi ke sini
            role,
            cabang,
            status: status || "Active",
        });

        if (user) {
            // Mengirimkan email notifikasi berhasil membuat akun
            const loginUrl = `http://localhost:5173/`;
            const message = `Halo ${nama_lengkap},\n\nAkun Anda untuk sistem Nicky Frozen POS telah berhasil dibuat dengan role ${role}.\n\nUsername: ${username}\nEmail: ${email.toLowerCase()}\nPassword: ${password}\n\nSilakan login melalui tautan berikut: ${loginUrl}\n\nHarap segera ubah password Anda setelah berhasil login demi keamanan akun Anda.`;
            const htmlMessage = `
                <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                    <h2>Selamat Datang di Nicky Frozen POS!</h2>
                    <p>Halo <strong>${nama_lengkap}</strong>,</p>
                    <p>Akun Anda telah berhasil dibuat oleh Owner/Admin dengan role <strong>${role}</strong>.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${email.toLowerCase()}</p>
                        <p style="margin: 0;"><strong>Password Sementara:</strong> ${password}</p>
                    </div>
                    <p>Silakan gunakan informasi di atas untuk login ke dalam sistem:</p>
                    <a href="${loginUrl}" style="display:inline-block;padding:10px 20px;color:#fff;background-color:#06b6d4;border-radius:5px;text-decoration:none;margin-bottom:15px;">Login Sekarang</a>
                    <p style="font-size: 0.9em; color: #dc2626;"><strong>Penting:</strong> Harap segera ubah password Anda setelah berhasil login demi keamanan akun Anda.</p>
                    <p>Terima kasih.</p>
                </div>
            `;

            try {
                await sendEmail({
                    email: user.email,
                    subject: "Akun Berhasil Dibuat - Nicky Frozen POS",
                    message,
                    htmlMessage
                });
            } catch (err) {
                console.error("Gagal mengirim email notifikasi akun baru:", err);
                // Email gagal tidak membatalkan pembuatan user
            }

            res.status(201).json({
                _id: user._id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                email: user.email,
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

const checkDomainMX = (domain) => {
    return new Promise((resolve) => {
        dns.resolveMx(domain, (err, addresses) => {
            if (err) {
                if (err.code === "ENOTFOUND") {
                    return resolve(false);
                }
                return resolve(true);
            }
            if (!addresses || addresses.length === 0) {
                return resolve(false);
            }
            resolve(true);
        });
    });
};

export const verifyUserStep1 = async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: "Username dan email harus diisi" });
        }

        // 1. Cek username unik
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: "Username sudah digunakan, silakan pilih yang lain" });
        }

        // 2. Format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Format email tidak valid" });
        }

        // 3. Cek email unik
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ message: "Email sudah digunakan, silakan pilih yang lain" });
        }

        // 4. Cek MX domain (real domain verification)
        const domain = email.split("@")[1];
        const isRealEmail = await checkDomainMX(domain);
        if (!isRealEmail) {
            return res.status(400).json({ message: "Email terdeteksi sebagai dummy atau domain tidak aktif" });
        }

        res.json({ success: true, message: "Username dan email valid" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memverifikasi data", error: error.message });
    }
};