import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

chatRouter.post("/message", isAuthenticated, sendMessage);

export default chatRouter;