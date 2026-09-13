const API = "";
let state = {
  articles: [],
  staff: [],
  questions: [],
  page: "home",
  activeArticleSlug: null,
  related: [],
  comments: [],
  filterTag: "",
  adminPass: sessionStorage.getItem("sts_admin_pass") || "",
  editingArticleId: null,
  quiz: {
    name: "", section: "", current: 0, answers: [],
    startedAt: 0, finished: false, result: null
  }
};

function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function toast(type, msg) {
  const wrap = $("toastWrap");
  const el = document.createElement("div");
  el.className = "toast " + (type || "success");
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("sts_theme", theme);
}
function toggleTheme() {
  const cur = localStorage.getItem("sts_theme") || "light";
  applyTheme(cur === "light" ? "dark" : "light");
}
(function initTheme() {
  const t = localStorage.getItem("sts_theme") || "light";
  applyTheme(t);
})();

function go(page, slug) {
  state.page = page;
  if (slug) state.activeArticleSlug = slug;
  if (page === "quiz" && !state.quiz.startedAt) {
    state.quiz = { name: "", section: "", current: 0, answers: [], startedAt: 0, finished: false, result: null };
  }
  document.querySelectorAll(".main-nav a").forEach(a => a.classList.remove("active"));
  let navId = page;
  if (page === "article") navId = "articles";
  const navEl = document.querySelector(`.main-nav a[data-nav="${navId}"]`);
  if (navEl) navEl.classList.add("active");
  $("mainNav").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
  render();
}

function toggleMenu() { $("mainNav").classList.toggle("open"); }
function toggleSearch() {
  const drop = $("searchDrop");
  drop.classList.toggle("show");
  if (drop.classList.contains("show")) setTimeout(() => $("searchInput").focus(), 100);
}

let searchTimeout = null;
function doSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(runSearch, 300);
}

