import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 1. Middleware untuk memverifikasi Token (Apakah user sudah login?)
export const protect = async (req, res, next) => {
    let token;

    // Cek apakah ada header Authorization yang dikirim dan diawali dengan 'Bearer'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Ambil token dari header (Format: "Bearer [token_rahasia]")
            token = req.headers.authorization.split(" ")[1];

            // Verifikasi token menggunakan secret key di .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Cari user di database berdasarkan ID dari token, TANPA mengambil password-nya
            req.user = await User.findById(decoded.id).select("-password");

            // Lanjut ke proses controller selanjutnya
            next();
        } catch (error) {
            res.status(401).json({
                message: "Tidak memiliki otorisasi, token gagal divalidasi",
            });
        }
    }

    if (!token) {
        res.status(401).json({
            message: "Tidak memiliki otorisasi, tidak ada token",
        });
    }
};

// 2. Middleware untuk membatasi Hak Akses (Role-based)
// Contoh penggunaan: router.post('/', protect, authorize('Owner', 'Admin'), createProduct);
export const authorize = (...roles) => {
    return (req, res, next) => {
        // Jika role user saat ini tidak ada di dalam daftar role yang diizinkan
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role User '${req.user.role}' tidak diizinkan mengakses rute ini`,
            });
        }
        next();
    };
};
