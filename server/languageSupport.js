const path = require("path");

const EXTENSIONS = [".cpp", ".c", ".py", ".java", ".js"];

const MONACO_LANGUAGES = {
    ".cpp": "cpp",
    ".c": "c",
    ".py": "python",
    ".java": "java",
    ".js": "javascript"
};

function getExtension(fileName) {
    return path.extname(fileName).toLowerCase();
}

function isValidFileName(fileName) {
    if (typeof fileName !== "string" || fileName.trim() === "") return false;
    if (fileName.includes("/") || fileName.includes("\\")) return false;

    const ext = getExtension(fileName);
    return EXTENSIONS.includes(ext);
}

function getDefaultContent(fileName) {
    const ext = getExtension(fileName);
    const baseName = path.basename(fileName, ext);
    const javaClass = toJavaClassName(baseName);

    const templates = {
        ".cpp": `#include <iostream>

using namespace std;

int main()
{
    cout << "Hello World";
    return 0;
}`,
        ".c": `#include <stdio.h>

int main()
{
    printf("Hello World");
    return 0;
}`,
        ".py": `print("Hello World")`,
        ".java": `public class ${javaClass}
{
    public static void main(String[] args)
    {
        System.out.println("Hello World");
    }
}`,
        ".js": `console.log("Hello World");`
    };

    return templates[ext] || "";
}

function toJavaClassName(fileBase) {
    const cleaned = fileBase.replace(/[^a-zA-Z0-9_]/g, "_");

    if (/^[0-9]/.test(cleaned)) {
        return `Main_${cleaned}`;
    }

    if (!cleaned) return "Main";

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getJavaClassName(fileName) {
    return toJavaClassName(path.basename(fileName, ".java"));
}

function needsInput(code, fileName) {
    const ext = getExtension(fileName);

    switch (ext) {
        case ".py":
            return /\binput\s*\(/.test(code);
        case ".java":
            return /Scanner|BufferedReader|System\.in/.test(code);
        case ".js":
            return /readline|process\.stdin|prompt\s*\(/.test(code);
        case ".c":
        case ".cpp":
            return /\bcin\b|\bscanf\s*\(|\bgets\s*\(|\bgetline\s*\(|\bgetchar\s*\(/.test(code);
        default:
            return false;
    }
}

function getSupportedExtensionsLabel() {
    return EXTENSIONS.join(", ");
}

module.exports = {
    EXTENSIONS,
    MONACO_LANGUAGES,
    getExtension,
    isValidFileName,
    getDefaultContent,
    getJavaClassName,
    needsInput,
    getSupportedExtensionsLabel
};