async function runSearch() {
  const q = $("searchInput").value.trim();
  const results = $("searchResults");
  if (!q) { results.innerHTML = ""; return; }
  results.innerHTML = '<p style="padding:10px 14px;color:var(--muted);">Searching…</p>';
  try {
    const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const r = data.results || {};
    let html = "";
    if (r.articles?.length) {
      html += `<div class="search-section">Articles</div>`;
      r.articles.forEach(a => { html += `<a onclick="searchPick('${a.slug}')">${esc(a.title)} <b>· ${esc(a.tag)}</b></a>`; });
    }
    if (r.staff?.length) {
      html += `<div class="search-section">Staff</div>`;
      r.staff.forEach(m => { html += `<a onclick="go('staff')">${esc(m.name)} <b>· ${esc(m.role)}</b></a>`; });
    }
    if (r.questions?.length) {
      html += `<div class="search-section">Quiz Questions</div>`;
      r.questions.forEach(qq => { html += `<a onclick="go('quiz')">${esc(qq.question)}</a>`; });
    }
    if (!html) html = '<p style="padding:10px 14px;color:var(--muted);">No matches found.</p>';
    results.innerHTML = html;
  } catch (err) {
    results.innerHTML = `<p style="padding:10px 14px;color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

function searchPick(slug) {
  go("article", slug);
  $("searchDrop").classList.remove("show");
  $("searchInput").value = "";
  $("searchResults").innerHTML = "";
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
  } catch (err) { console.error("Load error:", err); }
}

function render() {
  const app = $("app");
  const page = state.page;
  if (page === "home") app.innerHTML = renderHome();
  else if (page === "articles") app.innerHTML = renderArticles();
  else if (page === "ad") app.innerHTML = renderAd();
  else if (page === "staff") app.innerHTML = renderStaff();
  else if (page === "contact") app.innerHTML = renderContact();
  else if (page === "admin") renderAdmin();
  else if (page === "quiz") renderQuiz();
  else if (page === "article") renderArticlePage();
  else app.innerHTML = renderNotFound();
}

function renderHome() {
  const headline = state.articles.find(a => a.isHeadline) || state.articles[0];
  const others = state.articles.filter(a => a !== headline).slice(0, 5);
  if (!headline) return '<p style="padding:40px;text-align:center;color:var(--muted);">No articles yet.</p>';

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
            <p class="ad-desc">The first consumer brain-computer interface for everyday life. Control your devices with a thought.</p>
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

    <div class="newsletter-box">
      <h3>Join the SciTect Newsletter</h3>
      <p>Weekly stories on science, technology, and society.</p>
      <form class="newsletter-form" onsubmit="submitNewsletter(event)">
        <input type="email" id="newsletterEmail" placeholder="your@email.com" required>
        <button type="submit">Subscribe</button>
      </form>
    </div>
  `;
}

async function submitNewsletter(e) {
  e.preventDefault();
  const email = $("newsletterEmail").value.trim();
  try {
    const res = await fetch(`${API}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", data.message || "Subscribed!");
    $("newsletterEmail").value = "";
  } catch (err) { toast("danger", err.message); }
}

function renderArticles() {
  const tags = ["", ...new Set(state.articles.map(a => a.tag).filter(Boolean))];
  const filtered = state.filterTag
    ? state.articles.filter(a => a.tag === state.filterTag)
    : state.articles;

  return `
    <div class="section">
      <h1 class="page-title">All Articles</h1>
      <p class="page-sub">Stories on science, technology, and the society that shapes them.</p>

      <div class="filter-row">
        ${tags.map(t => `<button class="filter-chip ${state.filterTag === t ? 'active' : ''}" onclick="filterByTag('${esc(t)}')">${t ? esc(t) : 'All'}</button>`).join("")}
      </div>

      <div class="article-list">
        ${filtered.map(a => `
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

function filterByTag(tag) {
  state.filterTag = tag;
  render();
}

async function renderArticlePage() {
  const app = $("app");
  app.innerHTML = '<div class="loading">Loading article…</div>';
  try {
    const res = await fetch(`${API}/api/articles/${state.activeArticleSlug}`);
    if (!res.ok) { app.innerHTML = renderNotFound(); return; }
    const data = await res.json();
    const a = data.article;
    state.related = data.related || [];
    const cRes = await fetch(`${API}/api/comments/${a.slug}`).then(r => r.json());
    state.comments = cRes.comments || [];

    const url = location.origin + "/" + a.slug;

    app.innerHTML = `
      <div class="article-hero" style="background-image:url('${esc(a.heroImage)}')">
        <div class="article-hero-overlay"></div>
        <div class="article-hero-content">
          <div class="card-tag ${a.isHeadline ? 'headline' : ''}">${esc(a.isHeadline ? 'HEADLINE' : a.tag)}</div>
          <h1>${esc(a.title)}</h1>
          <div class="article-meta">
            <span>By ${esc(a.author)}</span>
            <span>·</span>
            <span>${a.readTime} min read</span>
            <span>·</span>
            <span>${a.views || 0} views</span>
          </div>
          <div class="article-actions">
            <button class="share-btn" onclick="copyLink('${esc(url)}')">📋 Copy link</button>
            <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank">📘 Share</a>
            <a class="share-btn" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(a.title)}" target="_blank">🐦 Tweet</a>
          </div>
        </div>
      </div>

      <div class="article-body">${a.body || ""}</div>

      ${a.references ? `<div class="references-box"><h3>References</h3><p>${esc(a.references)}</p></div>` : ""}

      ${state.related.length ? `
        <div class="related-box">
          <h2>Related Reading</h2>
          <div class="card-grid">
            ${state.related.map(r => `
              <article class="card" onclick="go('article','${r.slug}')">
                <div class="card-img" style="background-image:url('${esc(r.heroImage)}')"></div>
                <div class="card-body">
                  <div class="card-tag">${esc(r.tag)}</div>
                  <h3>${esc(r.title)}</h3>
                  <p>${esc(r.excerpt)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div class="comments-box">
        <h2>Comments (${state.comments.length})</h2>
        <form class="comment-form" onsubmit="submitComment(event,'${a.slug}')">
          <input id="cName" placeholder="Your name (optional)" maxlength="60">
          <textarea id="cText" placeholder="Share your thoughts..." required maxlength="1000"></textarea>
          <button type="submit" class="btn-primary">Post comment</button>
        </form>
        <div id="commentList">
          ${state.comments.map(c => `
            <div class="comment-item">
              <div class="comment-head">
                <span class="comment-name">${esc(c.name || "Anonymous")}</span>
                <span class="comment-time">${timeAgo(c.createdAt)}</span>
              </div>
              <div class="comment-text">${esc(c.text)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<p style="padding:40px;text-align:center;color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

async function submitComment(e, slug) {
  e.preventDefault();
  const name = $("cName").value.trim();
  const text = $("cText").value.trim();
  if (!text) return;
  try {
    const res = await fetch(`${API}/api/comments/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", "Comment posted");
    renderArticlePage();
  } catch (err) { toast("danger", err.message); }
}

function copyLink(url) {
  navigator.clipboard.writeText(url).then(() => toast("success", "Link copied")).catch(() => prompt("Copy:", url));
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
          </ul>
          <h2>Is it safe?</h2>
          <p>NeuroLink Mini uses non-invasive EEG sensors — no surgery, no implants. It complies with international neural-data protection standards and encrypts all signals end-to-end.</p>
          <h2>Who is it for?</h2>
          <p>Students who want to study smarter. Professionals who work with their minds. Creators who want to create faster.</p>
          <div class="ad-cta">
            <button class="btn-primary">Pre-order now</button>
            <span class="ad-price">Starting at ₱24,999</span>
          </div>
        </div>
        <div class="ad-page-footer">
          <p><b>Disclaimer:</b> NeuroLink Mini is a fictional product created for educational purposes as part of a Science, Technology & Society (STS) project.</p>
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

function renderContact() {
  return `
    <div class="section">
      <h1 class="page-title">Contact Us</h1>
      <p class="page-sub">Have a story idea, question, or feedback? Send us a message.</p>
      <div class="contact-wrap">
        <form class="contact-card" onsubmit="submitContact(event)">
          <div class="field"><label>Your Name</label><input id="contactName" required maxlength="80"></div>
          <div class="field"><label>Email</label><input id="contactEmail" type="email" required maxlength="120"></div>
          <div class="field"><label>Message</label><textarea id="contactMsg" required maxlength="2000"></textarea></div>
          <button type="submit" class="btn-primary">Send Message</button>
        </form>
      </div>
    </div>
  `;
}

async function submitContact(e) {
  e.preventDefault();
  const name = $("contactName").value.trim();
  const email = $("contactEmail").value.trim();
  const message = $("contactMsg").value.trim();
  try {
    const res = await fetch(`${API}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", "Message sent!");
    $("contactName").value = "";
    $("contactEmail").value = "";
    $("contactMsg").value = "";
  } catch (err) { toast("danger", err.message); }
}

function renderQuiz() {
  const app = $("app");
  const q = state.quiz;

  if (q.finished && q.result) {
    const pct = q.result.percentage;
    let msg = "";
    if (pct === 100) msg = "Perfect score. You really understand STS.";
    else if (pct >= 75) msg = "Great work. Strong grasp of these issues.";
    else if (pct >= 50) msg = "Not bad. A little more reading will help.";
    else msg = "Keep exploring. The articles will help you catch up.";
    const m = Math.floor(q.result.duration / 60);
    const s = q.result.duration % 60;

    app.innerHTML = `
      <div class="section">
        <div class="quiz-wrap">
          <div class="quiz-card">
            <div class="quiz-result">
              <h2>Quiz Complete</h2>
              <p class="who">${esc(q.name)} · ${esc(q.section)}</p>
              <div class="badge-pill badge-${q.result.badge || 'Learner'}">${esc(q.result.badge || 'Learner')}</div>
              <div class="quiz-score">${q.result.score}/${q.result.total}</div>
              <p class="quiz-msg">${msg}</p>
              <p class="quiz-duration">Time: ${m}m ${s}s</p>
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
    app.innerHTML = `
      <div class="section">
        <div class="quiz-start">
          <div class="quiz-start-card">
            <h2>How Well Do You Know STS?</h2>
            <p>${state.questions.length} questions on science, technology, and society. Enter your name and section to begin.</p>
            <div class="field"><label>Your Name</label><input id="quizName" placeholder="Juan Dela Cruz"></div>
            <div class="field"><label>Your Section</label><input id="quizSection" placeholder="BSIT 3-A"></div>
            <button class="btn-primary" onclick="startQuiz()">Start Quiz</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (!state.questions.length) {
    app.innerHTML = `
      <div class="section">
        <div class="quiz-start">
          <div class="quiz-start-card">
            <h2>Quiz unavailable</h2>
            <p>No questions found in the database. Please contact the administrator.</p>
            <button class="btn-primary" onclick="go('home')">Back to Home</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const item = state.questions[q.current];
  if (!item) {
    app.innerHTML = `
      <div class="section">
        <div class="quiz-start">
          <div class="quiz-start-card">
            <h2>Quiz error</h2>
            <p>Something went wrong. Please refresh and try again.</p>
            <button class="btn-primary" onclick="go('quiz')">Restart Quiz</button>
          </div>
        </div>
      </div>
    `;
    return;
  }
  const progress = Math.round((q.current / state.questions.length) * 100);

  app.innerHTML = `
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
  if (!state.questions.length) {
    toast("danger", "No questions available. Please contact the admin.");
    return;
  }
  const name = $("quizName").value.trim();
  const section = $("quizSection").value.trim();
  if (!name) return toast("danger", "Please enter your name.");
  if (!section) return toast("danger", "Please enter your section.");
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
  const feedback = $("quizFeedback");

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
    q.result = {
      score: data.score, total: data.total,
      percentage: data.percentage, duration, badge: data.badge
    };
    q.finished = true;

    fetch(`${API}/api/quiz/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: q.name, section: q.section,
        score: data.score, total: data.total, duration
      })
    }).catch(() => {});

    renderQuiz();
  } catch (err) { toast("danger", "Could not check answers: " + err.message); }
}

async function viewLeaderboard() {
  const app = $("app");
  app.innerHTML = `
    <div class="section">
      <h1 class="page-title">Leaderboard</h1>
      <p class="page-sub">Top 20 scores — auto-refreshes every 15 seconds.</p>
      <div id="lbBody" class="leaderboard">Loading…</div>
      <div style="text-align:center;margin-top:30px;">
        <button class="btn-outline" style="color:var(--primary);border-color:var(--primary);" onclick="go('quiz')">Take Quiz Again</button>
      </div>
    </div>
  `;
  await refreshLeaderboard();
  if (window.lbInterval) clearInterval(window.lbInterval);
  window.lbInterval = setInterval(refreshLeaderboard, 15000);
}

async function refreshLeaderboard() {
  const body = $("lbBody");
  if (!body) { if (window.lbInterval) clearInterval(window.lbInterval); return; }
  try {
    const res = await fetch(`${API}/api/quiz/leaderboard`);
    const data = await res.json();
    const list = data.leaderboard || [];
    if (!list.length) { body.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">No scores yet.</p>'; return; }
    body.innerHTML = `
      <table class="leaderboard-table">
        <thead><tr><th>#</th><th>Name</th><th>Section</th><th>Score</th><th>%</th><th>Badge</th></tr></thead>
        <tbody>
          ${list.map((s, i) => `
            <tr class="${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">
              <td class="rank">${i + 1}</td>
              <td>${esc(s.name)}</td>
              <td>${esc(s.section)}</td>
              <td>${s.score}/${s.total}</td>
              <td class="pct">${s.percentage}%</td>
              <td>${esc(s.badge || 'Learner')}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    body.innerHTML = '<p style="text-align:center;color:#b91c1c;padding:20px;">Failed to load.</p>';
  }
}

function renderNotFound() {
  return `
    <div class="notfound">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <button class="btn-primary" onclick="go('home')">Back to Home</button>
    </div>
  `;
}

function renderAdmin() {
  const app = $("app");
  if (!state.adminPass) {
    app.innerHTML = `
      <div class="section">
        <div class="admin-login">
          <h2>Admin Login</h2>
          <p>Enter the admin password to manage content.</p>
          <input type="password" id="adminPwd" placeholder="Admin password" onkeydown="if(event.key==='Enter')adminLogin()">
          <button onclick="adminLogin()">Log In</button>
        </div>
      </div>
    `;
    return;
  }
  app.innerHTML = `
    <div class="section">
      <div class="admin-wrap">
        <div class="admin-panel">
          <div class="admin-head">
            <h2>Content Manager</h2>
            <div class="admin-actions">
              <button class="admin-btn" onclick="adminLogout()">Log out</button>
            </div>
          </div>

          <div class="admin-form" id="articleForm">
            <h3 id="formTitle">New Article</h3>
            <div class="row">
              <div class="field"><label>Title</label><input id="fTitle"></div>
              <div class="field"><label>Tag</label><input id="fTag" placeholder="e.g. Climate"></div>
            </div>
            <div class="row">
              <div class="field"><label>Author</label><input id="fAuthor" value="Member 1"></div>
              <div class="field"><label>Read Time (min)</label><input id="fReadTime" type="number" value="5"></div>
            </div>
            <div class="field"><label>Hero Image URL</label><input id="fHeroImage" placeholder="https://..."></div>
            <div class="field"><label>Excerpt</label><textarea id="fExcerpt" style="min-height:80px;"></textarea></div>
            <div class="field"><label>Body (HTML allowed)</label><textarea id="fBody"></textarea></div>
            <div class="field"><label>References</label><textarea id="fReferences" style="min-height:80px;"></textarea></div>
            <div class="row">
              <div class="field"><label><input type="checkbox" id="fHeadline" style="width:auto;"> Make Headline</label></div>
              <div class="field"><label>Status</label>
                <select id="fStatus"><option value="published">Published</option><option value="draft">Draft</option></select>
              </div>
            </div>
            <div class="admin-form-actions">
              <button class="btn-primary" onclick="saveArticle()">Save</button>
              <button class="admin-btn" onclick="closeArticleForm()">Cancel</button>
            </div>
          </div>

          <div class="admin-head" style="margin-bottom:12px;">
            <h3 style="font-size:1.1rem;">Articles</h3>
            <button class="btn-primary" onclick="openArticleForm()">+ New Article</button>
          </div>
          <div class="admin-list" id="adminArticles">Loading…</div>
        </div>
      </div>
    </div>
  `;
  loadAdminArticles();
}

async function adminLogin() {
  const pwd = $("adminPwd").value;
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd })
    });
    if (!res.ok) throw new Error("Wrong password");
    state.adminPass = pwd;
    sessionStorage.setItem("sts_admin_pass", pwd);
    toast("success", "Logged in");
    renderAdmin();
  } catch (err) { toast("danger", err.message); }
}

function adminLogout() {
  state.adminPass = "";
  sessionStorage.removeItem("sts_admin_pass");
  renderAdmin();
}

async function loadAdminArticles() {
  const c = $("adminArticles");
  try {
    const res = await fetch(`${API}/api/admin/articles`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const list = data.articles || [];
    c.innerHTML = list.map(a => `
      <div class="admin-item">
        <div>
          <h4>${esc(a.title)} ${a.isHeadline ? '⭐' : ''} ${a.status === 'draft' ? '<small>(draft)</small>' : ''}</h4>
          <small>${esc(a.tag)} · By ${esc(a.author)} · ${a.views || 0} views</small>
        </div>
        <div class="admin-actions">
          <button class="admin-btn" onclick="editArticle('${a._id}')">Edit</button>
          <button class="admin-btn danger" onclick="deleteArticle('${a._id}')">Delete</button>
        </div>
      </div>
    `).join("") || '<p style="color:var(--muted);">No articles yet.</p>';
    window._adminArticles = list;
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

function openArticleForm() {
  state.editingArticleId = null;
  $("formTitle").textContent = "New Article";
  ["fTitle","fTag","fHeroImage","fExcerpt","fBody","fReferences"].forEach(id => $(id).value = "");
  $("fAuthor").value = "Member 1";
  $("fReadTime").value = "5";
  $("fHeadline").checked = false;
  $("fStatus").value = "published";
  $("articleForm").classList.add("show");
}

function closeArticleForm() {
  $("articleForm").classList.remove("show");
  state.editingArticleId = null;
}

function editArticle(id) {
  const a = (window._adminArticles || []).find(x => x._id === id);
  if (!a) return;
  state.editingArticleId = id;
  $("formTitle").textContent = "Edit Article";
  $("fTitle").value = a.title || "";
  $("fTag").value = a.tag || "";
  $("fAuthor").value = a.author || "";
  $("fReadTime").value = a.readTime || 5;
  $("fHeroImage").value = a.heroImage || "";
  $("fExcerpt").value = a.excerpt || "";
  $("fBody").value = a.body || "";
  $("fReferences").value = a.references || "";
  $("fHeadline").checked = !!a.isHeadline;
  $("fStatus").value = a.status || "published";
  $("articleForm").classList.add("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveArticle() {
  const body = {
    title: $("fTitle").value.trim(),
    tag: $("fTag").value.trim(),
    author: $("fAuthor").value.trim(),
    readTime: parseInt($("fReadTime").value) || 5,
    heroImage: $("fHeroImage").value.trim(),
    excerpt: $("fExcerpt").value.trim(),
    body: $("fBody").value,
    references: $("fReferences").value.trim(),
    isHeadline: $("fHeadline").checked,
    status: $("fStatus").value
  };
  if (!body.title) return toast("danger", "Title required");
  try {
    const url = state.editingArticleId
      ? `${API}/api/admin/articles/${state.editingArticleId}`
      : `${API}/api/admin/articles`;
    const method = state.editingArticleId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": state.adminPass },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", state.editingArticleId ? "Article updated" : "Article created");
    closeArticleForm();
    loadAdminArticles();
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function deleteArticle(id) {
  if (!confirm("Delete this article?")) return;
  try {
    const res = await fetch(`${API}/api/admin/articles/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Deleted");
    loadAdminArticles();
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

window.addEventListener("scroll", () => {
  const bar = $("progressBar");
  if (!bar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
  bar.style.width = pct + "%";
});

document.addEventListener("click", (e) => {
  const nav = $("mainNav");
  const menuBtn = document.querySelector(".menu-btn");
  if (nav && nav.classList.contains("open") && !nav.contains(e.target) && !(menuBtn && (menuBtn === e.target || menuBtn.contains(e.target)))) {
    nav.classList.remove("open");
  }
});

(async function init() {
  await loadData();
  render();
})();
