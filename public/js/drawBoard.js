const CodabDrawBoard = {

    socket: null,
    roomId: null,
    username: null,
    canvas: null,
    ctx: null,
    isOpen: false,
    isDrawing: false,
    strokes: [],
    activeStrokes: {},
    currentStroke: null,
    tool: "pen",
    color: "#ffffff",
    size: 4,
    lastEmit: 0,

    init(socket, roomId, username) {
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;

        this.overlay = document.getElementById("draw-overlay");
        this.canvas = document.getElementById("draw-canvas");
        this.ctx = this.canvas.getContext("2d");

        document.getElementById("openDraw").addEventListener("click", () => this.open());
        document.getElementById("closeDraw").addEventListener("click", () => this.close());
        document.getElementById("clearDraw").addEventListener("click", () => this.clearBoard());

        document.querySelectorAll("[data-draw-tool]").forEach((btn) => {
            btn.addEventListener("click", () => this.setTool(btn.dataset.drawTool));
        });

        document.querySelectorAll("[data-draw-color]").forEach((btn) => {
            btn.addEventListener("click", () => this.setColor(btn.dataset.drawColor, btn));
        });

        document.getElementById("brushSize").addEventListener("input", (event) => {
            this.size = Number(event.target.value);
            document.getElementById("brushSizeLabel").textContent = `${this.size}px`;
        });

        this.canvas.addEventListener("mousedown", (e) => this.startDraw(e));
        this.canvas.addEventListener("mousemove", (e) => this.moveDraw(e));
        this.canvas.addEventListener("mouseup", () => this.endDraw());
        this.canvas.addEventListener("mouseleave", () => this.endDraw());

        this.canvas.addEventListener("touchstart", (e) => this.startDraw(e), { passive: false });
        this.canvas.addEventListener("touchmove", (e) => this.moveDraw(e), { passive: false });
        this.canvas.addEventListener("touchend", () => this.endDraw());

        window.addEventListener("resize", () => {
            if (this.isOpen) this.resizeCanvas();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.isOpen) this.close();
        });

        this.socket.on("draw-history", (history) => {
            this.strokes = history || [];
            if (this.isOpen) this.redraw();
        });

        this.socket.on("draw-start", (stroke) => {
            this.activeStrokes[stroke.id] = {
                id: stroke.id,
                username: stroke.username,
                color: stroke.color,
                size: stroke.size,
                tool: stroke.tool,
                points: [{ x: stroke.x, y: stroke.y }]
            };

            if (this.isOpen) this.redraw();
        });

        this.socket.on("draw-point", ({ strokeId, x, y }) => {
            const stroke = this.activeStrokes[strokeId];
            if (!stroke) return;

            stroke.points.push({ x, y });
            if (this.isOpen) this.drawSegment(stroke, stroke.points.length - 2, stroke.points.length - 1);
        });

        this.socket.on("draw-end", (stroke) => {
            delete this.activeStrokes[stroke.id];

            if (!this.strokes.find((s) => s.id === stroke.id)) {
                this.strokes.push(stroke);
            }

            if (this.isOpen) this.redraw();
        });

        this.socket.on("draw-clear", () => {
            this.strokes = [];
            this.activeStrokes = {};
            if (this.isOpen) this.redraw();
        });
    },

    open() {
        this.isOpen = true;
        this.overlay.classList.remove("hidden");
        this.resizeCanvas();
        this.redraw();
        this.updateToolUI();
    },

    close() {
        this.isOpen = false;
        this.endDraw();
        this.overlay.classList.add("hidden");
    },

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.redraw();
    },

    getPos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    },

    createStrokeId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    },

    setTool(tool) {
        this.tool = tool;
        this.updateToolUI();
    },

    setColor(color, btn) {
        this.color = color;
        this.tool = "pen";
        this.updateToolUI();

        document.querySelectorAll("[data-draw-color]").forEach((el) => {
            el.classList.remove("ring-2", "ring-white");
        });

        if (btn) btn.classList.add("ring-2", "ring-white");
    },

    updateToolUI() {
        document.querySelectorAll("[data-draw-tool]").forEach((btn) => {
            const active = btn.dataset.drawTool === this.tool;
            btn.classList.toggle("bg-gray-600", active);
            btn.classList.toggle("text-white", active);
        });
    },

    startDraw(event) {
        if (!this.isOpen) return;

        event.preventDefault();
        this.isDrawing = true;

        const pos = this.getPos(event);
        const stroke = {
            id: this.createStrokeId(),
            username: this.username,
            color: this.color,
            size: this.size,
            tool: this.tool,
            points: [pos]
        };

        this.currentStroke = stroke;
        this.activeStrokes[stroke.id] = stroke;

        this.socket.emit("draw-start", {
            roomId: this.roomId,
            stroke: {
                id: stroke.id,
                username: stroke.username,
                color: stroke.color,
                size: stroke.size,
                tool: stroke.tool,
                x: pos.x,
                y: pos.y
            }
        });
        this.redraw();
    },

    moveDraw(event) {
        if (!this.isDrawing || !this.currentStroke) return;

        event.preventDefault();
        const pos = this.getPos(event);
        const points = this.currentStroke.points;
        const prev = points.length - 1;

        points.push(pos);
        this.drawSegment(this.currentStroke, prev, prev + 1);

        const now = Date.now();
        if (now - this.lastEmit > 30) {
            this.lastEmit = now;
            this.socket.emit("draw-point", {
                roomId: this.roomId,
                strokeId: this.currentStroke.id,
                x: pos.x,
                y: pos.y
            });
        }
    },

    endDraw() {
        if (!this.isDrawing || !this.currentStroke) return;

        this.isDrawing = false;

        if (this.currentStroke.points.length > 0) {
            this.strokes.push(this.currentStroke);
            this.socket.emit("draw-end", {
                roomId: this.roomId,
                stroke: this.currentStroke
            });
        }

        delete this.activeStrokes[this.currentStroke.id];
        this.currentStroke = null;
    },

    clearBoard() {
        if (!confirm("Clear the whiteboard for everyone in this room?")) return;

        this.strokes = [];
        this.activeStrokes = {};
        this.redraw();
        this.socket.emit("draw-clear", { roomId: this.roomId });
    },

    toCanvas(pos) {
        return {
            x: pos.x * this.canvas.width,
            y: pos.y * this.canvas.height
        };
    },

    applyStrokeStyle(stroke) {
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = stroke.size;

        if (stroke.tool === "eraser") {
            this.ctx.globalCompositeOperation = "destination-out";
            this.ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.strokeStyle = stroke.color;
        }
    },

    drawSegment(stroke, fromIndex, toIndex) {
        const from = stroke.points[fromIndex];
        const to = stroke.points[toIndex];
        if (!from || !to) return;

        const a = this.toCanvas(from);
        const b = this.toCanvas(to);

        this.applyStrokeStyle(stroke);
        this.ctx.beginPath();
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
        this.ctx.globalCompositeOperation = "source-over";
    },

    drawStroke(stroke) {
        if (!stroke.points || stroke.points.length === 0) return;

        if (stroke.points.length === 1) {
            const p = this.toCanvas(stroke.points[0]);
            this.applyStrokeStyle(stroke);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = "source-over";
            return;
        }

        for (let i = 1; i < stroke.points.length; i++) {
            this.drawSegment(stroke, i - 1, i);
        }
    },

    redraw() {
        this.ctx.fillStyle = "#1f2937";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const stroke of this.strokes) {
            this.drawStroke(stroke);
        }

        for (const stroke of Object.values(this.activeStrokes)) {
            this.drawStroke(stroke);
        }
    }
};

window.CodabDrawBoard = CodabDrawBoard;
