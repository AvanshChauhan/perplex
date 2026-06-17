import dotenv from "dotenv";
import app from "./backend/src/app.js";
import connectDB from "./backend/src/config/db.js";
import http from "http"
import { initialiseSocket } from "./backend/src/sockets/server.socket.js";
dotenv.config();
const PORT = process.env.PORT || 3000;
const httpServer=http.createServer(app)
initialiseSocket(httpServer)
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
httpServer.listen(PORT,()=>{
  console.log("socket io is running")
})