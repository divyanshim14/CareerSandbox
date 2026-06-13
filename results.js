// ── Results Page JS v3 ──────────────────────────────────────
// Career Discovery Report — warm explorer theme, light mode, pastel canvas radar

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

// Mobile nav
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
  });
}

// ── Load Data ─────────────────────────────────────────────────
let profile    = window.CS ? CS.loadProfile() : null;
let simData    = null;
let careerScores = window.CS ? CS.loadCareerScores() : {};
let career     = 'ux';
let elapsed    = 0;

// Try sessionStorage first (most recent sim)
try {
  const raw = sessionStorage.getItem('csSimData');
  if (raw) simData = JSON.parse(raw);
  career  = sessionStorage.getItem('csSimCareer') || sessionStorage.getItem('cs_career') || 'ux';
  elapsed = parseInt(sessionStorage.getItem('csElapsed') || '0');
} catch { /* ignore */ }

// Try localStorage fallback
if (!simData && window.CS) {
  const saved = CS.loadSimScore(career);
  if (saved) { simData = { scores: saved.scores, tasks: saved.tasksData || {} }; elapsed = saved.elapsedSeconds || 0; }
}

// Demo fallback
if (!simData || !simData.scores) {
  simData = { scores: { engagement: 74, confidence: 68, exploration: 82 }, tasks: {} };
}

const scores = simData.scores || { engagement: 65, confidence: 60, exploration: 70 };

// ── Helpers ───────────────────────────────────────────────────
function showToast(msg, icon = '✨') {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-msg').textContent = msg;
  t.querySelector('.toast-icon').textContent = icon;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function animateNum(el, target, suffix = '') {
  if (!el) return;
  let start = 0;
  const dur = 1600;
  const t0  = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  };
  requestAnimationFrame(tick);
}

function setProgressBar(id, pct) {
  const el = document.getElementById(id);
  if (el) setTimeout(() => { el.style.width = pct + '%'; }, 400);
}

// ── Populate Name ─────────────────────────────────────────────
const firstName = (profile?.name || 'Explorer').split(' ')[0];
const nameEl = document.getElementById('result-name');
if (nameEl) nameEl.textContent = firstName;

document.title = `${firstName}'s Career Discovery Report – CareerSandbox`;

// ── Score Cards ───────────────────────────────────────────────
setTimeout(() => {
  animateNum(document.getElementById('sc-eng-num'),  scores.engagement);
  animateNum(document.getElementById('sc-conf-num'), scores.confidence);
  animateNum(document.getElementById('sc-expl-num'), scores.exploration);
  setProgressBar('pf-eng',  scores.engagement);
  setProgressBar('pf-conf', scores.confidence);
  setProgressBar('pf-expl', scores.exploration);
}, 500);

// ── Score contextual labels ────────────────────────────────────
function scoreLabel(s) {
  if (s >= 80) return { label: 'Strong', cls: 'wellbeing-good' };
  if (s >= 60) return { label: 'Solid',  cls: 'wellbeing-good' };
  if (s >= 40) return { label: 'Growing', cls: 'wellbeing-medium' };
  return { label: 'Emerging', cls: '' };
}

