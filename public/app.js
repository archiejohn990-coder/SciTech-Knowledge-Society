const API = "";
let state = {
  articles: [],
  staff: [],
  questions: [],
  page: "home",
  activeArticleSlug: null,
  quiz: {
    name: "",
    section: "",
    current: 0,
    answers: [],
    startedAt: 0,
    finished: false,
    result: null
  }
};

function go(page, slug) {
  state.page = page;
  if (slug) state.activeArticleSlug = slug;
  if (page === "quiz") state.quiz = { name: "", section: "", current: 0, answers: [], startedAt: 0, finished: false, result: null };
  document.querySelectorAll(".main-nav a").forEach(a => a.classList.remove("active"));
  let navId = page;
  if (page === "article") navId = "articles";
  const navEl = document.querySelector(`.main-nav a[data-nav="${navId}"]`);
  if (navEl) navEl.classList.add("active");
  document.getElementById("mainNav").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function toggleMenu() { document.getElementById("mainNav").classList.toggle("open"); }
function toggleSearch() {
  const drop = document.getElementById("searchDrop");
  drop.classList.toggle("show");
  if (drop.classList.contains("show")) setTimeout(() => document.getElementById("searchInput").focus(), 100);
}

function doSearch() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const results = document.getElementById("searchResults");
  if (!q) { results.innerHTML = ""; return; }
  const matches = state.articles.filter(a => a.title.toLowerCase().includes(q) || (a.tag || "").toLowerCase().includes(q));
  if (!matches.length) {
    results.innerHTML = '<p style="padding:10px 14px;color:#64748b;font-size:0.9rem;">No matches found.</p>';
    return;
  }
  results.innerHTML = matches.map(a => `<a onclick="searchPick('${a.slug}')">${esc(a.title)} <b>· ${esc(a.tag)}</b></a>`).join("");
}

