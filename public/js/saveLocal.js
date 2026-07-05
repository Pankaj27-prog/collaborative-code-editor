const CodabSaveLocal = {

    init() {
        document.getElementById("saveFile").addEventListener("click", () => {
            this.saveActiveFile();
        });
    },

    // Part 3.7: Save files locally
    saveActiveFile() {
        const fileName = window.CodabFileManager.getActiveFile();
        if (!fileName) {
            alert("No file is open.");
            return;
        }

        const code = CodabEditor.getValue();
        this.downloadFile(fileName, code);
    },

    downloadFile(fileName, content) {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }
};

window.CodabSaveLocal = CodabSaveLocal;
