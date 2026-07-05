const DEFAULT_FILE = "main.cpp";
const MAX_CHAT_MESSAGES = 200;
const MAX_DRAW_STROKES = 3000;
const languageSupport = require("./languageSupport");

function createRoom() {
    return {
        users: {},
        files: {
            [DEFAULT_FILE]: languageSupport.getDefaultContent(DEFAULT_FILE)
        },
        messages: [],
        drawStrokes: []
    };
}

function getDefaultCppContent() {
    return languageSupport.getDefaultContent(".cpp");
}
function getDefaultFile() {
    return DEFAULT_FILE;
}

function getRoom(rooms, roomId) {
    return rooms[roomId] || null;
}

function deleteRoom(rooms, roomId) {
    delete rooms[roomId];
}

function removeUser(rooms, roomId, socketId) {
    const room = rooms[roomId];
    if (!room) return false;

    delete room.users[socketId];
    return Object.keys(room.users).length === 0;
}

function getFileList(room) {
    return Object.keys(room.files);
}

function getFileContent(room, fileName) {
    return room.files[fileName] ?? null;
}

function setFileContent(room, fileName, code) {
    if (room.files[fileName] === undefined) return false;
    room.files[fileName] = code;
    return true;
}

function createFile(room, fileName) {
    if (room.files[fileName] !== undefined) return false;
    room.files[fileName] = languageSupport.getDefaultContent(fileName);
    return true;
}
function deleteFile(room, fileName) {
    const fileNames = Object.keys(room.files);
    if (fileNames.length <= 1) return { ok: false, reason: "Cannot delete the last file." };
    if (room.files[fileName] === undefined) return { ok: false, reason: "File not found." };

    delete room.files[fileName];
    const fallback = Object.keys(room.files)[0];
    return { ok: true, fallback };
}

function renameFile(room, oldName, newName) {
    if (room.files[oldName] === undefined) return { ok: false, reason: "File not found." };
    if (room.files[newName] !== undefined) return { ok: false, reason: "A file with that name already exists." };

    room.files[newName] = room.files[oldName];
    delete room.files[oldName];
    return { ok: true };
}

function isValidFileName(fileName) {
    return languageSupport.isValidFileName(fileName);
}

function isValidCppFileName(fileName) {
    return isValidFileName(fileName);
}
function addChatMessage(room, message) {
    room.messages.push(message);

    if (room.messages.length > MAX_CHAT_MESSAGES) {
        room.messages = room.messages.slice(-MAX_CHAT_MESSAGES);
    }
}

function getChatMessages(room) {
    return room.messages;
}

function addDrawStroke(room, stroke) {
    room.drawStrokes.push(stroke);

    if (room.drawStrokes.length > MAX_DRAW_STROKES) {
        room.drawStrokes = room.drawStrokes.slice(-MAX_DRAW_STROKES);
    }
}

function getDrawStrokes(room) {
    return room.drawStrokes;
}

function clearDrawStrokes(room) {
    room.drawStrokes = [];
}

module.exports = {
    createRoom,
    getDefaultFile,
    getDefaultCppContent,
    getRoom,
    deleteRoom,
    removeUser,
    getFileList,
    getFileContent,
    setFileContent,
    createFile,
    deleteFile,
    renameFile,
    isValidCppFileName,
    isValidFileName,
    addChatMessage,
    getChatMessages,
    addDrawStroke,
    getDrawStrokes,
    clearDrawStrokes
};
