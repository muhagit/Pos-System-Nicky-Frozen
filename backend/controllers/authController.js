import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
        const { username, password, role } = req.body;

        // Cari user berdasarkan username
        const user = await User.findOne({ username });
        // cek role sesuai pilihan login
if (user && user.role !== role) {
    return res.status(401).json({
        message: "Role tidak sesuai",
    });
}

        // Cocokkan password yang diinput dengan password yang di-hash di database
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                username: user.username,
                nama_lengkap: user.nama_lengkap,
                role: user.role,
                cabang: user.cabang,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "Username atau Password salah" });
        }
    } catch (error) {
        res.status(500).json({ message: "Gagal login", error: error.message });
    }
};