// ── Career Affinity Bars ──────────────────────────────────────
async function loadAffinities() {
  let affinities = { ux: 50, fe: 50, pm: 50, da: 48, cs: 46, entrepreneurship: 48, aiml: 44 };

  if (window.CS) {
    const result = await CS.getRecommendations();
    if (result && result.scores) affinities = result.scores;
  }

  // Boost simulated career
  affinities[career] = Math.min(98, (affinities[career] || 50) + Math.floor(scores.confidence / 5));

  const careers = [
    { id: 'ux', label: 'UI/UX Design', emoji: '🎨', color: 'var(--career-ux)' },
    { id: 'fe', label: 'Frontend Dev', emoji: '💻', color: 'var(--career-fe)' },
    { id: 'pm', label: 'Product Management', emoji: '📋', color: 'var(--career-pm)' },
    { id: 'da', label: 'Data Analytics', emoji: '📊', color: 'var(--career-da)' },
    { id: 'cs', label: 'Content Strategy', emoji: '✍️', color: 'var(--career-cs)' },
    { id: 'entrepreneurship', label: 'Entrepreneurship', emoji: '🚀', color: 'var(--career-ent)' },
    { id: 'aiml', label: 'AI/ML', emoji: '🤖', color: 'var(--career-aiml)' },
  ];

  // Sort by score
  const sorted = [...careers].sort((a, b) => (affinities[b.id] || 0) - (affinities[a.id] || 0));

  const container = document.getElementById('career-bars-container');
  if (!container) return;
  container.innerHTML = '';

  sorted.forEach((c, i) => {
    const pct = affinities[c.id] || 50;
    const isSimmed = c.id === career;
    const div = document.createElement('div');
    div.className = 'career-bar-item';
    div.style.animationDelay = `${i * 0.07}s`;
    div.innerHTML = `
      <div class="cbar-header">
        <span class="cbar-emoji">${c.emoji}</span>
        <span class="cbar-name">${c.label}</span>
        ${isSimmed ? '<span class="cbar-simmed">Simulated ✓</span>' : ''}
        <span class="cbar-pct" id="cpct-${c.id}">—</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="cfill-${c.id}" style="width:0%;background:linear-gradient(90deg,${c.color},${c.color}aa)"></div>
      </div>
    `;
    container.appendChild(div);

    setTimeout(() => {
      animateNum(document.getElementById(`cpct-${c.id}`), pct, '%');
      const fillEl = document.getElementById(`cfill-${c.id}`);
      if (fillEl) fillEl.style.width = pct + '%';
    }, 600 + i * 80);
  });
}

loadAffinities();

// ── Radar Chart ────────────────────────────────────────────────
function drawRadar() {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx  = canvas.width / 2;
  const cy  = canvas.height / 2;
  const r   = Math.min(cx, cy) - 45;
  const n   = 6;

  const labels = ['Design\nThinking', 'Analytical', 'Communication', 'Technical', 'Strategic', 'Creative'];
  const values = [
    Math.min(1, (scores.engagement / 100 + (career === 'ux' ? 0.2 : 0)) * 0.85),
    Math.min(1, (scores.confidence / 100 + (career === 'da' || career === 'fe' ? 0.2 : 0)) * 0.85),
    Math.min(1, (scores.exploration / 100 + (career === 'cs' || career === 'pm' ? 0.2 : 0)) * 0.85),
    Math.min(1, (scores.confidence / 100 + (career === 'fe' || career === 'aiml' ? 0.2 : 0)) * 0.8),
    Math.min(1, (scores.engagement / 100 + (career === 'pm' || career === 'entrepreneurship' ? 0.2 : 0)) * 0.8),
    Math.min(1, (scores.exploration / 100 + (career === 'ux' || career === 'cs' ? 0.2 : 0)) * 0.85),
  ].map(v => Math.max(0.15, Math.min(0.95, v)));

  const getPoint = (i, val) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle) };
  };
  const getBase = (i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const getLabelPoint = (i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    return { x: cx + (r + 28) * Math.cos(angle), y: cy + (r + 28) * Math.sin(angle) };
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background fill (cream)
  ctx.fillStyle = '#FAFAF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid rings — soft lavender
  [0.25, 0.5, 0.75, 1.0].forEach(ring => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = { x: cx + r * ring * Math.cos((Math.PI * 2 * i / n) - Math.PI / 2), y: cy + r * ring * Math.sin((Math.PI * 2 * i / n) - Math.PI / 2) };
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 1.0 ? 'rgba(155,143,212,0.25)' : 'rgba(155,143,212,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Axis lines — soft lavender
  for (let i = 0; i < n; i++) {
    const p = getBase(i);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(155,143,212,0.15)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // Data fill — pastel lavender/rose gradient
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, values[i]);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, 'rgba(155,143,212,0.3)');
  grad.addColorStop(1, 'rgba(244,167,185,0.2)');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = '#9B8FD4'; ctx.lineWidth = 2; ctx.stroke();

  // Dots — lavender with white stroke
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, values[i]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#9B8FD4'; ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
  }

  // Labels — ink color
  ctx.font = '600 10px Inter, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const lp = getLabelPoint(i);
    ctx.fillStyle = '#5B5778';
    const lines = labels[i].split('\n');
    lines.forEach((line, j) => {
      ctx.fillText(line, lp.x, lp.y + (j - (lines.length - 1) / 2) * 13);
    });
  }
}

