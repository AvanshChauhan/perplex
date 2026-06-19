import "dotenv/config";
import app from "./backend/src/app.js";
import connectDB from "./backend/src/config/db.js";
import http from "http"
import { initialiseSocket } from "./backend/src/sockets/server.socket.js";

const PORT = process.env.PORT || 3000;
const httpServer=http.createServer(app)
initialiseSocket(httpServer)
const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server and Socket.io are running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
