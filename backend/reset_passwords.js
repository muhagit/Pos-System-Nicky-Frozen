import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config({ path: "./.env" });

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nicky_frozen_db");
        console.log("Connected to DB");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("Nicky123!", salt);
        
        const result = await User.updateMany(
            { username: { $in: ["owner", "admin_jogja", "kasir_jogja1", "admin_solo", "kasir_solo1", "kasir_mgl", "admin_mgl"] } },
            { $set: { password: hashedPassword } }
        );
        console.log("Updated users:", result);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();
