const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/chat", async (req, res) => {

    const userMessage = req.body.message;
    const lowerMsg = userMessage.toLowerCase();

if (
    lowerMsg.includes("who created you") ||
    lowerMsg.includes("who is your creator") ||
    lowerMsg.includes("who made you") ||
    lowerMsg.includes("your creator")
) {
    return res.json({
        reply: "I was created by Anirban Pal, a B.Tech Computer Science student specializing in Artificial Intelligence."
    });
}

    console.log("User Message:", userMessage);

    try {

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
  role: "system",
  content: `
You are AI Guru, a virtual AI assistant built by Anirban Pal, a B.Tech Computer Science student specializing in Artificial Intelligence.

IMPORTANT RULES:
- If someone asks "Who created you?", "Who is your creator?", or similar questions, always answer: "I was created by Anirban Pal."
- Never say you were created by Meta, OpenAI, or any other company.
- You must identify yourself as AI Guru created by Anirban Pal.
- Your purpose is to help users solve problems and answer questions.

Respond in a friendly and helpful way.
`
},
                    {
                        role: "user",
                        content: userMessage
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiReply = response.data.choices[0].message.content;

        console.log("AI Reply:", aiReply);

        res.json({
            reply: aiReply
        });

    } catch (error) {

        console.error("Groq Error:", error.response?.data || error.message);

        res.json({
            reply: "AI Guru is having trouble thinking right now."
        });

    }

});

module.exports = router;