import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        nama_lengkap: { type: String, required: true },
        role: {
            type: String,
            enum: ["Owner", "Admin", "Kasir"],
            required: true,
        },
        cabang: { type: String, required: true },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true },
);

export default mongoose.model("User", userSchema);
