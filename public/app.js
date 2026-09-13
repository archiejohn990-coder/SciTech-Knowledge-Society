const API = "";
let state = {
  articles: [],
  staff: [],
  questions: [],
  ad: null,
  page: "home",
  activeArticleSlug: null,
  related: [],
  comments: [],
  filterTag: "",
  adminPass: sessionStorage.getItem("sts_admin_pass") || "",
  adminTab: "articles",
  editingArticleId: null,
  editingQuestionId: null,
  editingStaffId: null,
  adminArticles: [],
  adminQuestions: [],
  adminStaff: [],
  adminMessages: [],
  adminComments: [],
  adminSubscribers: [],
  adminAd: null,
  unreadCount: 0,
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

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
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
  applyTheme(localStorage.getItem("sts_theme") || "light");
})();

function go(page, slug) {
  state.page = page;
  if (slug) state.activeArticleSlug = slug;
  if (page === "quiz" && !state.quiz.startedAt) {
    state.quiz = { name: "", section: "", current: 0, answers: [], startedAt: 0, finished: false, result: null };
  }
  document.querySelectorAll(".main-nav a").forEach(a => a.classList.remove("active"));
  let navId = page === "article" ? "articles" : page;
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
      html += `<div class="search-section">Team</div>`;
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
    const [aRes, sRes, qRes, adRes] = await Promise.all([
      fetch(`${API}/api/articles`).then(r => r.json()),
      fetch(`${API}/api/staff`).then(r => r.json()),
      fetch(`${API}/api/quiz`).then(r => r.json()),
      fetch(`${API}/api/ad`).then(r => r.json())
    ]);
    state.articles = aRes.articles || [];
    state.staff = sRes.staff || [];
    state.questions = qRes.questions || [];
    state.ad = adRes.ad || null;
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
      ${renderAdCard()}
    </div>

    <div class="newsletter-box">
      <h3>Join the SciTech Newsletter</h3>
      <p>Weekly stories on science and technology.</p>
      <form class="newsletter-form" onsubmit="submitNewsletter(event)">
        <input type="email" id="newsletterEmail" placeholder="your@email.com" required>
        <button type="submit">Subscribe</button>
      </form>
    </div>
  `;
}

function renderAdCard() {
  const ad = state.ad;
  if (!ad || !ad.active) {
    return `
      <div class="ad-card" onclick="go('ad')">
        <div class="ad-tag">ADVERTISEMENT</div>
        <div class="ad-inner">
          <div class="ad-left">
            <h3>Advertisement</h3>
            <p class="ad-tagline">Coming Soon</p>
            <p class="ad-desc">Our sponsored content section is being prepared. Check back soon.</p>
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
    `;
  }

  return `
    <div class="ad-card" onclick="go('ad')">
      <div class="ad-tag">ADVERTISEMENT</div>
      <div class="ad-inner">
        <div class="ad-left">
          <h3>${esc(ad.title || "Sponsored")}</h3>
          ${ad.tagline ? `<p class="ad-tagline">${esc(ad.tagline)}</p>` : ""}
          ${ad.description ? `<p class="ad-desc">${esc(ad.description)}</p>` : ""}
          <button class="btn-outline">${esc(ad.buttonText || "Learn more")}</button>
        </div>
        <div class="ad-right">
          ${ad.image
            ? `<img src="${esc(ad.image)}" style="width:100%; max-width:240px; border-radius:16px;">`
            : `<div class="ad-device">
                 <div class="ad-pulse"></div>
                 <div class="ad-ring r1"></div>
                 <div class="ad-ring r2"></div>
                 <div class="ad-ring r3"></div>
                 <div class="ad-chip"></div>
               </div>`}
        </div>
      </div>
      <div class="ad-disclaimer">Paid sponsored content — read our editorial policy</div>
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
      <p class="page-sub">Stories on science and technology.</p>

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
  const ad = state.ad;
  if (!ad || !ad.active) {
    return `
      <div class="section">
        <div class="coming-soon">
          <div class="coming-soon-icon">📢</div>
          <div class="coming-soon-tag">Coming Soon</div>
          <h2>Advertisement</h2>
          <p>Our sponsored content section is currently being prepared. Please check back soon.</p>
          <button class="btn-primary" onclick="go('home')">Back to Home</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="section">
      <div class="ad-page">
        <div class="ad-page-tag">ADVERTISEMENT · SPONSORED</div>
        ${ad.image ? `<img class="ad-image" src="${esc(ad.image)}" alt="${esc(ad.title)}">` : `<div class="ad-placeholder-img">📢</div>`}
        <h1 class="ad-page-title">${esc(ad.title || "Sponsored")}</h1>
        ${ad.tagline ? `<p class="ad-page-tagline">${esc(ad.tagline)}</p>` : ""}
        <div class="ad-body-block">
          ${ad.description ? `<p style="line-height:1.8; font-size:1.05rem; white-space:pre-wrap;">${esc(ad.description)}</p>` : ""}
          <div style="text-align:center; margin-top:30px;">
            ${ad.buttonLink
              ? `<a class="ad-cta-btn" href="${esc(ad.buttonLink)}" target="_blank">${esc(ad.buttonText || "Learn more")}</a>`
              : `<button class="ad-cta-btn">${esc(ad.buttonText || "Learn more")}</button>`}
          </div>
        </div>
        <div class="ad-page-footer">
          <p><b>Disclaimer:</b> This is sponsored content. It is created for educational purposes as part of a Science, Technology & Society (STS) project.</p>
        </div>
      </div>
    </div>
  `;
}

function renderStaff() {
  return `
    <div class="section">
      <h1 class="page-title">Team Members</h1>
      <p class="page-sub">The team behind SciTech Knowledge.</p>
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
          <div class="field"><label>Your Name *</label><input id="contactName" required maxlength="80"></div>
          <div class="field"><label>Email *</label><input id="contactEmail" type="email" required maxlength="120"></div>
          <div class="field"><label>Subject</label><input id="contactSubject" maxlength="120"></div>
          <div class="field"><label>Message *</label><textarea id="contactMsg" required maxlength="2000"></textarea></div>
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
  const subject = $("contactSubject").value.trim();
  const message = $("contactMsg").value.trim();
  if (!name || !email || !message) { toast("danger", "Please fill in all required fields"); return; }
  try {
    const res = await fetch(`${API}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", "Message sent! We'll get back to you soon.");
    $("contactName").value = "";
    $("contactEmail").value = "";
    $("contactSubject").value = "";
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

  if (!state.questions.length) {
    app.innerHTML = `
      <div class="section">
        <div class="quiz-start">
          <div class="quiz-start-card">
            <h2>Quiz unavailable</h2>
            <p>No questions found in the database. Ask the admin to seed or add questions.</p>
            <button class="btn-primary" onclick="go('home')">Back to Home</button>
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
            <p>${state.questions.length} questions on science and technology. Enter your name and section to begin.</p>
            <div class="field"><label>Your Name</label><input id="quizName" placeholder="Juan Dela Cruz"></div>
            <div class="field"><label>Your Section</label><input id="quizSection" placeholder="BSIT 3-A"></div>
            <button class="btn-primary" onclick="startQuiz()">Start Quiz</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const item = state.questions[q.current];
  if (!item) { toast("danger", "Question not found."); go("quiz"); return; }
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
          <div class="quiz-type-badge">${item.type === "truefalse" ? "True / False" : "Multiple Choice"}</div>
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
  if (!state.questions.length) { toast("danger", "No questions available. Contact the admin."); return; }
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

          <div class="admin-tabs">
            <button class="admin-tab ${state.adminTab === 'articles' ? 'active' : ''}" onclick="switchAdminTab('articles')">
              📰 Articles <span class="tab-count" id="tabCountArticles">0</span>
            </button>
            <button class="admin-tab ${state.adminTab === 'questions' ? 'active' : ''}" onclick="switchAdminTab('questions')">
              ❓ Questions <span class="tab-count" id="tabCountQuestions">0</span>
            </button>
            <button class="admin-tab ${state.adminTab === 'staff' ? 'active' : ''}" onclick="switchAdminTab('staff')">
              👥 Team <span class="tab-count" id="tabCountStaff">0</span>
            </button>
            <button class="admin-tab ${state.adminTab === 'ad' ? 'active' : ''}" onclick="switchAdminTab('ad')">
              📢 Ad <span class="tab-count" id="tabCountAd">0</span>
            </button>
            <button class="admin-tab ${state.adminTab === 'messages' ? 'active' : ''}" onclick="switchAdminTab('messages')">
              ✉️ Messages <span class="count-badge hidden" id="tabCountMessages">0</span>
            </button>
            <button class="admin-tab ${state.adminTab === 'comments' ? 'active' : ''}" onclick="switchAdminTab('comments')">
              💬 Comments <span class="tab-count" id="tabCountComments">0</span>
            </button>
            <button class="admin-tab ${state.adminTab === 'subscribers' ? 'active' : ''}" onclick="switchAdminTab('subscribers')">
              📧 Subscribers <span class="tab-count" id="tabCountSubscribers">0</span>
            </button>
          </div>

          <div id="adminContent"></div>
        </div>
      </div>
    </div>
  `;
  renderAdminTab();
}

function switchAdminTab(tab) {
  state.adminTab = tab;
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  event.target.closest(".admin-tab").classList.add("active");
  renderAdminTab();
}

async function renderAdminTab() {
  const c = $("adminContent");
  if (!c) return;

  if (state.adminTab === "articles") {
    c.innerHTML = `
      <div class="admin-head" style="margin-bottom:12px;">
        <h3 style="font-size:1.1rem;">Articles</h3>
        <button class="btn-primary" onclick="openArticleForm()">+ New Article</button>
      </div>
      <div class="admin-form" id="articleForm">
        <h3 id="formTitle">New Article</h3>
        <div class="row">
          <div class="field"><label>Title</label><input id="fTitle"></div>
          <div class="field"><label>Tag</label><input id="fTag" placeholder="e.g. Climate"></div>
        </div>
        <div class="row">
          <div class="field"><label>Author</label><input id="fAuthor" value="Team"></div>
          <div class="field"><label>Read Time (min)</label><input id="fReadTime" type="number" value="5"></div>
        </div>
        <div class="field"><label>Hero Image URL</label><input id="fHeroImage" placeholder="https://..."></div>
        <div class="field"><label>Excerpt</label><textarea id="fExcerpt" class="short"></textarea></div>
        <div class="field"><label>Body (HTML allowed)</label><textarea id="fBody"></textarea></div>
        <div class="field"><label>References</label><textarea id="fReferences" class="short"></textarea></div>
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
      <div class="admin-list" id="adminArticles">Loading…</div>
    `;
    await loadAdminArticles();
  }

  else if (state.adminTab === "questions") {
    c.innerHTML = `
      <div class="admin-head" style="margin-bottom:12px;">
        <h3 style="font-size:1.1rem;">Quiz Questions</h3>
        <button class="btn-primary" onclick="openQuestionForm()">+ New Question</button>
      </div>
      <div class="admin-form" id="questionForm">
        <h3 id="qFormTitle">New Question</h3>
        <div class="field">
          <label>Question Type</label>
          <select id="qType" onchange="onQuestionTypeChange()">
            <option value="abcd">Multiple Choice (ABCD)</option>
            <option value="truefalse">True / False</option>
          </select>
        </div>
        <div class="field"><label>Question Text</label><textarea id="qText" class="short"></textarea></div>
        <div class="field">
          <label>Options (select the correct answer)</label>
          <div class="q-options-list" id="qOptionsList"></div>
        </div>
        <div class="field"><label>Explanation</label><textarea id="qExplanation" class="short"></textarea></div>
        <div class="field"><label>Order</label><input id="qOrder" type="number" value="99"></div>
        <div class="admin-form-actions">
          <button class="btn-primary" onclick="saveQuestion()">Save</button>
          <button class="admin-btn" onclick="closeQuestionForm()">Cancel</button>
        </div>
      </div>
      <div class="admin-list" id="adminQuestions">Loading…</div>
    `;
    await loadAdminQuestions();
  }

  else if (state.adminTab === "staff") {
    c.innerHTML = `
      <div class="admin-head" style="margin-bottom:12px;">
        <h3 style="font-size:1.1rem;">Team Members</h3>
        <button class="btn-primary" onclick="openStaffForm()">+ New Member</button>
      </div>
      <div class="admin-form" id="staffForm">
        <h3 id="sFormTitle">New Member</h3>
        <div class="row">
          <div class="field"><label>Name</label><input id="sName"></div>
          <div class="field"><label>Section</label><input id="sSection" placeholder="BSIT 3-A"></div>
        </div>
        <div class="field"><label>Role</label><input id="sRole" placeholder="Writer, Editor, Designer..."></div>
        <div class="field"><label>Bio</label><textarea id="sBio" class="short"></textarea></div>
        <div class="row">
          <div class="field"><label>Avatar URL (optional)</label><input id="sAvatar" placeholder="https://..."></div>
          <div class="field"><label>Order</label><input id="sOrder" type="number" value="99"></div>
        </div>
        <div class="admin-form-actions">
          <button class="btn-primary" onclick="saveStaff()">Save</button>
          <button class="admin-btn" onclick="closeStaffForm()">Cancel</button>
        </div>
      </div>
      <div class="admin-list" id="adminStaff">Loading…</div>
    `;
    await loadAdminStaff();
  }

  else if (state.adminTab === "ad") {
    c.innerHTML = `
      <div class="admin-head" style="margin-bottom:12px;">
        <h3 style="font-size:1.1rem;">Advertisement</h3>
      </div>
      <div class="admin-form show" id="adForm">
        <h3>Ad Content</h3>
        <div class="row">
          <div class="field"><label>Title</label><input id="adTitle" placeholder="e.g. NeuroLink Mini"></div>
          <div class="field"><label>Tagline</label><input id="adTagline" placeholder="e.g. Think. Connect. Belong."></div>
        </div>
        <div class="field"><label>Description</label><textarea id="adDescription" class="short"></textarea></div>
        <div class="row">
          <div class="field"><label>Button Text</label><input id="adButtonText" placeholder="Learn more"></div>
          <div class="field"><label>Button Link (optional)</label><input id="adButtonLink" placeholder="https://..."></div>
        </div>
        <div class="field"><label>Image URL (optional)</label><input id="adImage" placeholder="https://..."></div>
        <div class="field">
          <label><input type="checkbox" id="adActive" style="width:auto;"> Active (show on site)</label>
        </div>
        <div class="admin-form-actions">
          <button class="btn-primary" onclick="saveAd()">Save Ad</button>
          <button class="admin-btn danger" onclick="deleteAd()">Remove Ad</button>
        </div>
      </div>
    `;
    await loadAdminAd();
  }

  else if (state.adminTab === "messages") {
    c.innerHTML = `<div class="admin-list" id="adminMessages">Loading…</div>`;
    await loadAdminMessages();
  }

  else if (state.adminTab === "comments") {
    c.innerHTML = `<div class="admin-list" id="adminComments">Loading…</div>`;
    await loadAdminComments();
  }

  else if (state.adminTab === "subscribers") {
    c.innerHTML = `<div class="admin-list" id="adminSubscribers">Loading…</div>`;
    await loadAdminSubscribers();
  }
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
    state.adminArticles = list;
    const badge = $("tabCountArticles");
    if (badge) badge.textContent = list.length;
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
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

function openArticleForm() {
  state.editingArticleId = null;
  $("formTitle").textContent = "New Article";
  ["fTitle","fTag","fHeroImage","fExcerpt","fBody","fReferences"].forEach(id => $(id).value = "");
  $("fAuthor").value = "Team";
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
  const a = state.adminArticles.find(x => x._id === id);
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

async function loadAdminQuestions() {
  const c = $("adminQuestions");
  try {
    const res = await fetch(`${API}/api/admin/questions`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const list = data.questions || [];
    state.adminQuestions = list;
    const badge = $("tabCountQuestions");
    if (badge) badge.textContent = list.length;
    c.innerHTML = list.map(q => `
      <div class="admin-item">
        <div style="flex:1;">
          <h4>${esc(q.question)}</h4>
          <small>${q.type === 'truefalse' ? 'True/False' : 'Multiple Choice'} · Correct: ${esc(q.options[q.correctIndex] || '')}</small>
        </div>
        <div class="admin-actions">
          <button class="admin-btn" onclick="editQuestion('${q._id}')">Edit</button>
          <button class="admin-btn danger" onclick="deleteQuestion('${q._id}')">Delete</button>
        </div>
      </div>
    `).join("") || '<p style="color:var(--muted);">No questions yet.</p>';
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

function openQuestionForm() {
  state.editingQuestionId = null;
  $("qFormTitle").textContent = "New Question";
  $("qType").value = "abcd";
  $("qText").value = "";
  $("qExplanation").value = "";
  $("qOrder").value = "99";
  renderQuestionOptions([]);
  $("questionForm").classList.add("show");
}

function closeQuestionForm() {
  $("questionForm").classList.remove("show");
  state.editingQuestionId = null;
}

function onQuestionTypeChange() {
  const type = $("qType").value;
  if (type === "truefalse") {
    renderQuestionOptions(["True", "False"], 0);
  } else {
    renderQuestionOptions(["", "", "", ""], 0);
  }
}

function renderQuestionOptions(values, correctIndex = 0) {
  const wrap = $("qOptionsList");
  if (!wrap) return;
  const type = $("qType").value;
  const count = type === "truefalse" ? 2 : 4;
  const opts = values.length === count ? values : (type === "truefalse" ? ["True", "False"] : ["", "", "", ""]);
  let html = "";
  for (let i = 0; i < count; i++) {
    const readOnly = type === "truefalse" ? "readonly" : "";
    html += `
      <div class="q-option-row">
        <input type="radio" name="qCorrect" value="${i}" ${i === correctIndex ? "checked" : ""}>
        <input type="text" class="q-opt-input" data-idx="${i}" value="${esc(opts[i] || "")}" placeholder="Option ${String.fromCharCode(65 + i)}" ${readOnly}>
      </div>
    `;
  }
  wrap.innerHTML = html;
}

function editQuestion(id) {
  const q = state.adminQuestions.find(x => x._id === id);
  if (!q) return;
  state.editingQuestionId = id;
  $("qFormTitle").textContent = "Edit Question";
  $("qType").value = q.type || "abcd";
  $("qText").value = q.question || "";
  $("qExplanation").value = q.explanation || "";
  $("qOrder").value = q.order || 99;
  renderQuestionOptions(q.options || [], q.correctIndex || 0);
  $("questionForm").classList.add("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveQuestion() {
  const type = $("qType").value;
  const question = $("qText").value.trim();
  const explanation = $("qExplanation").value.trim();
  const order = parseInt($("qOrder").value) || 99;

  if (!question) return toast("danger", "Question text required");

  const optionInputs = document.querySelectorAll(".q-opt-input");
  const options = Array.from(optionInputs).map(inp => inp.value.trim());

  const checked = document.querySelector('input[name="qCorrect"]:checked');
  if (!checked) return toast("danger", "Select the correct answer");
  const correctIndex = parseInt(checked.value);

  if (options.some(o => !o)) return toast("danger", "All options must be filled");

  const body = { type, question, options, correctIndex, explanation, order };

  try {
    const url = state.editingQuestionId
      ? `${API}/api/admin/questions/${state.editingQuestionId}`
      : `${API}/api/admin/questions`;
    const method = state.editingQuestionId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": state.adminPass },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", state.editingQuestionId ? "Question updated" : "Question created");
    closeQuestionForm();
    loadAdminQuestions();
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;
  try {
    const res = await fetch(`${API}/api/admin/questions/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Deleted");
    loadAdminQuestions();
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function loadAdminStaff() {
  const c = $("adminStaff");
  try {
    const res = await fetch(`${API}/api/admin/staff`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const list = data.staff || [];
    state.adminStaff = list;
    const badge = $("tabCountStaff");
    if (badge) badge.textContent = list.length;
    c.innerHTML = list.map(m => `
      <div class="admin-item">
        <div style="display:flex; gap:12px; align-items:center; flex:1;">
          <img src="${esc(m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&size=80&background=0ea5e9&color=fff`)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
          <div>
            <h4>${esc(m.name)}</h4>
            <small>${esc(m.role)} · ${esc(m.section)}</small>
          </div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn" onclick="editStaff('${m._id}')">Edit</button>
          <button class="admin-btn danger" onclick="deleteStaff('${m._id}')">Delete</button>
        </div>
      </div>
    `).join("") || '<p style="color:var(--muted);">No team members yet.</p>';
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

function openStaffForm() {
  state.editingStaffId = null;
  $("sFormTitle").textContent = "New Member";
  ["sName", "sSection", "sRole", "sBio", "sAvatar"].forEach(id => $(id).value = "");
  $("sOrder").value = "99";
  $("staffForm").classList.add("show");
}

function closeStaffForm() {
  $("staffForm").classList.remove("show");
  state.editingStaffId = null;
}

function editStaff(id) {
  const m = state.adminStaff.find(x => x._id === id);
  if (!m) return;
  state.editingStaffId = id;
  $("sFormTitle").textContent = "Edit Member";
  $("sName").value = m.name || "";
  $("sSection").value = m.section || "";
  $("sRole").value = m.role || "";
  $("sBio").value = m.bio || "";
  $("sAvatar").value = m.avatar || "";
  $("sOrder").value = m.order || 99;
  $("staffForm").classList.add("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveStaff() {
  const body = {
    name: $("sName").value.trim(),
    section: $("sSection").value.trim(),
    role: $("sRole").value.trim(),
    bio: $("sBio").value.trim(),
    avatar: $("sAvatar").value.trim(),
    order: parseInt($("sOrder").value) || 99
  };
  if (!body.name) return toast("danger", "Name required");
  if (!body.role) return toast("danger", "Role required");
  try {
    const url = state.editingStaffId
      ? `${API}/api/admin/staff/${state.editingStaffId}`
      : `${API}/api/admin/staff`;
    const method = state.editingStaffId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": state.adminPass },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    toast("success", state.editingStaffId ? "Member updated" : "Member added");
    closeStaffForm();
    loadAdminStaff();
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function deleteStaff(id) {
  if (!confirm("Delete this member?")) return;
  try {
    const res = await fetch(`${API}/api/admin/staff/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Deleted");
    loadAdminStaff();
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function loadAdminAd() {
  try {
    const res = await fetch(`${API}/api/admin/ad`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const ad = data.ad || {};
    state.adminAd = ad;
    const badge = $("tabCountAd");
    if (badge) badge.textContent = ad.active ? "ON" : "OFF";
    if ($("adTitle")) $("adTitle").value = ad.title || "";
    if ($("adTagline")) $("adTagline").value = ad.tagline || "";
    if ($("adDescription")) $("adDescription").value = ad.description || "";
    if ($("adButtonText")) $("adButtonText").value = ad.buttonText || "";
    if ($("adButtonLink")) $("adButtonLink").value = ad.buttonLink || "";
    if ($("adImage")) $("adImage").value = ad.image || "";
    if ($("adActive")) $("adActive").checked = !!ad.active;
  } catch (err) {
    toast("danger", err.message);
  }
}

async function saveAd() {
  const body = {
    title: $("adTitle").value.trim(),
    tagline: $("adTagline").value.trim(),
    description: $("adDescription").value.trim(),
    buttonText: $("adButtonText").value.trim(),
    buttonLink: $("adButtonLink").value.trim(),
    image: $("adImage").value.trim(),
    active: $("adActive").checked
  };
  try {
    const res = await fetch(`${API}/api/admin/ad`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": state.adminPass },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    state.adminAd = data.ad;
    toast("success", "Ad saved");
    const badge = $("tabCountAd");
    if (badge) badge.textContent = data.ad.active ? "ON" : "OFF";
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function deleteAd() {
  if (!confirm("Remove the advertisement?")) return;
  try {
    const res = await fetch(`${API}/api/admin/ad`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Ad removed");
    state.adminAd = null;
    ["adTitle","adTagline","adDescription","adButtonText","adButtonLink","adImage"].forEach(id => {
      if ($(id)) $(id).value = "";
    });
    if ($("adActive")) $("adActive").checked = false;
    const badge = $("tabCountAd");
    if (badge) badge.textContent = "OFF";
    await loadData();
  } catch (err) { toast("danger", err.message); }
}

async function loadAdminMessages() {
  const c = $("adminMessages");
  try {
    const res = await fetch(`${API}/api/admin/messages`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const list = data.messages || [];
    state.adminMessages = list;
    const unread = list.filter(m => !m.read).length;
    const badge = $("tabCountMessages");
    if (badge) {
      badge.textContent = unread;
      badge.classList.toggle("hidden", unread === 0);
    }
    c.innerHTML = list.map(m => `
      <div class="admin-item ${m.read ? 'read' : 'unread'}">
        <div style="flex:1;">
          <h4>${esc(m.subject || '(no subject)')}</h4>
          <small><b>${esc(m.name)}</b> · ${esc(m.email)} · ${timeAgo(m.createdAt)}</small>
          <div class="message-preview">${esc(m.message)}</div>
        </div>
        <div class="admin-actions">
          ${!m.read ? `<button class="admin-btn primary" onclick="markMessageRead('${m._id}')">Mark read</button>` : ''}
          <a class="admin-btn" href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject || 'Your message')}">Reply</a>
          <button class="admin-btn danger" onclick="deleteMessage('${m._id}')">Delete</button>
        </div>
      </div>
    `).join("") || '<p style="color:var(--muted);">No messages yet.</p>';
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

async function markMessageRead(id) {
  try {
    const res = await fetch(`${API}/api/admin/messages/${id}/read`, {
      method: "PUT",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Marked as read");
    loadAdminMessages();
  } catch (err) { toast("danger", err.message); }
}

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  try {
    const res = await fetch(`${API}/api/admin/messages/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Deleted");
    loadAdminMessages();
  } catch (err) { toast("danger", err.message); }
}

async function loadAdminComments() {
  const c = $("adminComments");
  try {
    const res = await fetch(`${API}/api/admin/comments`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const list = data.comments || [];
    state.adminComments = list;
    const badge = $("tabCountComments");
    if (badge) badge.textContent = list.length;
    c.innerHTML = list.map(m => `
      <div class="admin-item">
        <div style="flex:1;">
          <h4>${esc(m.name || 'Anonymous')} <small style="font-weight:normal;">on "${esc(m.articleSlug)}"</small></h4>
          <small>${timeAgo(m.createdAt)}</small>
          <div class="message-preview">${esc(m.text)}</div>
        </div>
        <div class="admin-actions">
          <button class="admin-btn danger" onclick="deleteCommentAdmin('${m._id}')">Delete</button>
        </div>
      </div>
    `).join("") || '<p style="color:var(--muted);">No comments yet.</p>';
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

async function deleteCommentAdmin(id) {
  if (!confirm("Delete this comment?")) return;
  try {
    const res = await fetch(`${API}/api/admin/comments/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Deleted");
    loadAdminComments();
  } catch (err) { toast("danger", err.message); }
}

async function loadAdminSubscribers() {
  const c = $("adminSubscribers");
  try {
    const res = await fetch(`${API}/api/admin/newsletter`, {
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Session expired");
    const data = await res.json();
    const list = data.subscribers || [];
    state.adminSubscribers = list;
    const badge = $("tabCountSubscribers");
    if (badge) badge.textContent = list.length;
    c.innerHTML = list.map(s => `
      <div class="admin-item">
        <div style="flex:1;">
          <h4>${esc(s.email)}</h4>
          <small>Subscribed ${timeAgo(s.createdAt)}</small>
        </div>
        <div class="admin-actions">
          <button class="admin-btn danger" onclick="deleteSubscriber('${s._id}')">Remove</button>
        </div>
      </div>
    `).join("") || '<p style="color:var(--muted);">No subscribers yet.</p>';
  } catch (err) {
    c.innerHTML = `<p style="color:#b91c1c;">${esc(err.message)}</p>`;
  }
}

async function deleteSubscriber(id) {
  if (!confirm("Remove this subscriber?")) return;
  try {
    const res = await fetch(`${API}/api/admin/newsletter/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": state.adminPass }
    });
    if (!res.ok) throw new Error("Failed");
    toast("success", "Removed");
    loadAdminSubscribers();
  } catch (err) { toast("danger", err.message); }
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
