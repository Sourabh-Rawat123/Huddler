const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const socketIO = require("socket.io");
const connectDB = require("./db/index.js");
const app = require("./app.js");
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Import and initialize socket handler
require("./socket/chat.socket.js")(io);

// Connect to DB and start server
connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log("✅ Connection successful to port", `${port}`);
      console.log("✅ Socket.io initialized");
    });
  })
  .catch((err) => {
    console.log("❌ Connection to db error", err);
  });