setTimeout(drawRadar, 500);

// ── AI Insights ────────────────────────────────────────────────
const insightsDB = {
  ux: [
    { icon: '🎨', text: '<strong>Design thinking tendency noticed.</strong> You engaged with visual comparison tasks with deliberate intent. In design work, that kind of measured consideration leads to more empathetic, user-centered outcomes.' },
    { icon: '🔍', text: '<strong>Attention to detail is a signal.</strong> How you approached the accessibility audit — spotting low-contrast text and missing affordances — reflects a natural instinct for usability that strong UX designers develop.' },
    { icon: '⚡', text: '<strong>Your engagement was consistent throughout.</strong> You maintained focus across all three design tasks, which suggests genuine curiosity in this domain rather than surface-level interest.' },
    { icon: '🪞', text: '<strong>Observation:</strong> Your interaction choices leaned toward user empathy. This mirrors what separates average from great UI/UX work — keeping the human at the centre of every decision.' },
  ],
  pm: [
    { icon: '📋', text: '<strong>Prioritization instinct detected.</strong> The features you selected reveal an understanding of urgency vs. importance — a core PM mental model. You showed willingness to say no to protect capacity.' },
    { icon: '📊', text: '<strong>Metrics thinking observed.</strong> Your metric selections suggest you understand the difference between vanity metrics (app rating, social mentions) and actionable signals directly tied to the fix.' },
    { icon: '⚖️', text: '<strong>Trade-off comfort.</strong> You demonstrated discipline around scope — focusing on the highest-impact items rather than trying to do everything. That is rare and valuable in product thinking.' },
    { icon: '🪞', text: '<strong>Observation:</strong> PMs who can justify decisions clearly are rare. Your written explanations suggest reasoning before deciding — a discipline that compounds over time.' },
  ],
  fe: [
    { icon: '💻', text: '<strong>Pattern recognition in code.</strong> Spotting syntax and semantic bugs requires a specific vigilance that many developers don\'t develop until years in. You showed this across multiple code scenarios.' },
    { icon: '🛠️', text: '<strong>Practical improvement instinct.</strong> Your CSS improvement choices leaned toward usability and accessibility — font sizes, padding, transitions. That\'s the right lens for frontend work.' },
    { icon: '🔎', text: '<strong>Observation:</strong> Frontend devs who understand *why* something breaks (not just that it does) write more resilient code. Your debugging approach suggests you think about root cause.' },
    { icon: '🪞', text: '<strong>User-aware technical thinking.</strong> Several of your decisions connected code choices to user impact — a mindset that separates great frontend developers from technically proficient but user-blind ones.' },
  ],
  da: [
    { icon: '📊', text: '<strong>Critical data reasoning detected.</strong> You showed instinct for questioning visualizations, not just reading them. That\'s the foundation of good data analysis — always ask "what is this chart trying to hide?"' },
    { icon: '🔍', text: '<strong>Funnel analysis thinking.</strong> Your focus on the right drop-off points (not just the biggest numbers) shows analytical maturity. Good analysts know where to look, not just how to read.' },
    { icon: '💡', text: '<strong>Observation:</strong> You recognized that data without context is dangerous. Asking "what else could explain this?" before drawing conclusions is exactly the analyst\'s responsibility.' },
    { icon: '🪞', text: '<strong>Pattern-spotting curiosity.</strong> Your engagement with the data tasks suggests genuine curiosity about what numbers mean — an intrinsic motivator that data analysts need to sustain the work.' },
  ],
  cs: [
    { icon: '✍️', text: '<strong>Voice sensitivity detected.</strong> You evaluated headlines not just for clarity but for emotional register — whether they sounded human, not corporate. That\'s a content strategist\'s core skill.' },
    { icon: '📖', text: '<strong>Audience empathy observed.</strong> Your choices consistently centered the reader\'s mental state — what they\'re feeling, what they\'ve tried before, what would make them believe. That\'s empathetic writing.' },
    { icon: '💡', text: '<strong>Observation:</strong> Specificity, not cleverness, drives content performance. You demonstrated understanding that concrete details ("6 months", "exactly how") outperform abstract promises.' },
    { icon: '🪞', text: '<strong>Strategic instinct.</strong> Content strategy is the intersection of brand, audience, and business goals. Your choices showed awareness of all three — not just "which sounds better".' },
  ],
  entrepreneurship: [
    { icon: '🚀', text: '<strong>Validation thinking over confirmation bias.</strong> You selected questions that probe real behavior ("what did you do yesterday?") over hypotheticals ("would you pay for this?"). That\'s the Mom Test in practice.' },
    { icon: '⚖️', text: '<strong>Resource allocation instinct.</strong> How you divided the startup budget reveals your theory of growth — where you see the highest leverage, and what you\'re willing to sacrifice.' },
    { icon: '💡', text: '<strong>Observation:</strong> Entrepreneurs who kill bad ideas early fail cheaply. Your approach to validation showed preference for learning over assuming — a mindset that protects limited resources.' },
    { icon: '🪞', text: '<strong>First-principles thinking.</strong> You questioned assumptions rather than accepting the premise of the idea uncritically. That skeptical lens is what separates founders who learn from those who burn through capital.' },
  ],
  aiml: [
    { icon: '🤖', text: '<strong>Data labeling precision.</strong> Your sentiment labels revealed awareness that human language is often ambiguous — neither clearly positive nor clearly negative. Good labelers know the difference.' },
    { icon: '⚧️', text: '<strong>Bias identification instinct.</strong> Recognizing that a 23% systematic gender gap in identical qualifications represents bias (not merit) demonstrates critical ethical awareness in ML systems.' },
    { icon: '💡', text: '<strong>Observation:</strong> AI/ML is not just technical — it\'s deeply ethical. You showed awareness that your decisions as a labeler, evaluator, or engineer directly become model behavior at scale.' },
    { icon: '🪞', text: '<strong>Systems thinking.</strong> Your engagement with AI tasks suggests comfort with ambiguity and edge cases — essential for anyone working at the boundary of human judgment and machine behavior.' },
  ],
};

