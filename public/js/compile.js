const CodabCompile = {

    socket: null,
    roomId: null,
    isRunning: false,
    waitingForInput: false,

    init(socket, roomId) {
        this.socket = socket;
        this.roomId = roomId;

        document.getElementById("runCode").addEventListener("click", () => {
            this.handleRun();
        });

        CodabOutputPanel.input.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && this.isRunning && this.waitingForInput) {
                event.preventDefault();
                this.submitInput();
            }
        });

        this.socket.on("program-started", () => {
            this.isRunning = true;
            this.waitingForInput = false;
            this.updateRunButton();
            CodabOutputPanel.clearLog();
            CodabOutputPanel.appendLog("Compiling and running...\n");
            CodabOutputPanel.setInputEnabled(false);
        });

        this.socket.on("program-output", ({ text }) => {
            CodabOutputPanel.appendLog(text);
        });

        this.socket.on("program-waiting-input", () => {
            if (!this.isRunning) return;

            this.waitingForInput = true;
            this.updateRunButton();
            CodabOutputPanel.setInputEnabled(true);
            CodabOutputPanel.appendLog("\n[Waiting for input — type below and click Run]\n");
        });

        this.socket.on("program-exit", ({ success, message }) => {
            this.isRunning = false;
            this.waitingForInput = false;
            this.updateRunButton();
            CodabOutputPanel.setInputEnabled(false);

            if (message) {
                CodabOutputPanel.appendLog(`\n${message}\n`, !success);
            }
        });
    },

    updateRunButton() {
        const runBtn = document.getElementById("runCode");

        if (!this.isRunning) {
            runBtn.textContent = "Run";
            runBtn.disabled = false;
            return;
        }

        runBtn.textContent = this.waitingForInput ? "Run" : "Running...";
        runBtn.disabled = !this.waitingForInput;
    },

    handleRun() {
        if (this.isRunning && this.waitingForInput) {
            this.submitInput();
            return;
        }

        if (this.isRunning) return;

        this.startProgram();
    },

    startProgram() {
        const fileName = window.CodabFileManager.getActiveFile();
        if (!fileName) {
            alert("No file is open.");
            return;
        }

        window.CodabCodeSync.flushCurrentFile();

        CodabOutputPanel.show();
        CodabOutputPanel.clearInput();

        this.socket.emit("run-code", {
            roomId: this.roomId,
            fileName,
            code: CodabEditor.getValue()
        });
    },

    submitInput() {
        const input = CodabOutputPanel.getInputValue();

        if (!input.trim()) return;
        if (!this.isRunning || !this.waitingForInput) return;

        CodabOutputPanel.appendLog(`${input}\n`);
        CodabOutputPanel.clearInput();

        this.waitingForInput = false;
        this.updateRunButton();
        CodabOutputPanel.setInputEnabled(false);

        this.socket.emit("program-input", { input });
    }
};

window.CodabCompile = CodabCompile;
