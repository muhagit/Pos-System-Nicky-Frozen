import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        address: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Branch", branchSchema);
