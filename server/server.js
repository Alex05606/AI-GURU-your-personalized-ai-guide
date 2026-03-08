require("dotenv").config();
const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chatRoutes");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
    res.send("AI Guru Backend is Running 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});