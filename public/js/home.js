const socket = io();

const usernameInput = document.getElementById("username");
const roomIdInput = document.getElementById("roomId");

const savedUsername = localStorage.getItem("username");
if (savedUsername) {
    usernameInput.value = savedUsername;
}

function getUsername() {
    return usernameInput.value.trim();
}

function requireUsername() {
    if (getUsername() === "") {
        alert("Please enter a username.");
        usernameInput.focus();
        return false;
    }
    return true;
}

document.getElementById("create").addEventListener("click", () => {
    if (!requireUsername()) return;
    socket.emit("create-room");
});

document.getElementById("join").addEventListener("click", () => {
    if (!requireUsername()) return;

    const roomId = roomIdInput.value.trim();
    if (roomId === "") {
        alert("Please enter a room ID to join.");
        roomIdInput.focus();
        return;
    }

    socket.emit("join-room", {
        roomId,
        username: getUsername()
    });
});

socket.on("room-created", (id) => {
    localStorage.setItem("username", getUsername());
    location.href = "room.html?room=" + id;
});

socket.on("joined-room", (id) => {
    localStorage.setItem("username", getUsername());
    location.href = "room.html?room=" + id;
});

socket.on("error-msg", (msg) => {
    alert(msg);
});
