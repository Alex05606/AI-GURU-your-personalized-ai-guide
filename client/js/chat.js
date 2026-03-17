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

if (!chatContainer || !input || !sendButton) {
console.error("UI elements missing");
return;
}

const SpeechRecognition =
window.SpeechRecognition || window.webkitSpeechRecognition;

/* ---------------- FILE UPLOAD ---------------- */

if (uploadBtn && fileInput) {

uploadBtn.addEventListener("click", () => {
fileInput.click();
});

fileInput.addEventListener("change", () => {

const file = fileInput.files[0];

if (file) {

const fileMsg = document.createElement("div");

fileMsg.className = "text-left mb-2";

fileMsg.innerHTML = `
<div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
File uploaded: ${file.name}
</div>
`;

chatContainer.appendChild(fileMsg);

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

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage() {

const message = input.value.trim();

if (!message) return;

console.log("User:", message);

/* USER MESSAGE */

const userDiv = document.createElement("div");

userDiv.className = "text-right mb-3";

userDiv.innerHTML = `
<div class="inline-block bg-indigo-600 px-4 py-2 rounded-xl">
${message}
</div>
`;

chatContainer.appendChild(userDiv);

chatContainer.scrollTop = chatContainer.scrollHeight;

/* ADD TO SIDEBAR HISTORY */

if (historyList) {

const historyItem = document.createElement("div");

historyItem.className = "history-item";

historyItem.textContent = message.substring(0, 40);

historyList.prepend(historyItem);

}

/* LOADING MESSAGE */

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

const response = await fetch("http://localhost:5000/api/chat", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({
message: message
})

});

const data = await response.json();

console.log("AI:", data.reply);

/* REMOVE LOADING */

loadingDiv.remove();

/* AI MESSAGE */

const aiDiv = document.createElement("div");

aiDiv.className = "text-left mb-3";

aiDiv.innerHTML = `
<div class="inline-block bg-white/20 px-4 py-2 rounded-xl">
${data.reply}
</div>
`;

chatContainer.appendChild(aiDiv);

chatContainer.scrollTop = chatContainer.scrollHeight;

/* ---------------- SPEECH SYNTHESIS ---------------- */

const speech = new SpeechSynthesisUtterance(data.reply);

speech.lang = "en-US";
speech.rate = 1;
speech.pitch = 1;

/* START WAVES */

speech.onstart = () => {

if (waveLeft) waveLeft.classList.add("wave-active");
if (waveRight) waveRight.classList.add("wave-active");

};

/* STOP WAVES */

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

});