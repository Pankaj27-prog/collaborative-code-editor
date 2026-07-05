const CodabEditor = {

    instance: null,

    init(containerId) {
        return new Promise((resolve) => {
            require.config({
                paths: {
                    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs"
                }
            });

            require(["vs/editor/editor.main"], () => {
                this.instance = monaco.editor.create(document.getElementById(containerId), {
                    value: "",
                    language: "cpp",
                    theme: "vs-dark",
                    automaticLayout: true,
                    fontSize: 16,
                    minimap: { enabled: true }
                });

                resolve(this.instance);
            });
        });
    },

    getValue() {
        return this.instance ? this.instance.getValue() : "";
    },

    setValue(code, preserveViewState = true) {
        if (!this.instance) return;

        const position = preserveViewState ? this.instance.getPosition() : null;
        const scrollTop = preserveViewState ? this.instance.getScrollTop() : 0;
        const scrollLeft = preserveViewState ? this.instance.getScrollLeft() : 0;

        this.instance.executeEdits("", [{
            range: this.instance.getModel().getFullModelRange(),
            text: code
        }]);

        if (preserveViewState && position) {
            this.instance.setPosition(position);
            this.instance.setScrollTop(scrollTop);
            this.instance.setScrollLeft(scrollLeft);
        }
    },

    onChange(callback) {
        if (!this.instance) return;
        this.instance.onDidChangeModelContent(callback);
    },

    setLanguage(fileName) {
        if (!this.instance || !window.CodabLanguages) return;

        const language = CodabLanguages.getMonacoLanguage(fileName);
        monaco.editor.setModelLanguage(this.instance.getModel(), language);
    }
};

window.CodabEditor = CodabEditor;
