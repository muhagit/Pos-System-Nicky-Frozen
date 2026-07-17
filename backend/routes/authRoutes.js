import express from "express";
import { loginUser, forgotPassword, resetPassword, verifyOtp } from "../controllers/authController.js";
import { validateAuthInput } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/login", validateAuthInput, loginUser);
router.post("/forgot-password", validateAuthInput, forgotPassword);
router.post("/verify-otp", validateAuthInput, verifyOtp);
router.post("/reset-password", validateAuthInput, resetPassword);

export default router;
