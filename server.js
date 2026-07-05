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
const io = new Server(server);

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

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
