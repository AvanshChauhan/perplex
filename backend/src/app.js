import express from "express";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chat.router.js"
import cors from "cors";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});
app.use("/api/auth",authRouter)
app.use("/api",chatRouter)
export default app;
