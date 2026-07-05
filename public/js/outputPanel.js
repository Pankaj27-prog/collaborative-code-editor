const CodabOutputPanel = {

    panel: null,
    handle: null,
    log: null,
    input: null,
    isDragging: false,
    startY: 0,
    startHeight: 0,
    minHeight: 160,
    maxHeight: 700,
    defaultHeight: 260,

    init() {
        this.panel = document.getElementById("output-panel");
        this.handle = document.getElementById("output-resize-handle");
        this.log = document.getElementById("output-log");
        this.input = document.getElementById("output-input");

        this.panel.style.height = `${this.defaultHeight}px`;
        this.bindResize();
    },

    bindResize() {
        this.handle.addEventListener("mousedown", (event) => {
            event.preventDefault();
            this.isDragging = true;
            this.startY = event.clientY;
            this.startHeight = this.panel.offsetHeight;
            document.body.style.cursor = "ns-resize";
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (event) => {
            if (!this.isDragging) return;

            const delta = this.startY - event.clientY;
            const nextHeight = Math.min(
                this.maxHeight,
                Math.max(this.minHeight, this.startHeight + delta)
            );

            this.panel.style.height = `${nextHeight}px`;
            this.refreshEditorLayout();
        });

        document.addEventListener("mouseup", () => {
            if (!this.isDragging) return;

            this.isDragging = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            this.refreshEditorLayout();
        });
    },

    refreshEditorLayout() {
        if (window.CodabEditor && CodabEditor.instance) {
            CodabEditor.instance.layout();
        }
    },

    show() {
        this.panel.classList.remove("hidden");
        this.refreshEditorLayout();
    },

    clearLog() {
        this.log.textContent = "";
        this.log.className = "flex-1 p-4 text-green-300 font-mono text-sm whitespace-pre-wrap overflow-auto min-h-0";
    },

    appendLog(text, isError = false) {
        this.log.textContent += text;

        if (isError) {
            this.log.className = "flex-1 p-4 text-red-300 font-mono text-sm whitespace-pre-wrap overflow-auto min-h-0";
        }

        this.log.scrollTop = this.log.scrollHeight;
    },

    setInputEnabled(enabled) {
        this.input.disabled = !enabled;
        this.input.placeholder = enabled
            ? "Type input here, then click Run"
            : "Click Run to start the program";

        if (enabled) {
            this.input.focus();
        }
    },

    getInputValue() {
        return this.input.value;
    },

    clearInput() {
        this.input.value = "";
    }
};

window.CodabOutputPanel = CodabOutputPanel;
