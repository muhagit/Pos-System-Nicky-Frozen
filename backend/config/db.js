import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Terhubung: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error Koneksi MongoDB: ${error.message}`);
        process.exit(1); // Menghentikan proses jika gagal terhubung
    }
};