function searchPick(slug) {
  go("article", slug);
  document.getElementById("searchDrop").classList.remove("show");
  document.getElementById("searchInput").value = "";
  document.getElementById("searchResults").innerHTML = "";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

async function loadData() {
  try {
    const [aRes, sRes, qRes] = await Promise.all([
      fetch(`${API}/api/articles`).then(r => r.json()),
      fetch(`${API}/api/staff`).then(r => r.json()),
      fetch(`${API}/api/quiz`).then(r => r.json())
    ]);
    state.articles = aRes.articles || [];
    state.staff = sRes.staff || [];
    state.questions = qRes.questions || [];
  } catch (err) {
    console.error("Load error:", err);
  }
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (state.page === "home") app.innerHTML = renderHome();
  else if (state.page === "articles") app.innerHTML = renderArticles();
  else if (state.page === "ad") app.innerHTML = renderAd();
  else if (state.page === "quiz") renderQuiz();
  else if (state.page === "staff") app.innerHTML = renderStaff();
  else if (state.page === "article") app.innerHTML = renderArticle();
}

function renderHome() {
  const headline = state.articles.find(a => a.isHeadline) || state.articles[0];
  const others = state.articles.filter(a => a !== headline).slice(0, 5);
  if (!headline) return '<p style="padding:40px;text-align:center;color:#64748b;">No articles yet.</p>';

  return `
    <div class="hero">
      <div class="hero-bg" style="background-image:url('${esc(headline.heroImage)}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-eyebrow">Featured Story · Period 3</div>
        <h1 class="hero-headline">${esc(headline.title)}</h1>
        <p class="hero-sub">${esc(headline.excerpt)}</p>
        <div class="hero-meta">
          <span><b>By</b> ${esc(headline.author)}</span>
          <span>·</span>
          <span>${headline.readTime} min read</span>
        </div>
        <button class="btn-primary" onclick="go('article','${headline.slug}')">Read the Feature</button>
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <h2>Latest Stories</h2>
        <button class="link-btn" onclick="go('articles')">View all →</button>
      </div>
      <div class="card-grid">
        ${others.map(a => `
          <article class="card" onclick="go('article','${a.slug}')">
            <div class="card-img" style="background-image:url('${esc(a.heroImage)}')"></div>
            <div class="card-body">
              <div class="card-tag">${esc(a.tag)}</div>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.excerpt)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Sponsored</h2></div>
      <div class="ad-card" onclick="go('ad')">
        <div class="ad-tag">ADVERTISEMENT</div>
        <div class="ad-inner">
          <div class="ad-left">
            <h3>NeuroLink Mini</h3>
            <p class="ad-tagline">Think. Connect. Belong.</p>
            <p class="ad-desc">The first consumer brain-computer interface for everyday life. Control your devices with a thought. Communicate without speaking.</p>
            <button class="btn-outline">Learn more</button>
          </div>
          <div class="ad-right">
            <div class="ad-device">
              <div class="ad-pulse"></div>
              <div class="ad-ring r1"></div>
              <div class="ad-ring r2"></div>
              <div class="ad-ring r3"></div>
              <div class="ad-chip"></div>
            </div>
          </div>
        </div>
        <div class="ad-disclaimer">Paid sponsored content — read our editorial policy</div>
      </div>
    </div>
  `;
}

function renderArticles() {
  return `
    <div class="section">
      <h1 class="page-title">All Articles</h1>
      <p class="page-sub">Six stories on science, technology, and the society that shapes them.</p>
      <div class="article-list">
        ${state.articles.map(a => `
          <article class="list-item" onclick="go('article','${a.slug}')">
            <div class="list-img" style="background-image:url('${esc(a.heroImage)}')"></div>
            <div class="list-body">
              <div class="card-tag ${a.isHeadline ? 'headline' : ''}">${esc(a.isHeadline ? 'HEADLINE' : a.tag)}</div>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.excerpt)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderArticle() {
  const a = state.articles.find(x => x.slug === state.activeArticleSlug);
  if (!a) return '<p style="padding:40px;text-align:center;color:#64748b;">Article not found.</p>';
  return `
    <div class="article-hero" style="background-image:url('${esc(a.heroImage)}')">
      <div class="article-hero-overlay"></div>
      <div class="article-hero-content">
        <div class="card-tag ${a.isHeadline ? 'headline' : ''}">${esc(a.isHeadline ? 'HEADLINE' : a.tag)}</div>
        <h1>${esc(a.title)}</h1>
        <div class="article-meta">By ${esc(a.author)} · ${a.readTime} min read · Period 3</div>
      </div>
    </div>
    <div class="article-body">${a.body || ""}</div>
  `;
}

function renderAd() {
  return `
    <div class="section">
      <div class="ad-page">
        <div class="ad-page-tag">ADVERTISEMENT · SPONSORED</div>
        <h1 class="ad-page-title">NeuroLink Mini</h1>
        <p class="ad-page-tagline">Think. Connect. Belong.</p>
        <div class="ad-page-hero">
          <div class="ad-device big">
            <div class="ad-pulse"></div>
            <div class="ad-ring r1"></div>
            <div class="ad-ring r2"></div>
            <div class="ad-ring r3"></div>
            <div class="ad-ring r4"></div>
            <div class="ad-chip"></div>
          </div>
        </div>
        <div class="ad-page-body">
          <h2>What is NeuroLink Mini?</h2>
          <p>NeuroLink Mini is the first consumer-grade brain-computer interface designed for everyday life. Worn as a slim band behind the ear, it reads subtle neural signals and translates them into digital actions — no screen, no keyboard, no voice required.</p>
          <h2>What can it do?</h2>
          <ul>
            <li>Control your phone, laptop, and smart home with a thought</li>
            <li>Send messages to friends without typing or speaking</li>
            <li>Access focus modes for studying, working, and resting</li>
            <li>Translate thoughts into text in real time</li>
            <li>Pair with NeuroLink Studio for creative work</li>
          </ul>
          <h2>Is it safe?</h2>
          <p>NeuroLink Mini uses non-invasive EEG sensors — no surgery, no implants. It complies with international neural-data protection standards and encrypts all signals end-to-end.</p>
          <h2>Who is it for?</h2>
          <p>Students who want to study smarter. Professionals who work with their minds. Creators who want to create faster. Anyone ready for the next interface between humans and machines.</p>
          <div class="ad-cta">
            <button class="btn-primary">Pre-order now</button>
            <span class="ad-price">Starting at ₱24,999</span>
          </div>
        </div>
        <div class="ad-page-footer">
          <p><b>Disclaimer:</b> NeuroLink Mini is a fictional product created for educational purposes as part of a Science, Technology & Society (STS) project. It is not a real device and does not represent any actual product or company.</p>
        </div>
      </div>
    </div>
  `;
}

function renderStaff() {
  return `
    <div class="section">
      <h1 class="page-title">Editorial Staff</h1>
      <p class="page-sub">The 12 members behind SciTect Knowledge Society.</p>
      <div class="staff-grid">
        ${state.staff.map(m => `
          <div class="staff-card">
            <div class="staff-avatar" style="background-image:url('${esc(m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&size=200&background=0ea5e9&color=fff`)}')"></div>
            <h3>${esc(m.name)}</h3>
            <p class="staff-section">${esc(m.section)}</p>
            <p class="staff-role">${esc(m.role)}</p>
            <p class="staff-bio">${esc(m.bio)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderQuiz() {
  const wrap = document.getElementById("app");
  const q = state.quiz;

  if (q.finished && q.result) {
    const pct = q.result.percentage;
    let msg = "";
    if (pct === 100) msg = "Perfect score. You really understand STS.";
    else if (pct >= 75) msg = "Great work. Strong grasp of these issues.";
    else if (pct >= 50) msg = "Not bad. A little more reading will help.";
    else msg = "Keep exploring. The articles will help you catch up.";

    const minutes = Math.floor(q.result.duration / 60);
    const seconds = q.result.duration % 60;

    wrap.innerHTML = `
      <div class="section">
        <div class="quiz-wrap">
          <div class="quiz-card">
            <div class="quiz-result">
              <h2>Quiz Complete</h2>
              <p class="who">${esc(q.name)} · ${esc(q.section)}</p>
              <div class="quiz-score">${q.result.score}/${q.result.total}</div>
              <p class="quiz-msg">${msg}</p>
              <p class="quiz-duration">Time: ${minutes}m ${seconds}s</p>
              <div class="quiz-actions">
                <button class="btn-primary" onclick="viewLeaderboard()">View Leaderboard</button>
                <button class="btn-outline" style="color:var(--primary);border-color:var(--primary);" onclick="go('quiz')">Try Again</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (q.startedAt === 0) {
    wrap.innerHTML = `
      <div class="section">
        <div class="quiz-start">
          <div class="quiz-start-card">
            <h2>How Well Do You Know STS?</h2>
            <p>8 questions on science, technology, and society. Enter your name and section to begin.</p>
            <div class="field">
              <label>Your Name</label>
              <input id="quizName" placeholder="Juan Dela Cruz" autocomplete="off">
            </div>
            <div class="field">
              <label>Your Section</label>
              <input id="quizSection" placeholder="BSIT 3-A" autocomplete="off">
            </div>
            <button class="btn-primary" onclick="startQuiz()">Start Quiz</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const item = state.questions[q.current];
  if (!item) { startQuiz(); return; }
  const progress = Math.round((q.current / state.questions.length) * 100);

  wrap.innerHTML = `
    <div class="section">
      <div class="quiz-wrap">
        <div class="quiz-progress">
          <span>Q${q.current + 1} / ${state.questions.length}</span>
          <div class="quiz-bar"><div class="quiz-bar-fill" style="width:${progress}%"></div></div>
          <span>${esc(q.name)}</span>
        </div>
        <div class="quiz-card">
          <h3>${esc(item.question)}</h3>
          <div id="quizOptions">
            ${item.options.map((opt, i) => `<button class="quiz-option" onclick="answerQuiz(${i})">${esc(opt)}</button>`).join("")}
          </div>
          <div class="quiz-feedback" id="quizFeedback"></div>
        </div>
      </div>
    </div>
  `;
}

function startQuiz() {
  const name = document.getElementById("quizName").value.trim();
  const section = document.getElementById("quizSection").value.trim();
  if (!name) { alert("Please enter your name."); return; }
  if (!section) { alert("Please enter your section."); return; }
  state.quiz.name = name;
  state.quiz.section = section;
  state.quiz.current = 0;
  state.quiz.answers = [];
  state.quiz.startedAt = Date.now();
  state.quiz.finished = false;
  state.quiz.result = null;
  renderQuiz();
}

let quizAnswered = false;
function answerQuiz(idx) {
  if (quizAnswered) return;
  quizAnswered = true;

  const q = state.quiz;
  const item = state.questions[q.current];
  const buttons = document.querySelectorAll(".quiz-option");
  const feedback = document.getElementById("quizFeedback");

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === item.correctIndex) b.classList.add("correct");
    else if (i === idx) b.classList.add("wrong");
  });

  if (idx === item.correctIndex) {
    feedback.className = "quiz-feedback right show";
    feedback.innerHTML = `<b>Correct.</b> ${esc(item.explanation)}`;
  } else {
    feedback.className = "quiz-feedback wrong show";
    feedback.innerHTML = `<b>Not quite.</b> ${esc(item.explanation)}`;
  }

  q.answers.push(idx);

  setTimeout(async () => {
    quizAnswered = false;
    if (q.current < state.questions.length - 1) {
      q.current++;
      renderQuiz();
    } else {
      await finishQuiz();
    }
  }, 2000);
}

async function finishQuiz() {
  const q = state.quiz;
  const duration = Math.round((Date.now() - q.startedAt) / 1000);

  try {
    const res = await fetch(`${API}/api/quiz/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: q.answers })
    });
    const data = await res.json();
    q.result = { score: data.score, total: data.total, percentage: data.percentage, duration };
    q.finished = true;

    fetch(`${API}/api/quiz/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: q.name,
        section: q.section,
        score: data.score,
        total: data.total,
        duration
      })
    }).catch(() => {});

    renderQuiz();
  } catch (err) {
    alert("Could not check answers: " + err.message);
  }
}

