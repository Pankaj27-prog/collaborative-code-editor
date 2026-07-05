const CodabFileManager = {

    socket: null,
    roomId: null,
    files: [],
    activeFile: null,
    fileCache: {},
    onSwitch: null,

    init(socket, roomId, callbacks = {}) {
        this.socket = socket;
        this.roomId = roomId;
        this.onSwitch = callbacks.onSwitch || null;

        this.bindSocketEvents();
        this.bindNewFileButton();
    },

    bindNewFileButton() {
        document.getElementById("newFile").addEventListener("click", () => {
            this.promptCreateFile();
        });
    },

    bindSocketEvents() {
        // Part 3.4: Synchronize file list across all users
        this.socket.on("error-msg", (message) => {
            alert(message);
        });

        this.socket.on("load-files", (serverFiles) => {
            this.files = serverFiles;
            this.renderFiles();
        });

        this.socket.on("file-content", ({ fileName, code }) => {
            this.fileCache[fileName] = code;
            this.setActiveFile(fileName, code);
        });

        this.socket.on("file-deleted", ({ fileName, fallback }) => {
            delete this.fileCache[fileName];

            if (this.activeFile === fileName) {
                this.switchToFile(fallback);
            }
        });

        this.socket.on("file-renamed", ({ oldName, newName }) => {
            if (this.fileCache[oldName] !== undefined) {
                this.fileCache[newName] = this.fileCache[oldName];
                delete this.fileCache[oldName];
            }

            if (this.activeFile === oldName) {
                this.activeFile = newName;
                document.getElementById("active-file").textContent = newName;
            }
        });
    },

    // Part 3.2: Create new .cpp files
    promptCreateFile() {
        const extensions = CodabLanguages.getExtensionsLabel();
        let fileName = prompt(`Enter file name (${extensions})`);

        if (!fileName) return;

        fileName = fileName.trim();
        if (fileName === "") return;

        if (!CodabLanguages.isValidFileName(fileName)) {
            alert(`Supported file types: ${extensions}`);
            return;
        }

        this.socket.emit("create-file", {
            roomId: this.roomId,
            fileName
        });
    },

    // Part 3.3: Switch between files
    switchToFile(fileName) {
        if (this.activeFile === fileName) return;

        if (this.activeFile && window.CodabCodeSync) {
            window.CodabCodeSync.flushCurrentFile();
        }

        if (this.fileCache[fileName] !== undefined) {
            this.setActiveFile(fileName, this.fileCache[fileName]);
            return;
        }

        this.socket.emit("switch-file", {
            roomId: this.roomId,
            fileName
        });

        // Close sidebar on phones
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById("sidebar");
            if (sidebar) {
                sidebar.classList.remove("open");
            }
        }
    },

    setActiveFile(fileName, code) {
        this.activeFile = fileName;
        this.fileCache[fileName] = code;

        document.getElementById("active-file").textContent = fileName;

        const langLabel = document.getElementById("active-language");
        if (langLabel && window.CodabLanguages) {
            langLabel.textContent = CodabLanguages.getLanguageLabel(fileName);
        }

        this.renderFiles();

        if (this.onSwitch) {
            this.onSwitch(fileName, code);
        }
    },

    renderFiles() {
        const fileList = document.getElementById("file-list");
        fileList.innerHTML = "";

        this.files.forEach((file) => {
            const row = document.createElement("div");
            row.className = "group flex items-center justify-between px-3 py-2 border-b border-gray-700 transition";

            if (file === this.activeFile) {
                row.classList.add("bg-gray-700");
            } else {
                row.classList.add("hover:bg-gray-750");
            }

            const nameBtn = document.createElement("button");
            nameBtn.type = "button";
            nameBtn.className = "flex-1 text-left text-gray-300 cursor-pointer py-1 truncate";
            nameBtn.textContent = "📄 " + file;
            nameBtn.addEventListener("click", () => {

                this.switchToFile(file);

                // Close sidebar on phones after selecting a file
                if (window.innerWidth <= 768) {
                    document.getElementById("sidebar").classList.remove("open");
                }

            });

            const actions = document.createElement("div");
            actions.className = "hidden group-hover:flex items-center gap-1 ml-2";

            const renameBtn = document.createElement("button");
            renameBtn.type = "button";
            renameBtn.title = "Rename";
            renameBtn.className = "text-xs text-yellow-400 hover:text-yellow-300 px-1";
            renameBtn.textContent = "✎";
            renameBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                this.promptRenameFile(file);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.title = "Delete";
            deleteBtn.className = "text-xs text-red-400 hover:text-red-300 px-1";
            deleteBtn.textContent = "✕";
            deleteBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                this.promptDeleteFile(file);
            });

            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);

            row.appendChild(nameBtn);
            row.appendChild(actions);
            fileList.appendChild(row);
        });
    },

    // Part 3.6: Delete files
    promptDeleteFile(fileName) {
        if (this.files.length <= 1) {
            alert("Cannot delete the last file.");
            return;
        }

        if (!confirm(`Delete "${fileName}"?`)) return;

        this.socket.emit("delete-file", {
            roomId: this.roomId,
            fileName
        });
    },

    // Part 3.6: Rename files
    promptRenameFile(oldName) {
        const extensions = CodabLanguages.getExtensionsLabel();
        let newName = prompt(`Enter new file name (${extensions})`, oldName);

        if (!newName || newName === oldName) return;

        newName = newName.trim();

        if (!CodabLanguages.isValidFileName(newName)) {
            alert(`Supported file types: ${extensions}`);
            return;
        }

        this.socket.emit("rename-file", {
            roomId: this.roomId,
            oldName,
            newName
        });
    },

    getActiveFile() {
        return this.activeFile;
    },

    updateCache(fileName, code) {
        this.fileCache[fileName] = code;
    }
};

window.CodabFileManager = CodabFileManager;