function loadInsights() {
  const list = document.getElementById('insights-list');
  if (!list) return;
  const items = insightsDB[career] || insightsDB.ux;
  list.innerHTML = '';
  items.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'insight-item';
    div.style.animationDelay = `${0.1 + i * 0.1}s`;
    div.innerHTML = `<div class="insight-bullet">${item.icon}</div><div class="insight-text">${item.text}</div>`;
    list.appendChild(div);
  });
}
loadInsights();

// ── Wellbeing / Career Clarity ─────────────────────────────────
async function loadWellbeing() {
  let wb;
  if (window.CS) {
    const dash = await CS.getDashboardData();
    wb = dash.wellbeing;
  }
  if (!wb) {
    const tried = Object.keys(careerScores).length;
    const avgConf = Object.values(careerScores).length
      ? Math.round(Object.values(careerScores).reduce((a, b) => a + b, 0) / Object.values(careerScores).length) : 0;
    wb = {
      clarityScore: tried === 1 ? 85 : tried === 2 ? 70 : tried >= 4 ? 35 : 55,
      confidenceTrend: avgConf > 65 ? 'growing' : avgConf > 40 ? 'steady' : 'building',
      explorationFatigue: tried >= 4 ? 'high' : tried >= 3 ? 'medium' : 'low',
      careersTried: tried || 1,
      focusRecommendation: tried >= 3
        ? `You've explored ${tried} careers. Consider focusing more deeply on your top 2.`
        : 'You\'re exploring at a healthy pace. Keep going!',
      avgConfidence: avgConf,
    };
  }

  // Populate UI
  const clarityEl = document.getElementById('wb-clarity-score');
  if (clarityEl) {
    animateNum(clarityEl, wb.clarityScore, '/100');
    setProgressBar('wb-clarity-bar', wb.clarityScore);
  }

  const trendEl = document.getElementById('wb-confidence-trend');
  if (trendEl) {
    trendEl.textContent = wb.confidenceTrend.charAt(0).toUpperCase() + wb.confidenceTrend.slice(1);
    trendEl.className = `wb-trend-val ${wb.confidenceTrend === 'growing' ? 'wellbeing-good' : wb.confidenceTrend === 'steady' ? 'wellbeing-medium' : ''}`;
  }

  const fatigueEl = document.getElementById('wb-fatigue');
  if (fatigueEl) {
    fatigueEl.textContent = wb.explorationFatigue === 'low' ? '✅ Healthy' : wb.explorationFatigue === 'medium' ? '⚠️ Moderate' : '🔴 High';
    fatigueEl.className = `wb-fatigue-val ${wb.explorationFatigue === 'high' ? 'wellbeing-high' : wb.explorationFatigue === 'medium' ? 'wellbeing-medium' : 'wellbeing-good'}`;
  }

  const focusEl = document.getElementById('wb-focus-rec');
  if (focusEl) focusEl.textContent = wb.focusRecommendation;

  const triedEl = document.getElementById('wb-careers-tried');
  if (triedEl) triedEl.textContent = `${wb.careersTried} career${wb.careersTried !== 1 ? 's' : ''} explored`;
}

