const roomStore = require("../roomStore");

function registerDrawHandlers(io, socket, rooms) {

    socket.on("draw-start", ({ roomId, stroke }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room || !room.users[socket.id] || !stroke) return;

        socket.to(roomId).emit("draw-start", stroke);
    });

    socket.on("draw-point", ({ roomId, strokeId, x, y }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room || !room.users[socket.id]) return;

        socket.to(roomId).emit("draw-point", { strokeId, x, y });
    });

    socket.on("draw-end", ({ roomId, stroke }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room || !room.users[socket.id] || !stroke) return;

        roomStore.addDrawStroke(room, stroke);
        io.to(roomId).emit("draw-end", stroke);
    });

    socket.on("draw-clear", ({ roomId }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room || !room.users[socket.id]) return;

        roomStore.clearDrawStrokes(room);
        io.to(roomId).emit("draw-clear");
    });
}

module.exports = { registerDrawHandlers };
