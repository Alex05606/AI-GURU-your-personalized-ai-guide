document.addEventListener("DOMContentLoaded", () => {

    const waveLeft = document.getElementById("wave-left");
    const waveRight = document.getElementById("wave-right");
    const bubble = document.getElementById("ai-bubble");
    const input = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-btn");
    const voiceBtn = document.getElementById("voice-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");

    if (!bubble || !input || !sendButton) {
        console.error("UI elements missing");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    /* ---------------- FILE UPLOAD ---------------- */

    if (uploadBtn && fileInput) {

        uploadBtn.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", () => {

            const file = fileInput.files[0];

            if (file) {
                bubble.textContent = "File uploaded: " + file.name;
                console.log("Uploaded file:", file);
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
                bubble.textContent = "Listening...";
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
            bubble.textContent = "Sorry, I couldn't hear you.";
        };

    } else {

        console.warn("Speech recognition not supported in this browser.");

    }

    /* ---------------- SEND MESSAGE ---------------- */

    async function sendMessage() {

        const message = input.value.trim();

        if (!message) return;

        console.log("User:", message);

        bubble.textContent = "AI Guru is thinking...";

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

            bubble.textContent = data.reply;

            /* ---------------- SPEECH SYNTHESIS ---------------- */

            const speech = new SpeechSynthesisUtterance(data.reply);

            speech.lang = "en-US";
            speech.rate = 1;
            speech.pitch = 1;

            /* START WAVE ANIMATION */

            speech.onstart = () => {

                if (waveLeft) waveLeft.classList.add("wave-active");
                if (waveRight) waveRight.classList.add("wave-active");

            };

            /* STOP WAVE ANIMATION */

            speech.onend = () => {

                if (waveLeft) waveLeft.classList.remove("wave-active");
                if (waveRight) waveRight.classList.remove("wave-active");

            };

            speechSynthesis.cancel();
            speechSynthesis.speak(speech);

        } catch (error) {

            console.error("Error:", error);
            bubble.textContent = "Something went wrong.";

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