loadWellbeing();

// ── Session Summary ────────────────────────────────────────────
const careerNames = {
  ux: 'UI/UX Design', pm: 'Product Management', fe: 'Frontend Development',
  da: 'Data Analytics', cs: 'Content Strategy', entrepreneurship: 'Entrepreneurship', aiml: 'AI/ML Exploration'
};

const sumCareer = document.getElementById('sum-career');
if (sumCareer) sumCareer.textContent = careerNames[career] || career.toUpperCase();

const sumTime = document.getElementById('sum-time');
if (sumTime) {
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  sumTime.textContent = elapsed > 0 ? `${mins}m ${secs}s` : 'Demo mode';
}

const sumTasks = document.getElementById('sum-tasks');
const taskCount = Object.keys(simData.tasks || {}).length;
const totalTasks = { ux: 3, pm: 2, fe: 2, da: 2, cs: 2, entrepreneurship: 2, aiml: 2 };
if (sumTasks) sumTasks.textContent = `${taskCount}/${totalTasks[career] || 2}`;

const sumDiff = document.getElementById('sum-difficulty');
if (sumDiff) {
  const diff = window.CS ? CS.getDifficulty() : 'beginner';
  sumDiff.innerHTML = `<span class="diff-badge diff-${diff}">${diff.charAt(0).toUpperCase() + diff.slice(1)}</span>`;
}

const avgScore = Math.round((scores.engagement + scores.confidence + scores.exploration) / 3);
let rank = 'Explorer';
if (avgScore >= 85) rank = '🏆 Trailblazer';
else if (avgScore >= 70) rank = '🔭 Investigator';
else if (avgScore >= 55) rank = '💡 Curious Mind';
else rank = '🌱 Beginner';

const sumRank = document.getElementById('sum-rank');
if (sumRank) sumRank.textContent = rank;

// ── Score context messages ─────────────────────────────────────
const engCtx  = document.getElementById('sc-eng-ctx');
const confCtx = document.getElementById('sc-conf-ctx');
const explCtx = document.getElementById('sc-expl-ctx');

if (engCtx) {
  const time = elapsed > 60 ? Math.floor(elapsed / 60) : null;
  engCtx.textContent = time
    ? `You spent ${time}m+ actively working through tasks — that's genuine engagement.`
    : 'Based on your task completion and interaction patterns.';
}

if (confCtx) {
  const taskT = simData.tasks || {};
  const bugCount = taskT.feT1?.bugsFound || taskT.daT1?.choice === 'da-chart-2' && 1 || 0;
  confCtx.textContent = scores.confidence > 70
    ? `Your decisions aligned well with established best practices.`
    : 'Your reasoning showed thoughtful consideration, even where approaches differed.';
}

if (explCtx) {
  explCtx.textContent = scores.exploration > 70
    ? `You explored multiple angles and went beyond surface-level responses.`
    : 'You engaged with the core tasks thoughtfully.';
}

// ── API Status ─────────────────────────────────────────────────
async function checkApi() {
  if (!window.CS) return;
  const online = await CS.isApiAvailable();
  const badge = document.getElementById('api-badge');
  const text  = document.getElementById('api-badge-text');
  if (!badge) return;
  badge.classList.toggle('online', online);
  badge.classList.toggle('offline', !online);
  if (text) text.textContent = online ? 'API Connected' : 'Offline mode';
}

checkApi();

// ── Welcome toast ──────────────────────────────────────────────
setTimeout(() => showToast('Your exploration report is ready! 🎉', '📊'), 700);

// ── Print ──────────────────────────────────────────────────────
function printResults() { window.print(); }