async function viewLeaderboard() {
  const wrap = document.getElementById("app");
  wrap.innerHTML = `
    <div class="section">
      <h1 class="page-title">Leaderboard</h1>
      <p class="page-sub">Top 20 scores from everyone who took the quiz.</p>
      <div id="lbBody" class="leaderboard">Loading…</div>
      <div style="text-align:center;margin-top:30px;">
        <button class="btn-outline" style="color:var(--primary);border-color:var(--primary);" onclick="go('quiz')">Take Quiz Again</button>
      </div>
    </div>
  `;
  try {
    const res = await fetch(`${API}/api/quiz/leaderboard`);
    const data = await res.json();
    const list = data.leaderboard || [];
    if (!list.length) {
      document.getElementById("lbBody").innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">No scores yet.</p>';
      return;
    }
    document.getElementById("lbBody").innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr><th>#</th><th>Name</th><th>Section</th><th>Score</th><th>%</th></tr>
        </thead>
        <tbody>
          ${list.map((s, i) => `
            <tr class="${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">
              <td class="rank">${i + 1}</td>
              <td>${esc(s.name)}</td>
              <td>${esc(s.section)}</td>
              <td>${s.score}/${s.total}</td>
              <td class="pct">${s.percentage}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    document.getElementById("lbBody").innerHTML = '<p style="text-align:center;color:#b91c1c;padding:20px;">Failed to load leaderboard.</p>';
  }
}

document.addEventListener("click", (e) => {
  const nav = document.getElementById("mainNav");
  const menuBtn = document.querySelector(".menu-btn");
  if (nav && nav.classList.contains("open") && !nav.contains(e.target) && !btnContains(menuBtn, e.target)) {
    nav.classList.remove("open");
  }
});

function btnContains(btn, target) {
  return btn && (btn === target || btn.contains(target));
}

(async function init() {
  await loadData();
  render();
})();
