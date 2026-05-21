import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        nama_lengkap: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["Owner", "Admin", "Kasir"],
            required: true,
        },
        cabang: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
    },
);

export default mongoose.model("User", userSchema);
