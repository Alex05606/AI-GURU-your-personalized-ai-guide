const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://ai-guru-your-personalized-ai-guide.onrender.com";

let currentChatId = localStorage.getItem("chatId");
let uploadedFileContent = null;
const token = localStorage.getItem("token");

if (!currentChatId) {
    currentChatId = crypto.randomUUID();
    localStorage.setItem("chatId", currentChatId);
}

document.addEventListener("DOMContentLoaded", () => {

const waveLeft = document.getElementById("wave-left");
const waveRight = document.getElementById("wave-right");
const chatContainer = document.getElementById("chat-container");
const historyList = document.getElementById("history-list");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const uploadBtn = document.getElementById("upload-btn");
const fileInput = document.getElementById("file-input");

if (!token) {
  window.location.href = "/login";
  return;
}

if (!chatContainer || !input || !sendButton) {
  console.error("UI elements missing");
  return;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/* ---------------- FILE UPLOAD ---------------- */

if (uploadBtn && fileInput) {

    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const loadingMsg = document.createElement("div");
        loadingMsg.className = "text-left mb-2";
        loadingMsg.innerHTML = `
            <div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
                ⏳ Reading file...
            </div>
        `;
        chatContainer.appendChild(loadingMsg);

        if (file.type === "application/pdf") {
            const formData = new FormData();
            formData.append("pdf", file);

            try {
                const response = await fetch(`${API_BASE}/api/upload-pdf`, {
                    method: "POST",
                    body: formData
                });
                const data = await response.json();
                uploadedFileContent = data.text;

                loadingMsg.remove();
                const fileMsg = document.createElement("div");
                fileMsg.className = "text-left mb-2";
                fileMsg.innerHTML = `
                    <div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
                        ✅ PDF ready: <strong>${file.name}</strong>. You can now ask questions about it.
                    </div>
                `;
                chatContainer.appendChild(fileMsg);

            } catch (error) {
                console.error("PDF upload error:", error);
                loadingMsg.remove();
            }

        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedFileContent = e.target.result;
                loadingMsg.remove();
                const fileMsg = document.createElement("div");
                fileMsg.className = "text-left mb-2";
                fileMsg.innerHTML = `
                    <div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
                        ✅ File ready: <strong>${file.name}</strong>. You can now ask questions about it.
                    </div>
                `;
                chatContainer.appendChild(fileMsg);
            };
            reader.readAsText(file);
        }
    });
}

/* ---------------- SPEECH RECOGNITION ---------------- */

if (SpeechRecognition) {

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      const listenMsg = document.createElement("div");
      listenMsg.className = "text-center text-sm opacity-70 mb-2";
      listenMsg.textContent = "Listening...";
      chatContainer.appendChild(listenMsg);
      recognition.start();
    });
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("Voice Input:", transcript);
    input.value = transcript;
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

} else {
  console.warn("Speech recognition not supported in this browser.");
}

/* ---------------- LOAD CHAT SESSIONS ---------------- */

