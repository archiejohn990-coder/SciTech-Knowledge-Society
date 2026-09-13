const articles = [
  { id: "article-gmo", title: "Golden Rice and the GMO Debate", tag: "Headline" },
  { id: "article-nano", title: "The Invisible Frontier: Nanotechnology", tag: "Nanotechnology" },
  { id: "article-bio", title: "The Silent Extinction: Philippine Biodiversity", tag: "Biodiversity" },
  { id: "article-climate", title: "Climate Change: Environmental or Social Issue?", tag: "Climate" },
  { id: "article-gene", title: "Rewriting Life: Gene Therapy & Stem Cells", tag: "Gene Therapy" },
  { id: "article-displacement", title: "Human Displacement in the Age of Automation", tag: "Technology" }
];

const quizQuestions = [
  {
    q: "What is the primary purpose of Golden Rice?",
    options: ["To increase rice yield", "To add Vitamin A to rice", "To make rice taste sweeter", "To make rice resistant to pests"],
    answer: 1,
    why: "Golden Rice is genetically engineered to produce beta-carotene, the precursor of Vitamin A."
  },
  {
    q: "Which of these is the biggest threat to Philippine biodiversity?",
    options: ["Volcanoes", "Deforestation", "Earthquakes", "Fog"],
    answer: 1,
    why: "The Philippines has lost more than 70% of its original forest cover, fragmenting habitats."
  },
  {
    q: "Why is climate change considered a social issue?",
    options: ["It affects only rich countries", "It affects vulnerable communities the most", "It is caused by social media", "It only happens in cities"],
    answer: 1,
    why: "The poor and vulnerable bear the worst impacts of climate change, deepening inequality."
  },
  {
    q: "What is the main ethical concern with gene editing in embryos?",
    options: ["It's too expensive", "Changes are passed to future generations", "It takes too long", "It requires surgery"],
    answer: 1,
    why: "Editing embryos changes the human gene pool for generations, raising deep ethical questions."
  },
  {
    q: "What makes nanotechnology ethically complex?",
    options: ["Nanoparticles are too big", "Long-term health and environmental effects are unclear", "It cannot be used in medicine", "It is invisible to cameras"],
    answer: 1,
    why: "Nanoparticles can cross biological barriers, but their long-term effects are still unknown."
  },
  {
    q: "What is the Philippines' rank among the world's megadiverse countries?",
    options: ["One of the top 17", "One of the top 100", "Not on the list", "One of the top 3"],
    answer: 0,
    why: "The Philippines is one of 17 megadiverse countries, hosting thousands of unique species."
  },
  {
    q: "Why is automation a social concern?",
    options: ["It makes work too easy", "It displaces workers faster than they can retrain", "It only affects factory workers", "It reduces all jobs equally"],
    answer: 1,
    why: "Automation displaces workers, often those least able to retrain, raising questions about what society owes them."
  },
  {
    q: "Which best describes the GMO debate?",
    options: ["It's only about science", "It's only about ethics", "It's about science, ethics, health, and society together", "It's just a marketing problem"],
    answer: 2,
    why: "The GMO debate touches science, ethics, health, economics, farmers' rights, and more."
  }
];

let currentQ = 0;
let score = 0;
let answered = false;

function go(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + page);
  if (el) el.classList.add("active");

  document.querySelectorAll(".main-nav a").forEach(a => a.classList.remove("active"));

  let navId = page;
  if (page.startsWith("article-")) navId = "articles";
  const navEl = document.querySelector(`.main-nav a[data-nav="${navId}"]`);
  if (navEl) navEl.classList.add("active");

  document.getElementById("mainNav").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });

  if (page === "quiz") renderQuiz();
}

function toggleMenu() {
  document.getElementById("mainNav").classList.toggle("open");
}

function toggleSearch() {
  const drop = document.getElementById("searchDrop");
  drop.classList.toggle("show");
  if (drop.classList.contains("show")) {
    setTimeout(() => document.getElementById("searchInput").focus(), 100);
  }
}

function doSearch() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const results = document.getElementById("searchResults");
  if (!q) {
    results.innerHTML = "";
    return;
  }
  const matches = articles.filter(a => a.title.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q));
  if (matches.length === 0) {
    results.innerHTML = '<p style="padding:10px 14px;color:#64748b;font-size:0.9rem;">No matches found.</p>';
    return;
  }
  results.innerHTML = matches.map(a => `<a onclick="searchPick('${a.id}')">${a.title} <b>· ${a.tag}</b></a>`).join("");
}

function searchPick(id) {
  go(id);
  document.getElementById("searchDrop").classList.remove("show");
  document.getElementById("searchInput").value = "";
  document.getElementById("searchResults").innerHTML = "";
}

function renderQuiz() {
  const wrap = document.getElementById("quizWrap");
  if (currentQ >= quizQuestions.length) {
    const pct = Math.round((score / quizQuestions.length) * 100);
    let msg = "";
    if (pct === 100) msg = "Perfect score. You really understand STS.";
    else if (pct >= 75) msg = "Great work. You've got a strong grasp of these issues.";
    else if (pct >= 50) msg = "Not bad. A little more reading will help.";
    else msg = "Keep exploring. The articles will help you catch up.";
    wrap.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-result">
          <h2>Quiz Complete</h2>
          <div class="quiz-score">${score}/${quizQuestions.length}</div>
          <p class="quiz-msg">${msg}</p>
          <button class="btn-primary" onclick="resetQuiz()">Try again</button>
        </div>
      </div>
    `;
    return;
  }

  const item = quizQuestions[currentQ];
  const progress = Math.round((currentQ / quizQuestions.length) * 100);

  wrap.innerHTML = `
    <div class="quiz-progress">
      <span>Question ${currentQ + 1} / ${quizQuestions.length}</span>
      <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progress}%"></div></div>
      <span>Score: ${score}</span>
    </div>
    <div class="quiz-card">
      <h3>${item.q}</h3>
      <div id="quizOptions">
        ${item.options.map((opt, i) => `<button class="quiz-option" onclick="answerQuiz(${i})">${opt}</button>`).join("")}
      </div>
      <div class="quiz-feedback" id="quizFeedback"></div>
    </div>
  `;

  answered = false;
}

function answerQuiz(idx) {
  if (answered) return;
  answered = true;

  const item = quizQuestions[currentQ];
  const buttons = document.querySelectorAll(".quiz-option");
  const feedback = document.getElementById("quizFeedback");

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === item.answer) b.classList.add("correct");
    else if (i === idx) b.classList.add("wrong");
  });

  if (idx === item.answer) {
    score++;
    feedback.className = "quiz-feedback right show";
    feedback.innerHTML = `<b>Correct.</b> ${item.why}`;
  } else {
    feedback.className = "quiz-feedback wrong show";
    feedback.innerHTML = `<b>Not quite.</b> ${item.why}`;
  }

  setTimeout(() => {
    currentQ++;
    renderQuiz();
  }, 2200);
}

function resetQuiz() {
  currentQ = 0;
  score = 0;
  answered = false;
  renderQuiz();
}

document.addEventListener("click", (e) => {
  const nav = document.getElementById("mainNav");
  const menuBtn = document.querySelector(".menu-btn");
  if (nav && nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
    nav.classList.remove("open");
  }
});
