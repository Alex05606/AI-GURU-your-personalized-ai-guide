require("dotenv").config();

const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoute");

const app = express();
const PORT = 5000;

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* ---------------- ROUTES ---------------- */

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes); 
/* ---------------- TEST ROUTE ---------------- */

app.get("/", (req, res) => {
    res.send("🚀 AI Guru Backend is Running");
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});