async function loadSessions() {
    try {
        const response = await fetch(`${API_BASE}/api/sessions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const sessions = await response.json();

        if (!Array.isArray(sessions)) {
            console.error("Sessions error:", sessions);
            return;
        }

        historyList.innerHTML = "";

        const newChatBtn = document.createElement("div");
        newChatBtn.className = "history-item flex justify-between items-center bg-indigo-600/40 cursor-pointer";
        newChatBtn.innerHTML = `<span>➕ New Chat</span>`;
        newChatBtn.addEventListener("click", startNewChat);
        historyList.appendChild(newChatBtn);

        sessions.forEach(session => {
            const item = document.createElement("div");
            item.className = "history-item flex justify-between items-center";
            item.innerHTML = `
                <span class="truncate flex-1 cursor-pointer" data-id="${session.chat_id}">
                    ${session.chat_title || "Chat"}
                </span>
                <button class="delete-btn text-red-400 hover:text-red-200 ml-2 text-xs" data-id="${session.chat_id}">
                    🗑️
                </button>
            `;

            item.querySelector("span").addEventListener("click", () => {
                loadChatHistory(session.chat_id);
            });

            item.querySelector(".delete-btn").addEventListener("click", async (e) => {
                e.stopPropagation();
                await deleteSession(session.chat_id);
            });

            historyList.appendChild(item);
        });

    } catch (error) {
        console.error("Failed to load sessions:", error);
    }
}

/* ---------------- LOAD A SPECIFIC CHAT ---------------- */

async function loadChatHistory(chatId) {
    try {
        currentChatId = chatId;
        localStorage.setItem("chatId", chatId);

        const response = await fetch(`${API_BASE}/api/history/${chatId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const messages = await response.json();

        if (!Array.isArray(messages)) {
            console.error("History error:", messages);
            return;
        }

        chatContainer.innerHTML = "";

        messages.forEach(msg => {
            const userDiv = document.createElement("div");
            userDiv.className = "text-right mb-3";
            userDiv.innerHTML = `
                <div class="inline-block bg-indigo-600 px-4 py-2 rounded-xl">
                    ${msg.user_message}
                </div>
            `;
            chatContainer.appendChild(userDiv);

            const aiDiv = document.createElement("div");
            aiDiv.className = "text-left mb-3";
            aiDiv.innerHTML = `
                <div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
                    ${msg.ai_reply}
                </div>
            `;
            chatContainer.appendChild(aiDiv);
        });

        chatContainer.scrollTop = chatContainer.scrollHeight;

    } catch (error) {
        console.error("Failed to load chat history:", error);
    }
}

/* ---------------- DELETE SESSION ---------------- */

async function deleteSession(chatId) {
    try {
        await fetch(`${API_BASE}/api/session/${chatId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (currentChatId === chatId) {
            startNewChat();
        }
        loadSessions();
    } catch (error) {
        console.error("Failed to delete session:", error);
    }
}

/* ---------------- NEW CHAT ---------------- */

function startNewChat() {
    currentChatId = crypto.randomUUID();
    localStorage.setItem("chatId", currentChatId);
    uploadedFileContent = null;
    chatContainer.innerHTML = `
        <p class="text-blue-50">Hi! I am your AI Guru. I am here to help you solve your problems.</p>
    `;
    loadSessions();
}

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage() {

  const message = input.value.trim();
  console.log("File content being sent:", uploadedFileContent ? "YES - " + uploadedFileContent.length + " chars" : "NULL");

  if (!message) return;

  console.log("User:", message);

  const userDiv = document.createElement("div");
  userDiv.className = "text-right mb-3";
  userDiv.innerHTML = `
    <div class="inline-block bg-indigo-600 px-4 py-2 rounded-xl">
      ${message}
    </div>
  `;
  chatContainer.appendChild(userDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "text-left mb-3";
  loadingDiv.innerHTML = `
    <div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
      AI Guru is thinking...
    </div>
  `;
  chatContainer.appendChild(loadingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message,
        chatId: currentChatId,
        fileContent: uploadedFileContent
      })
    });

    const data = await response.json();
    console.log("AI:", data.reply);

    loadingDiv.remove();

    const aiDiv = document.createElement("div");
    aiDiv.className = "text-left mb-3";
    aiDiv.innerHTML = `
      <div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
        ${data.reply}
      </div>
    `;
    chatContainer.appendChild(aiDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    loadSessions();

    const speech = new SpeechSynthesisUtterance(data.reply);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    speech.onstart = () => {
      if (waveLeft) waveLeft.classList.add("wave-active");
      if (waveRight) waveRight.classList.add("wave-active");
    };

    speech.onend = () => {
      if (waveLeft) waveLeft.classList.remove("wave-active");
      if (waveRight) waveRight.classList.remove("wave-active");
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);

  } catch (error) {
    console.error("Error:", error);
    const errorDiv = document.createElement("div");
    errorDiv.className = "text-left mb-3";
    errorDiv.innerHTML = `
      <div class="inline-block bg-red-500 px-4 py-2 rounded-xl">
        Something went wrong.
      </div>
    `;
    chatContainer.appendChild(errorDiv);
  }

  input.value = "";
}

/* ---------------- BUTTON EVENTS ---------------- */

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

loadSessions();
if (currentChatId) {
    loadChatHistory(currentChatId);
}

});