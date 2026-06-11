import express from "express";
import { registerUser, verifyEmail ,login,getMe } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/login",login)
router.get("/get-me",getMe)
export default router;
