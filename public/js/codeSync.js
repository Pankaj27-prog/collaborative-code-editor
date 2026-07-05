const CodabCodeSync = {

    socket: null,
    roomId: null,
    isUpdating: false,
    lastSentCode: "",
    pendingUpdate: null,

    init(socket, roomId) {
        this.socket = socket;
        this.roomId = roomId;
        this.bindSocketEvents();
    },

    bindSocketEvents() {
        // Part 3.5: Synchronize code for the currently opened file
        this.socket.on("code-update", ({ fileName, code }) => {
            const activeFile = window.CodabFileManager.getActiveFile();

            if (fileName !== activeFile) {
                window.CodabFileManager.updateCache(fileName, code);
                return;
            }

            this.applyRemoteCode(code);
        });
    },

    bindEditor(onContentChange) {
        CodabEditor.onChange(() => {
            if (this.isUpdating) return;
            onContentChange();
        });
    },

    applyRemoteCode(code) {
        if (!CodabEditor.instance) {
            this.pendingUpdate = code;
            return;
        }

        if (CodabEditor.getValue() === code) return;

        this.isUpdating = true;
        CodabEditor.setValue(code);
        this.lastSentCode = code;
        this.isUpdating = false;
    },

    loadFile(fileName, code) {
        if (!CodabEditor.instance) {
            this.pendingUpdate = code;
            return;
        }

        this.isUpdating = true;
        CodabEditor.setValue(code, false);
        CodabEditor.setLanguage(fileName);
        this.lastSentCode = code;
        this.isUpdating = false;

        window.CodabFileManager.updateCache(fileName, code);
    },

    flushPending() {
        if (this.pendingUpdate !== null) {
            this.applyRemoteCode(this.pendingUpdate);
            this.pendingUpdate = null;
        }
    },

    sendChange(fileName, code) {
        if (code === this.lastSentCode) return;

        this.lastSentCode = code;
        window.CodabFileManager.updateCache(fileName, code);

        this.socket.emit("code-change", {
            roomId: this.roomId,
            fileName,
            code
        });
    },

    flushCurrentFile() {
        const fileName = window.CodabFileManager.getActiveFile();
        if (!fileName || !CodabEditor.instance) return;

        const code = CodabEditor.getValue();
        this.sendChange(fileName, code);
    }
};

window.CodabCodeSync = CodabCodeSync;
