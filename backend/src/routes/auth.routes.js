import express from "express";
import { registerUser, verifyEmail, login, getMe, logout } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", login);
router.get("/get-me", isAuthenticated, getMe);
router.post("/logout", logout);
export default router;
