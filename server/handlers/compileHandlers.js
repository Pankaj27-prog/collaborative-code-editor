const { prepareExecution, startInteractiveProgram } = require("../runCode");
const roomStore = require("../roomStore");
const languageSupport = require("../languageSupport");

function formatExitMessage(code) {
    if (code === 0) return "Program finished.";

    const crashCodes = {
        3221225477: "Program crashed (memory access error). Check array/vector bounds and pointers.",
        3221226356: "Program was terminated.",
        3221225786: "Program failed to start."
    };

    return crashCodes[code] || `Program exited with code ${code}.`;
}

function registerCompileHandlers(io, socket, rooms) {
    const runningPrograms = new Map();

    function stopProgram() {
        const session = runningPrograms.get(socket.id);
        if (!session) return;

        session.runner.kill();
        runningPrograms.delete(socket.id);
    }

    async function handleRun({ roomId, fileName, code }) {
        const room = roomStore.getRoom(rooms, roomId);
        if (!room) return;

        stopProgram();

        const source = code ?? roomStore.getFileContent(room, fileName);
        if (source === null) {
            socket.emit("program-exit", {
                success: false,
                message: "File not found."
            });
            return;
        }

        if (!languageSupport.isValidFileName(fileName)) {
            socket.emit("program-exit", {
                success: false,
                message: `Unsupported file type. Supported: ${languageSupport.getSupportedExtensionsLabel()}`
            });
            return;
        }

        socket.emit("program-started");

        try {
            const prepared = await prepareExecution(source, fileName);

            if (!prepared.success) {
                socket.emit("program-exit", {
                    success: false,
                    message: prepared.stderr
                });
                return;
            }

            const needsInput = languageSupport.needsInput(source, fileName);

            const runner = startInteractiveProgram(
                prepared.command,
                prepared.args,
                prepared.tempDir,
                {
                    onOutput(type, text) {
                        socket.emit("program-output", { type, text });
                    },
                    onExit(code, message) {
                        runningPrograms.delete(socket.id);

                        if (message) {
                            socket.emit("program-output", { type: "stderr", text: message });
                        }

                        socket.emit("program-exit", {
                            success: code === 0,
                            message: formatExitMessage(code)
                        });
                    }
                }
            );

            runningPrograms.set(socket.id, { runner, needsInput });

            if (needsInput) {
                socket.emit("program-waiting-input");
            }
        } catch (error) {
            runningPrograms.delete(socket.id);
            socket.emit("program-exit", {
                success: false,
                message: error.message || "Execution failed."
            });
        }
    }

    socket.on("run-code", handleRun);
    socket.on("compile-cpp", handleRun);

    socket.on("program-input", ({ input }) => {
        const session = runningPrograms.get(socket.id);
        if (!session) {
            socket.emit("program-exit", {
                success: false,
                message: "No program is running. Click Run first."
            });
            return;
        }

        if (!input || input.trim() === "") return;

        session.runner.writeInput(input);

        if (session.needsInput) {
            setTimeout(() => {
                if (runningPrograms.has(socket.id)) {
                    socket.emit("program-waiting-input");
                }
            }, 200);
        }
    });

    socket.on("program-stop", () => {
        stopProgram();
        socket.emit("program-exit", {
            success: false,
            message: "Program stopped."
        });
    });

    socket.on("disconnect", () => {
        stopProgram();
    });
}

module.exports = { registerCompileHandlers };
