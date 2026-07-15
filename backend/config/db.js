import mongoose from "mongoose";
import Branch from "../models/Branch.js";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Terhubung: ${conn.connection.host}`);

        // Seed default branches if empty
        const count = await Branch.countDocuments();
        if (count === 0) {
            await Branch.insertMany([
                { name: "Cabang Jogja", address: "Yogyakarta", isActive: true },
                { name: "Cabang Solo", address: "Solo", isActive: true }
            ]);
            console.log("Database seeded with default branches: Cabang Jogja, Cabang Solo.");
        }
    } catch (error) {
        console.error(`Error Koneksi MongoDB: ${error.message}`);
        process.exit(1); // Menghentikan proses jika gagal terhubung
    }
};
