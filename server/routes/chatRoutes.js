const express = require("express");
const router = express.Router();
const axios = require("axios");
const { createClient } = require("@libsql/client");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const upload = multer({ storage: multer.memoryStorage() });
const authMiddleware = require("../middleware/authMiddleware");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// ================= PDF UPLOAD =================

router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file received" });
        }
        console.log("PDF received, size:", req.file.size, "bytes");
        const data = await pdfParse(req.file.buffer);
        console.log("PDF parsed, text length:", data.text.length);
        res.json({ text: data.text });
    } catch (error) {
        console.error("PDF ERROR:", error.message);
        res.status(500).json({ error: "Failed to read PDF" });
    }
});

// ================= CHAT =================

router.post("/chat", authMiddleware, async (req, res) => {

    const userMessage = req.body.message;
    const chatId = req.body.chatId;
    const fileContent = req.body.fileContent || null;

    console.log("Chat ID:", chatId);
    console.log("User Message:", userMessage);

    const lowerMsg = userMessage.toLowerCase();

    if (
        lowerMsg.includes("who created you") ||
        lowerMsg.includes("who is your creator") ||
        lowerMsg.includes("who made you") ||
        lowerMsg.includes("your creator")
    ) {
        return res.json({
            reply: "I was created by Anirban Pal."
        });
    }

    try {

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: fileContent
                            ? `You are AI Guru, a helpful assistant.\n\nThe user has uploaded a file. Here is its content:\n\n"""\n${fileContent}\n"""\n\nAnswer the user's questions based on this file when relevant.`
                            : "You are AI Guru, a helpful assistant."
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
        const userId = req.user.id;

        try {
            await db.execute({
                sql: `
                    INSERT INTO chats (user_id, chat_id, chat_title, user_message, ai_reply)
                    VALUES (:userId, :chatId, :title, :msg, :reply)
                `,
                args: {
                    userId: req.user.id,
                    chatId: chatId,
                    title: userMessage.substring(0, 40),
                    msg: userMessage,
                    reply: aiReply
                }
            });

            console.log("Saved to DB");

        } catch (dbError) {
            console.error("DB ERROR:", dbError);
        }

        res.json({
            reply: aiReply
        });

    } catch (error) {

        console.error("FULL ERROR:", error);

        res.json({
            reply: "AI Guru is having trouble thinking right now."
        });

    }

});


// ================= HISTORY =================

router.get("/history/:chatId", authMiddleware, async (req, res) => {

    const chatId = req.params.chatId;

    try {

        const result = await db.execute({
            sql: `
                SELECT * FROM chats
                WHERE chat_id = :chatId
                ORDER BY id ASC
            `,
            args: { chatId }
        });

        res.json(result.rows);

    } catch (error) {

        console.error(error);
        res.status(500).json({ error: "Failed to fetch history" });

    }

});

// ================= GET ALL CHAT SESSIONS ================= ✅ FIXED: one route, with user_id filter

router.get("/sessions", authMiddleware, async (req, res) => {
    try {
        const result = await db.execute({
            sql: `
                SELECT chat_id, chat_title, MIN(created_at) as started_at
                FROM chats
                WHERE user_id = :userId
                GROUP BY chat_id
                ORDER BY started_at DESC
            `,
            args: { userId: req.user.id } // ✅ ADDED user_id filter
        });
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// ================= DELETE A CHAT SESSION ================= ✅ FIXED: one route only

router.delete("/session/:chatId", authMiddleware, async (req, res) => {
    const chatId = req.params.chatId;
    try {
        await db.execute({
            sql: `DELETE FROM chats WHERE chat_id = :chatId`,
            args: { chatId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete session" });
    }
});

module.exports = router;