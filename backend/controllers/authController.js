import User from "../models/User.js";
import Branch from "../models/Branch.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// Fungsi untuk membuat token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d", // Token berlaku selama 30 hari
    });
};

// @desc    Register user baru (Nantinya hanya Owner/Admin yang bisa pakai ini)
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
    try {
        const { username, password, nama_lengkap, role, cabang } = req.body;

        // Cek apakah username sudah dipakai
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res
                .status(400)
                .json({ message: "Username sudah terdaftar" });
        }

        // Hash password sebelum disimpan
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat user baru
        const user = await User.create({
            username,
            password: hashedPassword,
            nama_lengkap,
            role,
            cabang,
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                nama_lengkap: user.nama_lengkap,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: "Data user tidak valid" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Gagal mendaftar",
            error: error.message,
        });
    }
};

// @desc    Login user & dapatkan token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cari user berdasarkan username atau email
        const user = await User.findOne({
            $or: [{ username: username }, { email: username.toLowerCase() }]
        });

        // Cocokkan password yang diinput dengan password yang di-hash di database
        // Cocokkan password yang diinput dengan password yang di-hash di database
        if (user && (await bcrypt.compare(password, user.password))) {
            // Cek apakah status user Inactive
            if (user.status === "Inactive") {
                return res.status(401).json({ message: "Akun Anda telah dinonaktifkan. Silakan hubungi Owner." });
            }

            // Cek apakah cabang untuk user (selain Owner) masih ada di database
            if (user.role !== "Owner" && user.cabang && user.cabang.toLowerCase() !== "pusat" && user.cabang.toLowerCase() !== "cabang pusat") {
                const branchExists = await Branch.findOne({ name: user.cabang });
                if (!branchExists) {
                    return res.status(401).json({ message: "Akses Ditolak: Cabang untuk akun ini sudah tidak tersedia atau telah dihapus." });
                }
            }

            res.json({
                _id: user.id,
                username: user.username,
                nama_lengkap: user.nama_lengkap,
                role: user.role,
                cabang: user.cabang,
                status: user.status,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "Username atau Password salah" });
        }
    } catch (error) {
        res.status(500).json({ message: "Gagal login", error: error.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body; // we will treat 'email' as 'identifier' (username or email) for backwards compatibility
        const identifier = email;

        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier.toLowerCase() }]
        });

        if (!user) {
            return res.status(404).json({ message: "Pengguna dengan Username atau Email tersebut tidak ditemukan." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // Set expire (10 minutes)
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const message = `Halo,\n\nAnda menerima email ini karena Anda (atau orang lain) telah meminta reset password. Kode OTP Anda adalah:\n\n${otp}\n\nMasukkan kode ini pada aplikasi untuk mereset password Anda. Kode ini berlaku selama 10 menit.`;
        const htmlMessage = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <h2>Reset Password Request</h2>
                <p>Halo,</p>
                <p>Anda menerima email ini karena Anda (atau orang lain) telah meminta reset password. Kode OTP Anda adalah:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center;">
                    ${otp}
                </div>
                <p>Masukkan kode ini pada aplikasi untuk mereset password Anda. Kode ini berlaku selama 10 menit.</p>
                <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Reset Password - Nicky Frozen POS",
                message,
                htmlMessage
            });

            // Mask email for response
            const emailParts = user.email.split("@");
            const namePart = emailParts[0];
            const domainPart = emailParts[1];
            let maskedName = namePart;
            if (namePart.length > 2) {
                maskedName = namePart[0] + "*".repeat(namePart.length - 2) + namePart[namePart.length - 1];
            }
            const maskedEmail = `${maskedName}@${domainPart}`;

            res.status(200).json({ success: true, message: "Email sent", maskedEmail, email: user.email });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Email tidak bisa dikirim", error: err.message });
        }
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email dan OTP wajib diisi." });
        }

        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(otp.toString())
            .digest("hex");

        const user = await User.findOne({
            email,
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Kode OTP salah atau sudah kedaluwarsa." });
        }

        res.status(200).json({ success: true, message: "Kode OTP valid." });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan saat memverifikasi OTP", error: error.message });
    }
};

// @desc    Reset Password via OTP
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ message: "Email, OTP, dan Password baru wajib diisi." });
        }

        // Get hashed token (OTP)
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(otp.toString())
            .digest("hex");

        const user = await User.findOne({
            email,
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Kode OTP tidak valid atau sudah kedaluwarsa." });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password berhasil diubah. Silakan login." });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan saat mereset password", error: error.message });
    }
};
