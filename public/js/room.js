const socket = io();

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
const username = localStorage.getItem("username");

const copyRoomBtn = document.getElementById("copyRoomId");

copyRoomBtn.addEventListener("click", async () => {
    const originalText = copyRoomBtn.textContent;

    try {
        await navigator.clipboard.writeText(roomId);
    } catch {
        const temp = document.createElement("textarea");
        temp.value = roomId;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
    }

    copyRoomBtn.textContent = "Copied!";
    setTimeout(() => {
        copyRoomBtn.textContent = originalText;
    }, 2000);
});

socket.on("users-update", (users) => {
    const userList = document.getElementById("user-list");
    if (!userList) return;

    if (users.length === 0) {
        userList.innerHTML = `<div class="text-gray-500 text-sm">No users</div>`;
        return;
    }

    userList.innerHTML = users.map((user) => `
        <div class="flex items-center gap-2 text-gray-300 text-sm py-0.5">
            <span class="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
            <span class="truncate">${user.username}</span>
        </div>
    `).join("");
});

async function initRoom() {
    CodabOutputPanel.init();
    CodabChat.init(socket, roomId, username);
    CodabDrawBoard.init(socket, roomId, username);
    CodabCodeSync.init(socket, roomId);
    CodabCompile.init(socket, roomId);
    CodabSaveLocal.init();

    CodabFileManager.init(socket, roomId, {
        onSwitch: (fileName, code) => {
            CodabCodeSync.loadFile(fileName, code);
            CodabEditor.setLanguage(fileName);
        }
    });

    await CodabEditor.init("editor");

    CodabCodeSync.flushPending();
    CodabCodeSync.bindEditor(() => {
        const fileName = CodabFileManager.getActiveFile();
        if (!fileName) return;
        CodabCodeSync.sendChange(fileName, CodabEditor.getValue());
    });

    socket.emit("join-room", { roomId, username });
}

initRoom();
