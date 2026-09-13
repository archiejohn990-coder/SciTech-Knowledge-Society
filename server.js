const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "scitect2026";

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
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
  references: { type: String, default: "" },
  author: { type: String, default: "Staff" },
  readTime: { type: Number, default: 5 },
  isHeadline: { type: Boolean, default: false },
  status: { type: String, default: "published" },
  order: { type: Number, default: 99 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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
  badge: { type: String, default: "Learner" },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  articleSlug: { type: String, required: true },
  name: { type: String, default: "Anonymous" },
  text: { type: String, required: true },
  approved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Article = mongoose.model("Article", articleSchema);
const Member = mongoose.model("Member", memberSchema);
const Question = mongoose.model("Question", questionSchema);
const Score = mongoose.model("Score", scoreSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Newsletter = mongoose.model("Newsletter", newsletterSchema);
const Contact = mongoose.model("Contact", contactSchema);

function requireAdmin(req, res, next) {
  const pass = req.headers["x-admin-password"] || req.body.adminPassword;
  if (pass !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid admin password" });
  next();
}

function slugify(str) {
  return String(str || "").toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function badgeFor(pct) {
  if (pct === 100) return "Expert";
  if (pct >= 75) return "Scholar";
  if (pct >= 50) return "Learner";
  return "Explorer";
}

// Articles
app.get("/api/articles", async (req, res) => {
  try {
    const filter = { status: "published" };
    if (req.query.tag) filter.tag = req.query.tag;
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { excerpt: rx }, { body: rx }, { tag: rx }];
    }
    const list = await Article.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, articles: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/articles/:slug", async (req, res) => {
  try {
    const a = await Article.findOne({ slug: req.params.slug });
    if (!a) return res.status(404).json({ error: "Not found" });
    a.views = (a.views || 0) + 1;
    await a.save();
    const related = await Article.find({
      slug: { $ne: a.slug },
      status: "published",
      $or: [{ tag: a.tag }, { isHeadline: a.isHeadline }]
    }).limit(3);
    res.json({ success: true, article: a, related });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/admin/articles", requireAdmin, async (req, res) => {
  try {
    const list = await Article.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, articles: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/articles", requireAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.title) data.slug = slugify(data.title);
    if (!data.slug) return res.status(400).json({ error: "Title or slug required" });
    if (!data.author) data.author = "Staff";
    if (!data.readTime) data.readTime = 5;
    if (!data.status) data.status = "published";
    data.updatedAt = new Date();

    const existing = await Article.findOne({ slug: data.slug });
    if (existing) return res.status(400).json({ error: "Slug already exists" });

    if (data.isHeadline) {
      await Article.updateMany({}, { isHeadline: false });
    }

    const article = await Article.create(data);
    res.json({ success: true, article });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/admin/articles/:id", requireAdmin, async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.title) data.slug = slugify(data.title);
    data.updatedAt = new Date();

    if (data.isHeadline) {
      await Article.updateMany({ _id: { $ne: req.params.id } }, { isHeadline: false });
    }

    const article = await Article.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!article) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, article });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/articles/:id", requireAdmin, async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Staff
app.get("/api/staff", async (req, res) => {
  try {
    const list = await Member.find().sort({ order: 1 });
    res.json({ success: true, staff: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/staff", requireAdmin, async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.json({ success: true, member });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/admin/staff/:id", requireAdmin, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, member });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/staff/:id", requireAdmin, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Search (unified)
app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ success: true, results: { articles: [], staff: [], questions: [] } });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [articles, staff, questions] = await Promise.all([
      Article.find({ status: "published", $or: [{ title: rx }, { excerpt: rx }, { tag: rx }] }).limit(8),
      Member.find({ $or: [{ name: rx }, { role: rx }, { section: rx }] }).limit(8),
      Question.find({ question: rx }).limit(8)
    ]);
    res.json({ success: true, results: { articles, staff, questions } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Quiz
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
    const percentage = Math.round((score / questions.length) * 100);
    res.json({
      success: true,
      score,
      total: questions.length,
      percentage,
      badge: badgeFor(percentage),
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
      duration: duration || 0,
      badge: badgeFor(percentage)
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

// Comments
app.get("/api/comments/:slug", async (req, res) => {
  try {
    const list = await Comment.find({ articleSlug: req.params.slug, approved: true })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, comments: list });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/comments/:slug", async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "Comment text required" });
    const c = await Comment.create({
      articleSlug: req.params.slug,
      name: (name || "Anonymous").trim().slice(0, 60),
      text: text.trim().slice(0, 1000),
      approved: true
    });
    res.json({ success: true, comment: c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/admin/comments/:id", requireAdmin, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Newsletter
app.post("/api/newsletter", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email required" });
    const existing = await Newsletter.findOne({ email });
    if (existing) return res.json({ success: true, message: "Already subscribed" });
    await Newsletter.create({ email });
    res.json({ success: true, message: "Subscribed" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Contact
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "All fields required" });
    if (!email.includes("@")) return res.status(400).json({ error: "Valid email required" });
    await Contact.create({
      name: name.trim().slice(0, 80),
      email: email.trim().slice(0, 120),
      message: message.trim().slice(0, 2000)
    });
    res.json({ success: true, message: "Message received" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const pass = req.body.password;
  if (pass === ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ error: "Wrong password" });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => console.log(`Running on port ${PORT}`));
