const { v4: uuid } = require("uuid");
const roomStore = require("../roomStore");

function registerRoomHandlers(io, socket, rooms) {

    socket.on("create-room", () => {
        const roomId = uuid();
        rooms[roomId] = roomStore.createRoom();
        socket.emit("room-created", roomId);
    });

    socket.on("join-room", ({ roomId, username }) => {
        const room = roomStore.getRoom(rooms, roomId);

        if (!room) {
            socket.emit("error-msg", "Room does not exist.");
            return;
        }

        socket.join(roomId);

        room.users[socket.id] = {
            id: socket.id,
            username: username
        };

        const defaultFile = roomStore.getDefaultFile();

        socket.emit("joined-room", roomId);
        socket.emit("load-files", roomStore.getFileList(room));
        socket.emit("file-content", {
            fileName: defaultFile,
            code: roomStore.getFileContent(room, defaultFile)
        });

        socket.emit("chat-history", roomStore.getChatMessages(room));
        socket.emit("draw-history", roomStore.getDrawStrokes(room));

        io.to(roomId).emit(
            "users-update",
            Object.values(room.users)
        );
    });

    socket.on("disconnect", () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];

            if (!room.users[socket.id]) continue;

            const isEmpty = roomStore.removeUser(rooms, roomId, socket.id);

            io.to(roomId).emit(
                "users-update",
                Object.values(room.users)
            );

            if (isEmpty) {
                roomStore.deleteRoom(rooms, roomId);
            }
        }
    });
}

module.exports = { registerRoomHandlers };
