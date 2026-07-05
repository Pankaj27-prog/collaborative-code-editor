const CodabLanguages = {

    extensions: [".cpp", ".c", ".py", ".java", ".js"],

    labels: {
        ".cpp": "C++",
        ".c": "C",
        ".py": "Python",
        ".java": "Java",
        ".js": "JavaScript"
    },

    monaco: {
        ".cpp": "cpp",
        ".c": "c",
        ".py": "python",
        ".java": "java",
        ".js": "javascript"
    },

    getExtension(fileName) {
        const dot = fileName.lastIndexOf(".");
        return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
    },

    isValidFileName(fileName) {
        if (!fileName || fileName.includes("/") || fileName.includes("\\")) return false;
        return this.extensions.includes(this.getExtension(fileName));
    },

    getExtensionsLabel() {
        return this.extensions.join(", ");
    },

    getMonacoLanguage(fileName) {
        return this.monaco[this.getExtension(fileName)] || "plaintext";
    },

    getLanguageLabel(fileName) {
        return this.labels[this.getExtension(fileName)] || "Plain Text";
    }
};

window.CodabLanguages = CodabLanguages;
