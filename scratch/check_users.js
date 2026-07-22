import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../backend/models/User.js";

dotenv.config({ path: "./backend/.env" });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nicky_frozen_db");
        console.log("Connected to DB");
        const users = await User.find({}, { password: 0 }); // exclude password hash
        console.log("Users:", JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
