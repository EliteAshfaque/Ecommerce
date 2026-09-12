import app from "./app.js";
import { createTables } from "./utils/createTable.js";
import { createServer } from "node:http";
import { initializeSocketServer } from "./realtime/socket.js";
import {v2 as cloudinary} from "cloudinary"
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

// Complete schema initialization before accepting traffic.
const startServer = async () => {
  await createTables();
  const httpServer = createServer(app);
  initializeSocketServer(httpServer);
  httpServer.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
 
