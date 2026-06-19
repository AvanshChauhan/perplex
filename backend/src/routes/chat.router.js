import { Router } from "express";
import {
  deleteMessage,
  getMessage,
  getMessages,
  sendMessage,
} from "../controllers/chat.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

chatRouter.post("/message", isAuthenticated, sendMessage);
chatRouter.get("/messages/:chatId", isAuthenticated, getMessages);
chatRouter.get("/message/:messageId", isAuthenticated, getMessage);
chatRouter.delete("/message/:messageId", isAuthenticated, deleteMessage);

export default chatRouter;
