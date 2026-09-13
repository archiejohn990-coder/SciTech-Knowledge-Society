const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const MONGO_URL = process.env.MONGODB_URI;
if (!MONGO_URL) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const articleSchema = new mongoose.Schema({
  slug: String,
  title: String,
  tag: String,
  heroImage: String,
  excerpt: String,
  body: String,
  author: String,
  readTime: Number,
  isHeadline: Boolean,
  order: Number
});
const memberSchema = new mongoose.Schema({
  name: String,
  section: String,
  role: String,
  bio: String,
  avatar: String,
  order: Number
});
const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctIndex: Number,
  explanation: String,
  order: Number
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
    order: 1,
    body: `
<p class="lead">In 2021, the Philippines became the first country in the world to approve commercial cultivation of Golden Rice — a genetically modified grain engineered to produce beta-carotene, the precursor of Vitamin A. For its supporters, it was a historic moment in the fight against childhood blindness and malnutrition. For its critics, it was another step in the wrong direction. Both sides agree on one thing: the decision matters.</p>
<h2>What is Golden Rice?</h2>
<p>Golden Rice is a variety of rice genetically engineered to biosynthesize beta-carotene in the edible part of the grain. Ordinary rice produces beta-carotene in its leaves but not in the endosperm — the part we eat. By inserting two genes — one from maize and one from a common soil bacterium — scientists enabled the rice plant to produce the pigment throughout the grain, giving it a distinctive golden color.</p>
<p>The goal is simple: reduce Vitamin A Deficiency (VAD), which affects an estimated 190 million preschool-aged children worldwide. VAD is a leading cause of preventable blindness and can increase the risk of death from infections.</p>
<h2>The Case For Golden Rice</h2>
<p>Supporters argue Golden Rice is one of the most promising public health tools of the century. Unlike supplements or fortified foods, Golden Rice requires no special infrastructure, no behavior change, and no ongoing cost. Farmers grow it the same way they grow ordinary rice. Consumers cook it the same way.</p>
<p>In the Philippines, where rice is the staple food and VAD remains a public health concern, the potential impact is significant. Proponents also note that Golden Rice was developed by public institutions — not private corporations — and is being distributed royalty-free to farmers.</p>
<h2>The Case Against</h2>
<p>Critics raise several objections. First, they argue that the real cause of malnutrition is poverty and lack of dietary diversity — not a shortage of Vitamin A in rice. The solution, they say, is not a genetically modified grain but better access to vegetables, eggs, and other nutrient-rich foods.</p>
<p>Second, they point to concerns about biosafety, biodiversity, and the potential for GM traits to spread to non-GM rice varieties. Even with regulatory approval, critics argue the long-term environmental effects are not fully understood.</p>
<p>Third, they warn about the precedent: approving Golden Rice may open the door to a wider range of GM crops with less clear public benefit — and more corporate control over the food system.</p>
<h2>The Ethics</h2>
<p>At its core, the GMO debate is not just about science. It's about ethics.</p>
<p>Is it ethical to withhold a potentially life-saving technology over uncertain long-term risks? Or is it ethical to deploy a technology whose effects we cannot fully predict? Do the rights of farmers to choose their seeds outweigh the potential public health benefit? Who gets to decide what counts as "safe enough"?</p>
<h2>What Comes Next</h2>
<p>The Philippine decision is being watched closely around the world. Bangladesh, India, and several African nations are considering similar steps. Whether Golden Rice becomes a model for responsible biotechnology or a cautionary tale depends on what we do next: rigorous monitoring, transparent communication, and honest conversation about who benefits and who bears the risk.</p>
<p class="article-end">— END —</p>
`
  },
  {
    slug: "invisible-frontier-nanotechnology",
    title: "The Invisible Frontier: Ethical Issues in Nanotechnology",
    tag: "Nanotechnology",
    heroImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600",
    excerpt: "Nanotech promises cleaner water, smarter medicine, and better materials. But who watches the tiny things we cannot see?",
    author: "Member 5",
    readTime: 9,
    order: 2,
    body: `
<p class="lead">Nanotechnology deals with matter at the scale of a billionth of a meter — smaller than a virus, smaller than a strand of DNA. At this scale, materials behave in strange and powerful ways. And that power raises urgent ethical questions.</p>
<h2>What is Nanotechnology?</h2>
<p>Nanotechnology is the manipulation of matter at the nanoscale — roughly 1 to 100 nanometers. At this scale, materials have different properties than they do in bulk: gold turns red, carbon becomes stronger than steel, and surfaces can become self-cleaning.</p>
<h2>The Promise</h2>
<p>Researchers are using nanotechnology to develop targeted cancer treatments, clean water filters, more efficient solar cells, and lighter, stronger materials for everything from cars to medical implants. The potential benefits span medicine, energy, agriculture, and manufacturing.</p>
<h2>The Ethical Concerns</h2>
<p>But nanotechnology also raises serious questions. Nanoparticles can enter the human body and the environment in ways we don't fully understand. They are so small they can cross biological barriers — including the blood-brain barrier. Their long-term effects on health and ecosystems are still largely unknown.</p>
<p>There is also the question of regulation. Nanotech is already in consumer products — sunscreens, food packaging, cosmetics — often without clear labeling. Who is responsible when harm occurs? Who has access to the benefits?</p>
<h2>The Path Forward</h2>
<p>Responsible nanotechnology requires precaution, transparency, and public participation. Ethical oversight cannot come after the fact. It has to be built into the way the technology is developed from the start.</p>
<p class="article-end">— END —</p>
`
  },
  {
    slug: "silent-extinction-philippine-biodiversity",
    title: "The Silent Extinction: Threats to Philippine Biodiversity",
    tag: "Biodiversity",
    heroImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600",
    excerpt: "The Philippines is one of the world's biodiversity hotspots — and one of its most threatened.",
    author: "Member 3",
    readTime: 10,
    order: 3,
    body: `
<p class="lead">The Philippines is one of the world's 17 "megadiverse" countries. It hosts over 52,000 described species — and hundreds more are discovered every year. It is also one of the most threatened.</p>
<h2>A Fragile Treasure</h2>
<p>The country's islands have been isolated for millions of years, producing species found nowhere else on Earth: the tarsier, the Philippine eagle, the tamaraw, the Visayan warty pig. Endemism — species unique to one place — is extraordinarily high.</p>
<h2>The Threats</h2>
<p>Deforestation is the primary driver. The Philippines has lost more than 70% of its original forest cover. Mining, agricultural expansion, and illegal logging continue to fragment habitats. Coastal ecosystems face their own pressures: coral bleaching, overfishing, and pollution.</p>
<p>Climate change adds a new layer. Rising temperatures, more intense typhoons, and shifting rainfall patterns disrupt ecosystems in ways species cannot easily adapt to.</p>
<h2>Why It Matters</h2>
<p>Biodiversity is not just about beautiful animals. It's about food security, medicine, clean water, and resilience against disaster. Healthy ecosystems protect coastlines, pollinate crops, and regulate climate.</p>
<h2>What Can Be Done</h2>
<p>Protected areas, community-based conservation, stricter law enforcement, and public education all matter. But the biggest shift needed is in how we see nature: not as a resource to be extracted, but as a system we belong to.</p>
<p class="article-end">— END —</p>
`
  },
  {
    slug: "climate-change-environmental-social",
    title: "Climate Change: Environmental Issue or Social Issue?",
    tag: "Climate",
    heroImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1600",
    excerpt: "Rising seas don't just swallow coastlines — they displace families, deepen inequality, and reshape entire nations.",
    author: "Member 4",
    readTime: 8,
    order: 4,
    body: `
<p class="lead">We usually talk about climate change as an environmental problem — melting ice, rising seas, hotter summers. But that framing hides something deeper: climate change is also a social issue, and always has been.</p>
<h2>Two Lenses, One Crisis</h2>
<p>Seen as an environmental issue, climate change is about emissions, temperatures, and ecosystems. Seen as a social issue, it's about who suffers first, who suffers worst, and who has the power to act.</p>
<h2>Who Bears the Weight</h2>
<p>The countries that contributed least to global emissions — the Philippines among them — often face the most severe impacts. Typhoons intensify. Farmland floods. Families are displaced from coastlines and riverbanks.</p>
<p>Within every country, the poor are hit hardest. They live in more vulnerable areas, have fewer resources to recover, and less political voice to demand change.</p>
<h2>Why Framing Matters</h2>
<p>If climate change is only an environmental issue, the solution is technical: reduce emissions, build seawalls, plant trees. If it is a social issue, the solution is bigger: justice, equity, and a fundamental shift in how we share the planet.</p>
<h2>The Truth</h2>
<p>It is both. But treating it as only one has always failed. Real solutions have to address the environment and the society within it — together.</p>
<p class="article-end">— END —</p>
`
  },
  {
    slug: "rewriting-life-gene-therapy",
    title: "Rewriting Life: Ethics of Gene Therapy & Stem Cell Research",
    tag: "Gene Therapy",
    heroImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1600",
    excerpt: "We can now edit the code of life itself. But should we? And where do we draw the line?",
    author: "Member 6",
    readTime: 11,
    order: 5,
    body: `
<p class="lead">We now have the ability to edit the code of life. Tools like CRISPR allow scientists to change specific sequences of DNA with unprecedented precision. The question is no longer whether we can — but whether we should.</p>
<h2>What is Gene Therapy?</h2>
<p>Gene therapy is the use of genetic material to treat or prevent disease. It can involve replacing a faulty gene, disabling a harmful one, or introducing a new gene to help the body fight disease.</p>
<p>Stem cell research is closely related. Stem cells can become many different types of cells in the body, making them powerful tools for repairing damaged tissue and studying disease.</p>
<h2>The Promise</h2>
<p>Gene therapy has already cured certain forms of blindness and blood disorders. Researchers are working on treatments for sickle cell disease, some cancers, and genetic conditions that were once considered permanent.</p>
<h2>The Ethical Questions</h2>
<p>But the technology raises serious issues. Editing genes in adults is one thing. Editing genes in embryos — changes that would be passed down to future generations — is something else entirely.</p>
<p>Where is the line between curing disease and engineering human beings? Who decides which traits are "defects" worth correcting? Will these treatments be available to everyone, or only to those who can afford them?</p>
<h2>The Human Question</h2>
<p>At its deepest level, gene therapy asks us what it means to be human — and how much control we should have over the next generation. Those are not questions science can answer alone. They belong to all of us.</p>
<p class="article-end">— END —</p>
`
  },
  {
    slug: "human-displacement-automation",
    title: "Human Displacement in the Age of Automation",
    tag: "Technology",
    heroImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600",
    excerpt: "When machines learn faster than we can retrain, who gets left behind — and what do we owe them?",
    author: "Member 7",
    readTime: 9,
    order: 6,
    body: `
<p class="lead">Technology has always changed work. But the pace and scope of today's automation is different. Machines are learning not just to do manual labor but to do cognitive work — writing, analyzing, designing, diagnosing.</p>
<h2>The Scale of the Change</h2>
<p>Historically, technological shifts displaced workers but created new kinds of jobs. The question today is whether that pattern still holds — and who gets left behind if it doesn't.</p>
<h2>Who Gets Left Behind</h2>
<p>The workers most at risk are often those with the least ability to retrain: older workers, low-income communities, workers in regions already struggling economically. Meanwhile, the benefits of automation flow to those who own the technology.</p>
<h2>Beyond Jobs</h2>
<p>Displacement is not just about income. It's about identity, community, and meaning. Work shapes how we see ourselves and how we belong. Losing it, even if replaced by a different job, is not a neutral event.</p>
<h2>What Society Owes</h2>
<p>If automation creates enormous wealth, who should share in it? What should be done for workers whose skills are no longer needed? Education, retraining, universal basic income, and new social contracts are all on the table.</p>
<p class="article-end">— END —</p>
`
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
  {
    question: "What is the primary purpose of Golden Rice?",
    options: ["To increase rice yield", "To add Vitamin A to rice", "To make rice taste sweeter", "To make rice resistant to pests"],
    correctIndex: 1,
    explanation: "Golden Rice is genetically engineered to produce beta-carotene, the precursor of Vitamin A.",
    order: 1
  },
  {
    question: "Which of these is the biggest threat to Philippine biodiversity?",
    options: ["Volcanoes", "Deforestation", "Earthquakes", "Fog"],
    correctIndex: 1,
    explanation: "The Philippines has lost more than 70% of its original forest cover, fragmenting habitats.",
    order: 2
  },
  {
    question: "Why is climate change considered a social issue?",
    options: ["It affects only rich countries", "It affects vulnerable communities the most", "It is caused by social media", "It only happens in cities"],
    correctIndex: 1,
    explanation: "The poor and vulnerable bear the worst impacts of climate change, deepening inequality.",
    order: 3
  },
  {
    question: "What is the main ethical concern with gene editing in embryos?",
    options: ["It is too expensive", "Changes are passed to future generations", "It takes too long", "It requires surgery"],
    correctIndex: 1,
    explanation: "Editing embryos changes the human gene pool for generations, raising deep ethical questions.",
    order: 4
  },
  {
    question: "What makes nanotechnology ethically complex?",
    options: ["Nanoparticles are too big", "Long-term health and environmental effects are unclear", "It cannot be used in medicine", "It is invisible to cameras"],
    correctIndex: 1,
    explanation: "Nanoparticles can cross biological barriers, but their long-term effects are still unknown.",
    order: 5
  },
  {
    question: "How many megadiverse countries does the Philippines belong to?",
    options: ["One of the top 17", "One of the top 100", "Not on the list", "One of the top 3"],
    correctIndex: 0,
    explanation: "The Philippines is one of 17 megadiverse countries, hosting thousands of unique species.",
    order: 6
  },
  {
    question: "Why is automation a social concern?",
    options: ["It makes work too easy", "It displaces workers faster than they can retrain", "It only affects factory workers", "It reduces all jobs equally"],
    correctIndex: 1,
    explanation: "Automation displaces workers, often those least able to retrain, raising questions about what society owes them.",
    order: 7
  },
  {
    question: "Which best describes the GMO debate?",
    options: ["It is only about science", "It is only about ethics", "It is about science, ethics, health, and society together", "It is just a marketing problem"],
    correctIndex: 2,
    explanation: "The GMO debate touches science, ethics, health, economics, farmers' rights, and more.",
    order: 8
  }
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
