require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoute");

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5000",
    "https://ai-guru-your-personalized-ai-guide.onrender.com", // ✅ your Render URL
    "https://your-vercel-app.vercel.app" // update this after Vercel deploy
  ],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

/* ---------------- SERVE FRONTEND STATIC FILES ---------------- */

app.use(express.static(path.join(__dirname, "../client")));

/* ---------------- ROUTES ---------------- */

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);

/* ---------------- SERVE HTML PAGES ---------------- */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/landing.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/login.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/signup.html"));
});

app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/index.html"));
});

app.get("/privacy", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/privecy.html"));
});

app.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/terms.html"));
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});