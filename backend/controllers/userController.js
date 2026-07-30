import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dns from "dns";
import sendEmail from "../utils/sendEmail.js";

const DISPOSABLE_DOMAINS = [
    "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf", 
    "courriel.fr.nf", "moncourriel.fr.nf", "monemail.fr.nf", "monmail.fr.nf", 
    "hide.biz.pr", "mymail.infos.ucl.ac.be", "mailinator.com", "mailinator.net", 
    "mailinator.org", "mailin8r.com", "binkmail.com", "safetymail.info", 
    "tempmail.com", "temp-mail.org", "temp-mail.ru", "temp-mail.de", 
    "guerrillamail.com", "guerrillamailblock.com", "guerrillamail.net", 
    "guerrillamail.org", "guerrillamail.biz", "grr.la", "guerrillamail.de", 
    "10minutemail.com", "10minutemail.co.za", "10minutemail.net", "10minutemail.org", 
    "trashmail.com", "trashmail.de", "trashmail.me", "trashmail.at", "trashmail.net", 
    "sharklasers.com", "guerrillamail.info", "guerrillamail.la", "dispostable.com", 
    "getairmail.com", "maildrop.cc", "mintemail.com", "generator.email", 
    "throwawaymail.com", "emailondeck.com", "tempmailaddress.com", "burnermail.io", 
    "fakemailgenerator.com", "tempmail.net", "10minutemail.co", "tempmail.co", 
    "crazymailing.com", "disposable.com", "quickemail.info"
];

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

const validateEmailReal = async (email) => {
    if (!email) {
        return { isValid: false, message: "Email harus diisi" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: "Format email tidak valid" };
    }

    // Mengizinkan email dummy dengan menonaktifkan pengecekan disposable domain dan DNS MX
    return { isValid: true };
};

const validatePasswordStrength = (password) => {
    if (!password) {
        return { isValid: false, message: "Password harus diisi" };
    }
    if (password.length < 8) {
        return { isValid: false, message: "Password minimal 8 karakter" };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
        return { isValid: false, message: "Password harus terdiri dari huruf dan angka" };
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    if (!hasUppercase || !hasLowercase) {
        return { isValid: false, message: "Password harus memiliki huruf kapital dan non-kapital" };
    }
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    if (!hasSymbol) {
        return { isValid: false, message: "Password harus memiliki setidaknya satu simbol" };
    }
    return { isValid: true };
};
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
            if (req.params.id === req.user._id.toString()) {
                return res.status(400).json({
                    message: "Akses Ditolak: Anda tidak diizinkan menghapus akun Anda sendiri",
                });
            }
            if (req.user.role === "Admin" && user.role === "Owner") {
                return res.status(403).json({
                    message: "Akses Ditolak: Admin tidak diizinkan menghapus akun Owner",
                });
            }
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
            if (req.user.role === "Admin" && user.role === "Owner") {
                return res.status(403).json({
                    message: "Akses Ditolak: Admin tidak diizinkan mengubah akun Owner",
                });
            }
            if (req.user.role === "Admin" && req.body.role === "Owner") {
                return res.status(403).json({
                    message: "Akses Ditolak: Admin tidak diizinkan memberikan role Owner",
                });
            }
            // Sesuaikan nama field dengan schema database Anda
            user.nama_lengkap = req.body.nama_lengkap || user.nama_lengkap;
            user.username = req.body.username || user.username;
            user.role = req.body.role || user.role;
            user.cabang = req.body.cabang || user.cabang;
            user.status = req.body.status || user.status;

            if (req.body.email) {
                const emailValidation = await validateEmailReal(req.body.email);
                if (!emailValidation.isValid) {
                    return res.status(400).json({ message: emailValidation.message });
                }

                const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
                if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                    return res.status(400).json({ message: "Email sudah digunakan oleh user lain" });
                }
                user.email = req.body.email.toLowerCase();
            }

            // Jika user mengganti password dari form edit
            if (req.body.password) {
                const passwordValidation = validatePasswordStrength(req.body.password);
                if (!passwordValidation.isValid) {
                    return res.status(400).json({ message: passwordValidation.message });
                }
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
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

        if (req.user.role === "Admin" && role === "Owner") {
            return res.status(403).json({
                message: "Akses Ditolak: Admin tidak diizinkan membuat akun Owner",
            });
        }

        // Cek apakah username sudah dipakai di database
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({
                message: "Username sudah digunakan, silakan pilih yang lain",
            });
        }

        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({
                message: "Email sudah digunakan, silakan pilih yang lain",
            });
        }

        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ message: passwordValidation.message });
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

        // 2. Cek email unik
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ message: "Email sudah digunakan, silakan pilih yang lain" });
        }

        res.json({ success: true, message: "Username dan email valid" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memverifikasi data", error: error.message });
    }
};