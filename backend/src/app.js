import express from "express";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chat.router.js"
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
  origin: clientUrl.split(",").map(u => u.trim()),
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api", limiter);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser())
app.use(express.urlencoded({extended:true, limit: "1mb"}))

app.use("/api/auth", authRouter)
app.use("/api", chatRouter)

const frontendDist = path.resolve(__dirname, "../../frontend/dist");
const frontendIndex = path.join(frontendDist, "index.html");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ success: false, message: "API route not found" });
    }
    res.sendFile(frontendIndex, (err) => {
      if (err) next(err);
    });
  });

  console.log(`Serving static files from: ${frontendDist}`);
} else {
  console.warn(`Frontend dist not found at: ${frontendDist}`);
  console.warn("Run 'npm run build' to build the frontend for production.");

  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Perplex API is running. Frontend is not built yet.",
      docs: "Run 'npm run build' to build the frontend."
    });
  });
}

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
