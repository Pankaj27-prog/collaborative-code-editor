const roomStore = require("../roomStore");
const languageSupport = require("../languageSupport");

function broadcastFileList(io, roomId, room) {    io.to(roomId).emit("load-files", roomStore.getFileList(room));
}

function registerFileHandlers(io, socket, rooms) {

    // Part 3.2: Create new .cpp files
    socket.on("create-file", ({ roomId, fileName }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;

        if (!roomStore.isValidFileName(fileName)) return;

        if (languageSupport.getExtension(fileName) === ".java") {
            const expected = `${languageSupport.getJavaClassName(fileName)}.java`;
            if (fileName !== expected) {
                socket.emit("error-msg", `Java file must be named ${expected}`);
                return;
            }
        }

        if (!roomStore.createFile(room, fileName)) return;
        broadcastFileList(io, roomId, room);
    });

    // Part 3.3: Switch between files — client requests file content
    socket.on("switch-file", ({ roomId, fileName }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;

        const code = roomStore.getFileContent(room, fileName);
        if (code === null) return;

        socket.emit("file-content", { fileName, code });
    });

    // Part 3.6: Delete files
    socket.on("delete-file", ({ roomId, fileName }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;

        const result = roomStore.deleteFile(room, fileName);
        if (!result.ok) {
            socket.emit("error-msg", result.reason);
            return;
        }

        broadcastFileList(io, roomId, room);
        io.to(roomId).emit("file-deleted", {
            fileName,
            fallback: result.fallback
        });
    });

    // Part 3.6: Rename files
    socket.on("rename-file", ({ roomId, oldName, newName }) => {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;

        if (!roomStore.isValidFileName(newName)) {
            socket.emit("error-msg", `Supported extensions: ${languageSupport.getSupportedExtensionsLabel()}`);
            return;
        }

        if (languageSupport.getExtension(newName) === ".java") {
            const expected = `${languageSupport.getJavaClassName(newName)}.java`;
            if (newName !== expected) {
                socket.emit("error-msg", `Java file must be named ${expected}`);
                return;
            }
        }

        const result = roomStore.renameFile(room, oldName, newName);
        if (!result.ok) {
            socket.emit("error-msg", result.reason);
            return;
        }

        broadcastFileList(io, roomId, room);
        io.to(roomId).emit("file-renamed", { oldName, newName });
    });
}

module.exports = { registerFileHandlers };
