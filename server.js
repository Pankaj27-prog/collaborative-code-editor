const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const { registerRoomHandlers } = require("./server/handlers/roomHandlers");
const { registerFileHandlers } = require("./server/handlers/fileHandlers");
const { registerCodeHandlers } = require("./server/handlers/codeHandlers");
const { registerCompileHandlers } = require("./server/handlers/compileHandlers");
const { registerChatHandlers } = require("./server/handlers/chatHandlers");
const { registerDrawHandlers } = require("./server/handlers/drawHandlers");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000
});

app.set("trust proxy", 1);

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.use(express.static("public"));

const rooms = {};

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    registerRoomHandlers(io, socket, rooms);
    registerFileHandlers(io, socket, rooms);
    registerCodeHandlers(io, socket, rooms);
    registerCompileHandlers(io, socket, rooms);
    registerChatHandlers(io, socket, rooms);
    registerDrawHandlers(io, socket, rooms);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
