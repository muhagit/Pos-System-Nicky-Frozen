import multer from "multer";
import path from "path";
import fs from "fs"; // <-- Tambahkan import fs (File System) bawaan Node.js

// Tentukan lokasi folder
const uploadDir = "uploads/";

// Mengecek apakah folder uploads sudah ada, jika belum maka buat otomatis
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Folder 'uploads' berhasil dibuat secara otomatis.");
}

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir); // Menggunakan variabel uploadDir
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
        );
    },
});

// Filter hanya untuk gambar
const checkFileType = (file, cb) => {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(
            new Error(
                "Hanya file gambar (JPG, JPEG, PNG, WEBP) yang diperbolehkan!",
            ),
        );
    }
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

export default upload;
