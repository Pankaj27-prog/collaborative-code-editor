const { spawn, execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const languageSupport = require("./languageSupport");

const execFileAsync = promisify(execFile);
const RUN_TIMEOUT_MS = 300000;

async function prepareExecution(code, fileName) {
    const ext = languageSupport.getExtension(fileName);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codab-"));
    const sourcePath = path.join(tempDir, fileName);

    fs.writeFileSync(sourcePath, code, "utf8");

    switch (ext) {
        case ".cpp":
            return compileNative(sourcePath, tempDir, "g++");
        case ".c":
            return compileNative(sourcePath, tempDir, "gcc");
        case ".py":
            return { success: true, tempDir, command: "python", args: [sourcePath], cwd: tempDir };
        case ".js":
            return { success: true, tempDir, command: "node", args: [sourcePath], cwd: tempDir };
        case ".java":
            return compileJava(sourcePath, fileName, tempDir);
        default:
            fs.rmSync(tempDir, { recursive: true, force: true });
            return { success: false, stderr: `Unsupported file type. Use: ${languageSupport.getSupportedExtensionsLabel()}` };
    }
}

async function compileNative(sourcePath, tempDir, compiler) {
    const outputName = process.platform === "win32" ? "program.exe" : "program";
    const outputPath = path.join(tempDir, outputName);

    try {
        await execFileAsync(compiler, [sourcePath, "-o", outputPath], {
            timeout: 15000,
            maxBuffer: 1024 * 1024
        });
    } catch (error) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return {
            success: false,
            stderr: error.stderr || error.message || `${compiler} compilation failed.`
        };
    }

    return { success: true, tempDir, command: outputPath, args: [], cwd: tempDir };
}

async function compileJava(sourcePath, fileName, tempDir) {
    const className = languageSupport.getJavaClassName(fileName);
    const expectedFile = `${className}.java`;

    if (fileName !== expectedFile) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return {
            success: false,
            stderr: `Java file must be named ${expectedFile} to match public class ${className}.`
        };
    }

    try {
        await execFileAsync("javac", [sourcePath], {
            cwd: tempDir,
            timeout: 15000,
            maxBuffer: 1024 * 1024
        });
    } catch (error) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        return {
            success: false,
            stderr: error.stderr || error.message || "Java compilation failed."
        };
    }

    return { success: true, tempDir, command: "java", args: [className], cwd: tempDir };
}

function startInteractiveProgram(command, args, tempDir, callbacks) {
    const proc = spawn(command, args, {
        windowsHide: true,
        cwd: tempDir
    });

    let finished = false;
    let idleTimer = null;

    const cleanup = () => {
        if (finished) return;
        finished = true;
        clearTimeout(idleTimer);

        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
            // temp dir may already be removed
        }
    };

    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (!finished) {
                proc.kill();
                callbacks.onExit(-1, "Program timed out waiting for input.");
            }
        }, RUN_TIMEOUT_MS);
    };

    resetIdleTimer();

    proc.stdout.on("data", (chunk) => {
        resetIdleTimer();
        callbacks.onOutput("stdout", chunk.toString());
    });

    proc.stderr.on("data", (chunk) => {
        resetIdleTimer();
        callbacks.onOutput("stderr", chunk.toString());
    });

    proc.on("error", (error) => {
        cleanup();
        callbacks.onExit(-1, formatSpawnError(error, command));
    });

    proc.on("close", (code) => {
        cleanup();
        callbacks.onExit(code, "");
    });

    return {
        writeInput(text) {
            if (finished) return false;

            const input = text.endsWith("\n") ? text : text + "\n";
            proc.stdin.write(input);
            resetIdleTimer();
            return true;
        },

        kill() {
            if (!finished) {
                proc.kill();
            }
        }
    };
}

function formatSpawnError(error, command) {
    if (error.code === "ENOENT") {
        const hints = {
            python: "Python is not installed or not on PATH.",
            node: "Node.js is not installed or not on PATH.",
            java: "Java JDK is not installed or not on PATH.",
            javac: "Java JDK (javac) is not installed or not on PATH.",
            "g++": "g++ is not installed or not on PATH.",
            gcc: "gcc is not installed or not on PATH."
        };

        const base = path.basename(command).replace(/\.exe$/i, "");
        return hints[base] || `Failed to start: ${command}`;
    }

    return error.message || "Failed to start program.";
}

module.exports = {
    prepareExecution,
    startInteractiveProgram
};
