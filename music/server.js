import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import initSocketServer from "./src/sockets/socket.server.js";
import http from "http";

const httpServer = http.createServer(app);

connectDB();
initSocketServer(httpServer);

httpServer.listen(process.env.PORT || 3002, () => {
  console.log("Server is running on port", process.env.PORT || 3002);
});
