const { v4: uuid } = require("uuid");
const roomStore = require("../roomStore");

function registerChatHandlers(io, socket, rooms) {

    socket.on("send-chat-message", ({ roomId, username, text }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;
        if (!room.users[socket.id]) return;

        const trimmed = typeof text === "string" ? text.trim() : "";
        if (!trimmed) return;

        const message = {
            id: uuid(),
            username: username || room.users[socket.id].username || "Anonymous",
            text: trimmed.slice(0, 2000),
            timestamp: Date.now()
        };

        roomStore.addChatMessage(room, message);
        io.to(roomId).emit("chat-message", message);
    });
}

module.exports = { registerChatHandlers };
