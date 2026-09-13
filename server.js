const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URL = process.env.MONGODB_URI;
if (!MONGO_URL) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URL)
  .then(() => console.log("DB Connected:", mongoose.connection.name))
  .catch(err => { console.error("MongoDB error:", err.message); process.exit(1); });

const articleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  tag: { type: String, default: "" },
  heroImage: { type: String, default: "" },
  excerpt: { type: String, default: "" },
  body: { type: String, default: "" },
  author: { type: String, default: "Staff" },
  readTime: { type: Number, default: 5 },
  isHeadline: { type: Boolean, default: false },
  order: { type: Number, default: 99 },
  createdAt: { type: Date, default: Date.now }
});

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, default: "" },
  role: { type: String, required: true },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "" },
  order: { type: Number, default: 99 }
});

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: "" },
  order: { type: Number, default: 99 }
});

const scoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Article = mongoose.model("Article", articleSchema);
const Member = mongoose.model("Member", memberSchema);
const Question = mongoose.model("Question", questionSchema);
const Score = mongoose.model("Score", scoreSchema);

app.get("/api/articles", async (req, res) => {
  try {
    const list = await Article.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, articles: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/articles/:slug", async (req, res) => {
  try {
    const a = await Article.findOne({ slug: req.params.slug });
    if (!a) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, article: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/staff", async (req, res) => {
  try {
    const list = await Member.find().sort({ order: 1 });
    res.json({ success: true, staff: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/quiz", async (req, res) => {
  try {
    const list = await Question.find().sort({ order: 1 });
    res.json({ success: true, questions: list.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      explanation: q.explanation
    })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/quiz/check", async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: "answers must be an array" });
    const questions = await Question.find().sort({ order: 1 });
    let score = 0;
    const details = questions.map((q, i) => {
      const given = answers[i];
      const correct = given === q.correctIndex;
      if (correct) score++;
      return {
        question: q.question,
        given,
        correct,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      };
    });
    res.json({
      success: true,
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      details
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/quiz/score", async (req, res) => {
  try {
    const { name, section, score, total, duration } = req.body;
    if (!name || !section) return res.status(400).json({ error: "Name and section required" });
    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ error: "score and total must be numbers" });
    }
    const percentage = Math.round((score / total) * 100);
    const entry = await Score.create({
      name: name.trim().slice(0, 60),
      section: section.trim().slice(0, 60),
      score,
      total,
      percentage,
      duration: duration || 0
    });
    res.json({ success: true, entry });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/quiz/leaderboard", async (req, res) => {
  try {
    const list = await Score.find()
      .sort({ percentage: -1, duration: 1, createdAt: -1 })
      .limit(20);
    res.json({ success: true, leaderboard: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => console.log(`Running on port ${PORT}`));
