const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URL = process.env.MONGODB_URI;
if (!MONGO_URL) { console.error("MONGODB_URI missing"); process.exit(1); }

const articleSchema = new mongoose.Schema({
  slug: String, title: String, tag: String, heroImage: String,
  excerpt: String, body: String, references: String, author: String,
  readTime: Number, isHeadline: Boolean, status: String, order: Number, views: Number
});
const memberSchema = new mongoose.Schema({
  name: String, section: String, role: String, bio: String, avatar: String, order: Number
});
const questionSchema = new mongoose.Schema({
  type: String, question: String, options: [String],
  correctIndex: Number, explanation: String, order: Number
});

const Article = mongoose.model("Article", articleSchema);
const Member = mongoose.model("Member", memberSchema);
const Question = mongoose.model("Question", questionSchema);

const articles = [
  {
    slug: "golden-rice-gmo-debate",
    title: "Golden Rice and the GMO Debate: Feeding or Frightening the Philippines?",
    tag: "Headline",
    heroImage: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600",
    excerpt: "As the Philippines becomes the first country to approve commercial Golden Rice, the debate over GMOs deepens — touching ethics, health, farmers' rights, and the future of food.",
    author: "Member 1",
    readTime: 12,
    isHeadline: true,
    status: "published",
    order: 1,
    views: 0,
    references: "IRRI. (2021). Golden Rice. International Rice Research Institute. · WHO. (2023). Vitamin A Deficiency. World Health Organization.",
    body: `<p class="lead">In 2021, the Philippines became the first country in the world to approve commercial cultivation of Golden Rice — a genetically modified grain engineered to produce beta-carotene, the precursor of Vitamin A.</p><h2>What is Golden Rice?</h2><p>Golden Rice is a variety of rice genetically engineered to biosynthesize beta-carotene in the edible part of the grain.</p><h2>The Case For Golden Rice</h2><p>Supporters argue Golden Rice is one of the most promising public health tools of the century.</p><h2>The Case Against</h2><p>Critics raise several objections. First, they argue that the real cause of malnutrition is poverty and lack of dietary diversity.</p><h2>The Ethics</h2><p>At its core, the GMO debate is not just about science. It's about ethics.</p><p class="article-end">— END —</p>`
  },
  {
    slug: "invisible-frontier-nanotechnology",
    title: "The Invisible Frontier: Ethical Issues in Nanotechnology",
    tag: "Nanotechnology",
    heroImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600",
    excerpt: "Nanotech promises cleaner water, smarter medicine, and better materials. But who watches the tiny things we cannot see?",
    author: "Member 5",
    readTime: 9,
    status: "published",
    order: 2,
    views: 0,
    references: "European Commission. (2022). Nanotechnology Ethics. · National Nanotechnology Initiative. (2023).",
    body: `<p class="lead">Nanotechnology deals with matter at the scale of a billionth of a meter — smaller than a virus, smaller than a strand of DNA.</p><h2>What is Nanotechnology?</h2><p>Nanotechnology is the manipulation of matter at the nanoscale — roughly 1 to 100 nanometers.</p><h2>The Promise</h2><p>Researchers are using nanotechnology to develop targeted cancer treatments, clean water filters, and more efficient solar cells.</p><h2>The Ethical Concerns</h2><p>But nanotechnology also raises serious questions.</p><p class="article-end">— END —</p>`
  },
  {
    slug: "silent-extinction-philippine-biodiversity",
    title: "The Silent Extinction: Threats to Philippine Biodiversity",
    tag: "Biodiversity",
    heroImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600",
    excerpt: "The Philippines is one of the world's biodiversity hotspots — and one of its most threatened.",
    author: "Member 3",
    readTime: 10,
    status: "published",
    order: 3,
    views: 0,
    references: "DENR-BMB. (2023). Philippine Biodiversity. · Conservation International. (2022).",
    body: `<p class="lead">The Philippines is one of the world's 17 "megadiverse" countries.</p><h2>A Fragile Treasure</h2><p>The country's islands have been isolated for millions of years, producing species found nowhere else on Earth.</p><h2>The Threats</h2><p>Deforestation is the primary driver. The Philippines has lost more than 70% of its original forest cover.</p><p class="article-end">— END —</p>`
  },
  {
    slug: "climate-change-environmental-social",
    title: "Climate Change: Environmental Issue or Social Issue?",
    tag: "Climate",
    heroImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1600",
    excerpt: "Rising seas don't just swallow coastlines — they displace families, deepen inequality, and reshape entire nations.",
    author: "Member 4",
    readTime: 8,
    status: "published",
    order: 4,
    views: 0,
    references: "IPCC. (2023). Sixth Assessment Report. · PAGASA. (2024). Climate Outlook.",
    body: `<p class="lead">We usually talk about climate change as an environmental problem. But that framing hides something deeper.</p><h2>Two Lenses, One Crisis</h2><p>Seen as a social issue, it's about who suffers first, who suffers worst, and who has the power to act.</p><p class="article-end">— END —</p>`
  },
  {
    slug: "rewriting-life-gene-therapy",
    title: "Rewriting Life: Ethics of Gene Therapy & Stem Cell Research",
    tag: "Gene Therapy",
    heroImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1600",
    excerpt: "We can now edit the code of life itself. But should we? And where do we draw the line?",
    author: "Member 6",
    readTime: 11,
    status: "published",
    order: 5,
    views: 0,
    references: "NIH. (2023). Gene Therapy. · UNESCO. (2022). Bioethics Report.",
    body: `<p class="lead">We now have the ability to edit the code of life. The question is no longer whether we can — but whether we should.</p><h2>What is Gene Therapy?</h2><p>Gene therapy is the use of genetic material to treat or prevent disease.</p><p class="article-end">— END —</p>`
  },
  {
    slug: "human-displacement-automation",
    title: "Human Displacement in the Age of Automation",
    tag: "Technology",
    heroImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600",
    excerpt: "When machines learn faster than we can retrain, who gets left behind — and what do we owe them?",
    author: "Member 7",
    readTime: 9,
    status: "published",
    order: 6,
    views: 0,
    references: "World Economic Forum. (2023). Future of Jobs Report. · ILO. (2022).",
    body: `<p class="lead">Technology has always changed work. But the pace and scope of today's automation is different.</p><h2>The Scale of the Change</h2><p>The question today is whether that pattern still holds.</p><p class="article-end">— END —</p>`
  }
];

