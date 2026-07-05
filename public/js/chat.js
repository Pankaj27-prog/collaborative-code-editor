const CodabChat = {

    socket: null,
    roomId: null,
    username: null,
    messages: [],
    isOpen: false,
    unreadCount: 0,

    init(socket, roomId, username) {
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;

        this.overlay = document.getElementById("chat-overlay");
        this.messagesEl = document.getElementById("chat-messages");
        this.inputEl = document.getElementById("chat-input");
        this.badgeEl = document.getElementById("chat-badge");

        document.getElementById("openChat").addEventListener("click", () => this.open());
        document.getElementById("closeChat").addEventListener("click", () => this.close());
        document.getElementById("sendChat").addEventListener("click", () => this.sendMessage());

        this.inputEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        });

        this.inputEl.addEventListener("paste", (event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.isOpen) {
                this.close();
            }
        });

        this.socket.on("chat-history", (history) => {
            this.messages = history || [];
            this.renderMessages();
        });

        this.socket.on("chat-message", (message) => {
            this.messages.push(message);
            this.renderMessages();

            if (!this.isOpen) {
                this.unreadCount++;
                this.updateBadge();
            }
        });
    },

    open() {
        this.isOpen = true;
        this.unreadCount = 0;
        this.updateBadge();
        this.overlay.classList.remove("hidden");
        this.scrollToBottom();
    },

    close() {
        this.isOpen = false;
        this.overlay.classList.add("hidden");
    },

    getInputText() {
        return this.inputEl.innerText.replace(/\u00a0/g, " ").trim();
    },

    clearInput() {
        this.inputEl.innerHTML = "";
    },

    sendMessage() {
        const text = this.getInputText();
        if (!text) return;

        this.socket.emit("send-chat-message", {
            roomId: this.roomId,
            username: this.username,
            text
        });

        this.clearInput();
    },

    updateBadge() {
        if (!this.badgeEl) return;

        if (this.unreadCount > 0) {
            this.badgeEl.textContent = this.unreadCount > 9 ? "9+" : this.unreadCount;
            this.badgeEl.classList.remove("hidden");
        } else {
            this.badgeEl.classList.add("hidden");
        }
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    },

    getInitial(name) {
        return (name || "?").charAt(0).toUpperCase();
    },

    renderMessages() {
        this.messagesEl.innerHTML = this.messages.map((msg) => {
            const isOwn = msg.username === this.username;
            const time = this.formatTime(msg.timestamp);
            const safeText = this.escapeHtml(msg.text).replace(/\n/g, "<br>");

            if (isOwn) {
                return `
                    <div class="flex justify-end mb-3">
                        <div class="max-w-[75%]">
                            <div class="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md shadow">
                                <p class="text-sm break-words">${safeText}</p>
                            </div>
                            <div class="text-right text-xs text-gray-500 mt-1 px-1">${time}</div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="flex items-end gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        ${this.escapeHtml(this.getInitial(msg.username))}
                    </div>
                    <div class="max-w-[75%]">
                        <div class="text-xs text-blue-400 font-medium mb-1 px-1">${this.escapeHtml(msg.username)}</div>
                        <div class="bg-gray-700 text-gray-100 px-4 py-2 rounded-2xl rounded-bl-md shadow">
                            <p class="text-sm break-words">${safeText}</p>
                        </div>
                        <div class="text-xs text-gray-500 mt-1 px-1">${time}</div>
                    </div>
                </div>
            `;
        }).join("");

        this.scrollToBottom();
    },

    scrollToBottom() {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
};

window.CodabChat = CodabChat;
