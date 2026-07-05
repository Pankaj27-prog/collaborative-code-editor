const roomStore = require("../roomStore");

function registerCodeHandlers(io, socket, rooms) {

    // Part 3.5: Synchronize code for the currently opened file
    socket.on("code-change", ({ roomId, fileName, code }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;
        if (!roomStore.setFileContent(room, fileName, code)) return;

        socket.to(roomId).emit("code-update", { fileName, code });
    });
}

module.exports = { registerCodeHandlers };