const members = [
  { name: "Member 1", section: "BSIT 3-A", role: "Editor-in-Chief", bio: "Leads editorial direction and writes the headline feature.", order: 1 },
  { name: "Member 2", section: "BSIT 3-A", role: "Managing Editor", bio: "Coordinates deadlines and reviews drafts.", order: 2 },
  { name: "Member 3", section: "BSIT 3-A", role: "Senior Writer", bio: "Covers biodiversity and environmental issues.", order: 3 },
  { name: "Member 4", section: "BSIT 3-A", role: "Senior Writer", bio: "Reports on climate change and social impact.", order: 4 },
  { name: "Member 5", section: "BSIT 3-A", role: "Staff Writer", bio: "Writes on nanotechnology ethics.", order: 5 },
  { name: "Member 6", section: "BSIT 3-A", role: "Staff Writer", bio: "Investigates gene therapy and stem cells.", order: 6 },
  { name: "Member 7", section: "BSIT 3-A", role: "Staff Writer", bio: "Covers technology and automation.", order: 7 },
  { name: "Member 8", section: "BSIT 3-A", role: "Research Editor", bio: "Verifies facts and gathers sources.", order: 8 },
  { name: "Member 9", section: "BSIT 3-A", role: "Copy Editor", bio: "Refines language and enforces editorial style.", order: 9 },
  { name: "Member 10", section: "BSIT 3-A", role: "Layout Designer", bio: "Designs page structure and typography.", order: 10 },
  { name: "Member 11", section: "BSIT 3-A", role: "Graphics Designer", bio: "Creates infographics and visual assets.", order: 11 },
  { name: "Member 12", section: "BSIT 3-A", role: "Web Developer", bio: "Builds and maintains the site.", order: 12 }
];

const questions = [
  { type: "abcd", question: "What is the primary purpose of Golden Rice?", options: ["To increase rice yield", "To add Vitamin A to rice", "To make rice taste sweeter", "To make rice resistant to pests"], correctIndex: 1, explanation: "Golden Rice is engineered to produce beta-carotene, the precursor of Vitamin A.", order: 1 },
  { type: "truefalse", question: "Deforestation is the biggest threat to Philippine biodiversity.", options: ["True", "False"], correctIndex: 0, explanation: "The Philippines has lost more than 70% of its original forest cover, fragmenting habitats.", order: 2 },
  { type: "abcd", question: "Why is climate change considered a social issue?", options: ["It affects only rich countries", "It affects vulnerable communities the most", "It is caused by social media", "It only happens in cities"], correctIndex: 1, explanation: "The poor and vulnerable bear the worst impacts, deepening inequality.", order: 3 },
  { type: "truefalse", question: "Editing genes in embryos could pass changes to future generations.", options: ["True", "False"], correctIndex: 0, explanation: "Embryo gene editing changes the human gene pool for generations, raising deep ethical questions.", order: 4 },
  { type: "abcd", question: "What makes nanotechnology ethically complex?", options: ["Nanoparticles are too big", "Long-term health and environmental effects are unclear", "It cannot be used in medicine", "It is invisible to cameras"], correctIndex: 1, explanation: "Nanoparticles can cross biological barriers, but their long-term effects are still unknown.", order: 5 },
  { type: "truefalse", question: "The Philippines is one of the world's 17 megadiverse countries.", options: ["True", "False"], correctIndex: 0, explanation: "The Philippines is one of 17 megadiverse countries, hosting thousands of unique species.", order: 6 },
  { type: "abcd", question: "Why is automation a social concern?", options: ["It makes work too easy", "It displaces workers faster than they can retrain", "It only affects factory workers", "It reduces all jobs equally"], correctIndex: 1, explanation: "Automation displaces workers, often those least able to retrain.", order: 7 },
  { type: "truefalse", question: "The GMO debate is only about science, not ethics.", options: ["True", "False"], correctIndex: 1, explanation: "The GMO debate touches science, ethics, health, economics, farmers' rights, and more.", order: 8 }
];

async function seed() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected. Seeding...");
  await Article.deleteMany({});
  await Member.deleteMany({});
  await Question.deleteMany({});
  await Article.insertMany(articles);
  await Member.insertMany(members);
  await Question.insertMany(questions);
  console.log(`Seeded ${articles.length} articles, ${members.length} members, ${questions.length} questions.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
