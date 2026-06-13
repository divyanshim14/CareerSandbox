// ── Simulation JS v2 ─────────────────────────────────────────
// All 7 simulations: ux, pm, fe, da, cs, entrepreneurship, aiml
// Adaptive difficulty, localStorage persistence, API sync

// ── State ─────────────────────────────────────────────────────
const simState = {
  career: null,
  difficulty: 'beginner',
  startTime: Date.now(),
  tasks: {},
  scores: { engagement: 0, confidence: 0, exploration: 0 },
};

// ── URL Params ─────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
simState.career = params.get('career') || sessionStorage.getItem('cs_career') || 'ux';

// ── Init ───────────────────────────────────────────────────────
const careerMeta = {
  ux:             { title: '🎨 UI/UX Design Simulation',        sub: '3 tasks · Evaluate real design decisions',  tasks: 3 },
  pm:             { title: '📋 Product Management Simulation',  sub: '2 tasks · Prioritize like a real PM',        tasks: 2 },
  fe:             { title: '💻 Frontend Development Simulation', sub: '2 tasks · Debug and improve real code',     tasks: 2 },
  da:             { title: '📊 Data Analytics Simulation',      sub: '2 tasks · Read data critically',             tasks: 2 },
  cs:             { title: '✍️ Content Strategy Simulation',    sub: '2 tasks · Craft compelling content',         tasks: 2 },
  entrepreneurship:{ title: '🚀 Entrepreneurship Simulation',   sub: '2 tasks · Think like a founder',            tasks: 2 },
  aiml:           { title: '🤖 AI/ML Exploration Simulation',   sub: '2 tasks · Ethics and data in ML',           tasks: 2 },
};

const difficultyHints = {
  beginner: {
    ux: '💡 Beginner mode: Focus on your first instinct — there are no wrong choices, just learning.',
    pm: '💡 Beginner mode: Think about which issues affect the most users directly.',
    fe: '💡 Beginner mode: Look for typos, wrong symbols, or missing values — bugs are often simple.',
    da: '💡 Beginner mode: Look at the chart axes carefully. Misleading charts often hide in the scale.',
    cs: '💡 Beginner mode: Think about which headline sounds like a human, not a marketing template.',
    entrepreneurship: '💡 Beginner mode: The best validation questions reveal behavior, not opinions.',
    aiml: '💡 Beginner mode: Clear positive and negative sentiments are the easiest to label.',
  },
  intermediate: {
    ux: '⚡ Intermediate mode: Consider both usability AND business context when evaluating designs.',
    pm: '⚡ Intermediate mode: Balance urgency (what\'s broken) vs. importance (what drives growth).',
    fe: '⚡ Intermediate mode: Some bugs are semantic, not syntactic — look at meaning, not just syntax.',
    da: '⚡ Intermediate mode: Consider what context is missing that would change your interpretation.',
    cs: '⚡ Intermediate mode: Think about the reader\'s emotional state and existing beliefs.',
    entrepreneurship: '⚡ Intermediate mode: The best startup founders kill bad ideas early and cheaply.',
    aiml: '⚡ Intermediate mode: Ambiguous sentiment is more common than clear positive/negative.',
  },
  advanced: {
    ux: '🔥 Advanced mode: Think about accessibility, edge cases, and psychological safety in your choices.',
    pm: '🔥 Advanced mode: Consider compounding effects — what does NOT fixing an issue cost over 3 months?',
    fe: '🔥 Advanced mode: Some bugs render fine in some browsers but break in others — think broadly.',
    da: '🔥 Advanced mode: Correlation ≠ causation. Every insight needs a "but what else could explain this?"',
    cs: '🔥 Advanced mode: Brand voice consistency matters more than single-headline optimization.',
    entrepreneurship: '🔥 Advanced mode: Resources are zero-sum — every ₹ on one thing is ₹ less on another.',
    aiml: '🔥 Advanced mode: Your labeling decisions directly become model biases — precision is ethics.',
  },
};

function initSim() {
  // Load profile to get difficulty
  if (window.CS) {
    const profile = CS.loadProfile();
    if (profile) {
      simState.difficulty = CS.computeDifficultyFromProfile(profile);
      localStorage.setItem('cs_difficulty', simState.difficulty);
    }
  }

  const meta = careerMeta[simState.career] || careerMeta.ux;
  document.getElementById('sim-title').textContent    = meta.title;
  document.getElementById('sim-subtitle').textContent = meta.sub;
  document.getElementById('sim-pill-text').textContent = `${simState.career.toUpperCase()} · ${simState.difficulty.charAt(0).toUpperCase() + simState.difficulty.slice(1)}`;
  document.title = meta.title + ' – CareerSandbox';

  // Set difficulty badge
  const badge = document.getElementById('diff-badge');
  badge.textContent = simState.difficulty.charAt(0).toUpperCase() + simState.difficulty.slice(1);
  badge.className = `diff-badge diff-${simState.difficulty}`;

  setTimeout(() => {
    document.getElementById('sim-loading').style.display = 'none';
    document.getElementById('sim-container').style.display = 'block';

    const container = document.getElementById(`sim-${simState.career}`);
    if (container) {
      container.classList.remove('hidden');
      // Apply difficulty hint
      const hints = difficultyHints[simState.difficulty];
      if (hints && hints[simState.career]) {
        const hintEl = document.getElementById(`${simState.career.split('-')[0]}-diff-hint`);
        if (hintEl) hintEl.textContent = hints[simState.career];
      }
    } else {
      document.getElementById('sim-coming').classList.remove('hidden');
    }
    setProgress(1, meta.tasks);
  }, 900);
}

// ── Timer ──────────────────────────────────────────────────────
let seconds = 0;
const timerEl = document.getElementById('timer-display');
const timerInterval = setInterval(() => {
  seconds++;
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}, 1000);

// ── Progress ───────────────────────────────────────────────────
function setProgress(taskNum, totalTasks) {
  const pct = Math.round(((taskNum - 1) / totalTasks) * 100);
  document.getElementById('sim-progress-fill').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-label').textContent = `Task ${taskNum} of ${totalTasks}`;
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, icon = '✨') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  toast.querySelector('.toast-icon').textContent = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ── Navbar / Hamburger ─────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open.toString());
  });
}

// ═══════════════════════════════════════════════
//  UI/UX SIMULATION
// ═══════════════════════════════════════════════
let uxChoice = null, uxAuditFound = 0, uxMicroChoice = null;
const auditBugs = {
  'audit-1': 'Continue to payment CTA lacks visual prominence — it looks like a secondary action',
  'audit-3': 'Promo code field has near-invisible text (font-size 0.5rem) — impossible to use',
  'audit-5': 'Legal consent text is 0.38rem — a textbook dark pattern to hide consent',
  'audit-7': 'Confirm button is grey on grey — fails WCAG contrast ratios, doesn\'t look clickable',
};

document.querySelectorAll('.design-option').forEach(opt => {
  const select = () => {
    document.querySelectorAll('.design-option').forEach(o => { o.classList.remove('chosen'); o.setAttribute('aria-pressed','false'); });
    opt.classList.add('chosen'); opt.setAttribute('aria-pressed','true');
    uxChoice = opt.dataset.choice;
    const form = document.getElementById('ux-explain-form');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast(`Design ${uxChoice} selected! Explain your reasoning.`, '🎨');
  };
  opt.addEventListener('click', select);
  opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
});

function uxTask1Done() {
  const explain = document.getElementById('ux-explain').value.trim();
  if (!uxChoice) { showToast('Please select a design first', '⚠️'); return; }
  if (explain.length < 30) { showToast('Add more detail to your explanation (min 30 characters)', '📝'); return; }

  simState.tasks.uxT1 = { choice: uxChoice, explain };
  simState.scores.engagement += 30;
  simState.scores.confidence += 10;

  document.getElementById('ux-t1').classList.add('hidden');
  document.getElementById('ux-t2').classList.remove('hidden');
  setProgress(2, 3);
  showToast('Task 1 complete! ✅', '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.audit-item').forEach(item => {
  const handle = () => {
    const isBug = item.dataset.issue === 'true';
    if (item.classList.contains('flagged')) {
      item.classList.remove('flagged', 'correct-flag', 'wrong-flag');
      if (isBug) {
        uxAuditFound--;
        document.getElementById('audit-found').textContent = uxAuditFound;
        const fb = document.getElementById('audit-feedback-list');
        const existing = fb.querySelector(`[data-id="${item.id}"]`);
        if (existing) existing.remove();
        if (!fb.querySelector('.audit-feedback-item')) fb.innerHTML = '<p style="font-size:0.8rem;color:rgba(240,238,255,0.3);font-style:italic">Click elements on the left to flag UX issues...</p>';
      }
      return;
    }
    item.classList.add('flagged');
    if (isBug) {
      item.classList.add('correct-flag');
      uxAuditFound++;
      document.getElementById('audit-found').textContent = uxAuditFound;
      const fb = document.getElementById('audit-feedback-list');
      fb.querySelector('p:only-child')?.remove();
      const div = document.createElement('div');
      div.className = 'audit-feedback-item';
      div.dataset.id = item.id;
      div.textContent = auditBugs[item.id] || 'UX issue found';
      fb.appendChild(div);
      showToast(`Issue found! (${uxAuditFound}/4)`, '🔍');
    } else {
      item.classList.add('wrong-flag');
      showToast("That element is actually fine!", '💭');
      setTimeout(() => item.classList.remove('flagged', 'wrong-flag'), 1500);
    }
    document.getElementById('audit-score').textContent = `Accuracy: ${uxAuditFound}/4 real issues found`;
  };
  item.addEventListener('click', handle);
  item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } });
});

function uxTask2Done() {
  simState.tasks.uxT2 = { found: uxAuditFound };
  simState.scores.engagement += 25;
  simState.scores.exploration += 20;
  if (uxAuditFound >= 3) simState.scores.confidence += 20;
  else simState.scores.confidence += 8;

  document.getElementById('ux-t2').classList.add('hidden');
  document.getElementById('ux-t3').classList.remove('hidden');
  setProgress(3, 3);
  showToast(`You found ${uxAuditFound}/4 issues. Final task!`, '🎯');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.micro-option').forEach(opt => {
  const select = () => {
    document.querySelectorAll('.micro-option').forEach(o => { o.classList.remove('chosen'); o.setAttribute('aria-pressed','false'); });
    opt.classList.add('chosen'); opt.setAttribute('aria-pressed','true');
    uxMicroChoice = opt.dataset.val;
    const form = document.getElementById('micro-explain-form');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('Choice made! Explain your reasoning.', '💡');
  };
  opt.addEventListener('click', select);
  opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
});

function uxSimDone() {
  if (!uxMicroChoice) { showToast('Please select a micro-interaction', '⚠️'); return; }
  simState.tasks.uxT3 = { choice: uxMicroChoice, explain: document.getElementById('micro-explain').value };
  simState.scores.engagement += 25;
  if (uxMicroChoice === 'toast' || uxMicroChoice === 'anim') simState.scores.confidence += 20;
  else simState.scores.confidence += 8;
  simState.scores.exploration += 15;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  PM SIMULATION
// ═══════════════════════════════════════════════
let selectedFeatures = [];
const featureTexts = {
  '1': 'Driver rating crash fix',
  '2': 'Dark mode',
  '3': 'Payment slowdown fix',
  '4': 'Scheduled orders',
  '5': 'Favourite restaurant memory',
};

function togglePriority(id, btn) {
  if (selectedFeatures.includes(id)) {
    selectedFeatures = selectedFeatures.filter(f => f !== id);
    btn.classList.remove('active'); btn.textContent = 'Pick This';
    document.getElementById(`comp-${id}`).classList.remove('selected-feature');
  } else {
    if (selectedFeatures.length >= 2) { showToast('Pick only 2 features for this sprint!', '⚠️'); return; }
    selectedFeatures.push(id);
    btn.classList.add('active'); btn.textContent = 'Selected ✓';
    document.getElementById(`comp-${id}`).classList.add('selected-feature');
  }
  document.getElementById('selected-count').textContent = selectedFeatures.length;
  const list = document.getElementById('selected-list');
  if (!selectedFeatures.length) { list.innerHTML = '<div class="selected-placeholder">No features selected yet. Pick exactly 2.</div>'; return; }
  list.innerHTML = selectedFeatures.map(id => `<div class="selected-chip">${featureTexts[id]}</div>`).join('');
}

function pmTask1Done() {
  const explain = document.getElementById('pm-explain').value.trim();
  if (selectedFeatures.length < 2) { showToast('Please select exactly 2 features', '⚠️'); return; }
  if (explain.length < 20) { showToast('Add more reasoning to your explanation', '📝'); return; }

  simState.tasks.pmT1 = { selected: selectedFeatures, explain };
  simState.scores.engagement += 35;
  const hasCritical = selectedFeatures.includes('1') && selectedFeatures.includes('3');
  simState.scores.confidence += hasCritical ? 30 : (selectedFeatures.includes('1') || selectedFeatures.includes('3')) ? 18 : 8;
  simState.scores.exploration += 15;

  document.getElementById('pm-t1').classList.add('hidden');
  document.getElementById('pm-t2').classList.remove('hidden');
  setProgress(2, 2);
  showToast('Task 1 complete! Now think metrics.', '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let selectedMetrics = [];
document.querySelectorAll('.metric-option').forEach(opt => {
  const toggle = () => {
    const val = opt.dataset.val;
    const isGood = opt.dataset.good === 'true';
    if (opt.classList.contains('selected-good') || opt.classList.contains('selected-bad')) {
      opt.classList.remove('selected-good', 'selected-bad');
      selectedMetrics = selectedMetrics.filter(m => m !== val);
    } else {
      opt.classList.add(isGood ? 'selected-good' : 'selected-bad');
      selectedMetrics.push(val);
      showToast(isGood ? 'Good metric! Directly measurable.' : 'That\'s a vanity metric for this fix.', isGood ? '✅' : '💭');
    }
    if (selectedMetrics.length >= 2) {
      const fb = document.getElementById('metric-feedback');
      const goodOnes = selectedMetrics.filter(m => ['payment_success','checkout_time','checkout_abandon','support_tickets'].includes(m));
      fb.style.display = 'block';
      fb.innerHTML = `<strong>${goodOnes.length}/4 relevant metrics selected.</strong> ${goodOnes.length >= 2 ? '🎯 You\'re tracking what directly reflects the fix.' : 'Focus on metrics that change when payment speed improves.'}`;
    }
  };
  opt.addEventListener('click', toggle);
  opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

function pmSimDone() {
  if (!selectedMetrics.length) { showToast('Select at least one metric', '⚠️'); return; }
  const goodOnes = selectedMetrics.filter(m => ['payment_success','checkout_time','checkout_abandon','support_tickets'].includes(m));
  simState.tasks.pmT2 = { metrics: selectedMetrics, goodOnes };
  simState.scores.engagement += 30;
  simState.scores.confidence += goodOnes.length * 8;
  simState.scores.exploration += 15;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  FRONTEND SIMULATION
// ═══════════════════════════════════════════════
let bugsFound = 0;
const bugDescriptions = {
  4:  'Line 4: <meta> is a void element — it should self-close or have no closing tag',
  8:  'Line 8: Double hash ## in color — ##1a1a2e is invalid CSS',
  13: 'Line 13: font-size: 16 is missing a unit — should be 16px or 1rem',
  21: 'Line 21: Opening <h1> closed as </h2> — mismatched tags break document structure',
};

document.querySelectorAll('.code-line').forEach(line => {
  const handle = () => {
    const lineNum = parseInt(line.dataset.line);
    const isBug = line.dataset.bug === 'true';
    if (line.classList.contains('bug-flagged')) {
      line.classList.remove('bug-flagged', 'correct-find', 'wrong-find');
      if (isBug) {
        bugsFound--;
        document.getElementById('bugs-found').textContent = bugsFound;
        document.querySelector(`[data-line="${lineNum}"]`)?.parentElement?.querySelector('.found-bug-item')?.remove();
        if (bugsFound === 0) {
          document.getElementById('found-bugs-list').innerHTML = '<div class="found-bug-placeholder">Click on buggy lines in the code →</div>';
        }
      }
      return;
    }
    line.classList.add('bug-flagged');
    if (isBug) {
      line.classList.add('correct-find');
      bugsFound++;
      document.getElementById('bugs-found').textContent = bugsFound;
      const list = document.getElementById('found-bugs-list');
      const ph = list.querySelector('.found-bug-placeholder');
      if (ph) ph.remove();
      const item = document.createElement('div');
      item.className = 'found-bug-item';
      item.innerHTML = `<span>✅</span><span>${bugDescriptions[lineNum]}</span>`;
      list.appendChild(item);
      showToast(`Bug found on line ${lineNum}! ✅`, '🐛');
    } else {
      line.classList.add('wrong-find');
      showToast('That line is correct — keep looking!', '👀');
      setTimeout(() => { line.classList.remove('bug-flagged', 'wrong-find'); }, 1500);
    }
  };
  line.addEventListener('click', handle);
  line.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } });
});

function feTask1Done() {
  simState.tasks.feT1 = { bugsFound };
  simState.scores.engagement += 30;
  simState.scores.confidence += bugsFound * 8;
  simState.scores.exploration += 10;
  document.getElementById('fe-t1').classList.add('hidden');
  document.getElementById('fe-t2').classList.remove('hidden');
  setProgress(2, 2);
  showToast(`Found ${bugsFound}/4 bugs! Final task.`, '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let selectedImprovements = [];
document.querySelectorAll('.improve-option').forEach(opt => {
  const toggle = () => {
    const isGood = opt.dataset.good === 'true';
    const id = opt.id;
    if (opt.classList.contains('selected-good') || opt.classList.contains('selected-bad')) {
      opt.classList.remove('selected-good', 'selected-bad');
      opt.querySelector('.improve-icon').textContent = '+';
      opt.setAttribute('aria-checked', 'false');
      selectedImprovements = selectedImprovements.filter(i => i !== id);
    } else {
      opt.classList.add(isGood ? 'selected-good' : 'selected-bad');
      opt.querySelector('.improve-icon').textContent = isGood ? '✓' : '✗';
      opt.setAttribute('aria-checked', 'true');
      selectedImprovements.push(id);
      showToast(isGood ? 'Good improvement! ✅' : 'That would make it worse 🚫', isGood ? '✅' : '🚫');
    }
  };
  opt.addEventListener('click', toggle);
  opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

function feSimDone() {
  if (!selectedImprovements.length) { showToast('Select at least one improvement', '⚠️'); return; }
  const good = ['imp-1','imp-2','imp-4','imp-5','imp-7'];
  const correct = selectedImprovements.filter(i => good.includes(i)).length;
  const wrong   = selectedImprovements.filter(i => !good.includes(i)).length;
  simState.tasks.feT2 = { selected: selectedImprovements, correct, wrong };
  simState.scores.engagement += 35;
  simState.scores.confidence += Math.max(0, correct * 10 - wrong * 5);
  simState.scores.exploration += 15;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  DATA ANALYTICS SIMULATION
// ═══════════════════════════════════════════════
let daChartChoice = null;

document.querySelectorAll('.chart-card').forEach(card => {
  const handle = () => {
    daChartChoice = card.id;
    const isMisleading = card.dataset.misleading === 'true';
    document.querySelectorAll('.chart-card').forEach(c => c.classList.remove('selected-bad','selected-good'));
    card.classList.add(isMisleading ? 'selected-bad' : 'selected-good');
    const fb = document.getElementById('da-feedback');
    fb.style.display = 'block';
    document.getElementById('da-feedback-title').textContent = isMisleading
      ? '✅ Correct! Chart B is deliberately misleading.'
      : '❌ That chart is actually honest.';
    document.getElementById('da-feedback-text').innerHTML = isMisleading
      ? 'Chart B shows revenue of $98K–$104K (6% growth) but truncates the Y-axis to start at $97K — making flat growth look like a hockey stick. This is one of the most common data manipulation tricks.'
      : `Chart ${card.id.slice(-1)} presents data accurately. The chart to question is B — its Y-axis starts at $97K to make 6% growth look dramatic.`;
    if (isMisleading) {
      simState.scores.confidence += 25; simState.scores.engagement += 10;
    }
    showToast(isMisleading ? 'Correct! You spotted the manipulation 📊' : 'Look at the Y-axis more carefully...', isMisleading ? '✅' : '🤔');
  };
  card.addEventListener('click', handle);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } });
});

function daTask1Done() {
  simState.tasks.daT1 = { choice: daChartChoice };
  simState.scores.engagement += 30;
  simState.scores.exploration += 15;
  document.getElementById('da-t1').classList.add('hidden');
  document.getElementById('da-t2').classList.remove('hidden');
  setProgress(2, 2);
  showToast('Task 1 complete! Analyze this funnel.', '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let daInsightsSelected = [];
document.querySelectorAll('.insight-choice').forEach(opt => {
  const toggle = () => {
    const isGood = opt.dataset.good === 'true';
    if (opt.classList.contains('selected-good') || opt.classList.contains('selected-bad')) {
      opt.classList.remove('selected-good','selected-bad');
      opt.querySelector('.ic-check').textContent = '○';
      daInsightsSelected = daInsightsSelected.filter(i => i !== opt.id);
    } else {
      opt.classList.add(isGood ? 'selected-good' : 'selected-bad');
      opt.querySelector('.ic-check').textContent = isGood ? '✅' : '❌';
      daInsightsSelected.push(opt.id);
      showToast(isGood ? 'Good insight!' : 'That conclusion is not well-supported by the data.', isGood ? '📊' : '🤔');
    }
  };
  opt.addEventListener('click', toggle);
  opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

function daSimDone() {
  if (!daInsightsSelected.length) { showToast('Select at least one insight', '⚠️'); return; }
  const good = ['dai-1','dai-3','dai-5'];
  const correct = daInsightsSelected.filter(i => good.includes(i)).length;
  const wrong   = daInsightsSelected.filter(i => !good.includes(i)).length;
  simState.tasks.daT2 = { selected: daInsightsSelected, correct, wrong };
  simState.scores.engagement += 30;
  simState.scores.confidence += Math.max(0, correct * 12 - wrong * 6);
  simState.scores.exploration += 15;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  CONTENT STRATEGY SIMULATION
// ═══════════════════════════════════════════════
let csVoiceChoice = null;
const voiceScores = { high: 30, med: 15, low: 5 };

document.querySelectorAll('.voice-option').forEach(opt => {
  const select = () => {
    document.querySelectorAll('.voice-option').forEach(o => o.classList.remove('chosen-good','chosen-med','chosen-bad'));
    const score = opt.dataset.score;
    opt.classList.add(score === 'high' ? 'chosen-good' : score === 'med' ? 'chosen-med' : 'chosen-bad');
    opt.querySelector('.vo-radio').textContent = '●';
    csVoiceChoice = { id: opt.id, score };
    const fb = document.getElementById('voice-feedback');
    fb.style.display = 'block';
    const feedback = {
      high: '✅ Excellent choice! "A few quiet minutes, every day." is warm, minimal, and accessible. It talks to someone who\'s already failed at meditation apps — it doesn\'t oversell.',
      med:  '⚠️ Close, but the "Guaranteed" word creates a promise the brand can\'t keep — which violates trust, exactly what the brand brief warns against.',
      low:  '❌ This doesn\'t match the brief. Either it\'s too technical/corporate or too empty/alliterative — the opposite of warm and grounded.',
    };
    fb.innerHTML = `<p>${feedback[score]}</p>`;
    showToast(score === 'high' ? 'Perfect brand voice match!' : 'Think about the brief again...', score === 'high' ? '✅' : '💭');
  };
  opt.addEventListener('click', select);
  opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
});

function csTask1Done() {
  if (!csVoiceChoice) { showToast('Please select a headline option', '⚠️'); return; }
  simState.tasks.csT1 = csVoiceChoice;
  simState.scores.engagement += 25;
  simState.scores.confidence += voiceScores[csVoiceChoice.score] || 5;
  simState.scores.exploration += 10;
  document.getElementById('cs-t1').classList.add('hidden');
  document.getElementById('cs-t2').classList.remove('hidden');
  setProgress(2, 2);
  showToast('Task 1 complete! Now A/B test time.', '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let abChoice = null;
document.querySelectorAll('.ab-card').forEach(card => {
  const select = () => {
    document.querySelectorAll('.ab-card').forEach(c => c.classList.remove('chosen-good','chosen-bad'));
    abChoice = card.dataset.choice;
    // B is the correct answer
    const isCorrect = abChoice === 'B';
    card.classList.add(isCorrect ? 'chosen-good' : 'chosen-bad');
    const fb = document.getElementById('ab-feedback');
    fb.style.display = 'block';
    fb.innerHTML = isCorrect
      ? '<strong>✅ Version B typically outperforms.</strong> Specificity ("6 Months"), empathy ("Confused Career"), and a clear mechanism ("Here\'s Exactly How") make it far more compelling. It speaks to someone in real pain.'
      : '<strong>💭 Version A is generic.</strong> It makes the same promise every bootcamp makes. Version B wins because it\'s specific, empathetic, and uses a number. These three elements consistently improve open rates.';
    showToast(isCorrect ? 'Good prediction!' : 'Think about what\'s more specific...', isCorrect ? '✅' : '🤔');
  };
  card.addEventListener('click', select);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
});

function csSimDone() {
  if (!abChoice) { showToast('Please choose a headline first', '⚠️'); return; }
  const explain = document.getElementById('cs-explain').value.trim();
  if (explain.length < 15) { showToast('Add a brief explanation', '📝'); return; }
  simState.tasks.csT2 = { choice: abChoice, correct: abChoice === 'B', explain };
  simState.scores.engagement += 35;
  simState.scores.confidence += abChoice === 'B' ? 25 : 8;
  simState.scores.exploration += 15;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  ENTREPRENEURSHIP SIMULATION
// ═══════════════════════════════════════════════
let entQuestions = [];

document.querySelectorAll('.ent-q').forEach(q => {
  const toggle = () => {
    const isGood = q.dataset.good === 'true';
    if (q.classList.contains('chosen-good') || q.classList.contains('chosen-bad')) {
      q.classList.remove('chosen-good','chosen-bad');
      q.querySelector('.eq-check').textContent = '○';
      entQuestions = entQuestions.filter(i => i !== q.id);
    } else {
      if (entQuestions.length >= 3) { showToast('Pick only 3 questions!', '⚠️'); return; }
      q.classList.add(isGood ? 'chosen-good' : 'chosen-bad');
      q.querySelector('.eq-check').textContent = isGood ? '✅' : '❌';
      entQuestions.push(q.id);
      showToast(isGood ? 'Great validation question!' : 'That question can produce misleading answers.', isGood ? '✅' : '⚠️');
      if (entQuestions.length === 3) {
        const correct = entQuestions.filter(i => ['eq-1','eq-3','eq-5'].includes(i)).length;
        const fb = document.getElementById('ent-feedback');
        fb.style.display = 'block';
        fb.innerHTML = `<strong>${correct}/3 validated questions selected.</strong> ${correct === 3 ? '🎯 You applied the Mom Test principles — asking about behavior, not hypotheticals.' : 'Remember: the best startup questions reveal past behavior, not future intentions.'}`;
      }
    }
  };
  q.addEventListener('click', toggle);
  q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});

function entTask1Done() {
  if (entQuestions.length < 3) { showToast('Select exactly 3 questions', '⚠️'); return; }
  const correct = entQuestions.filter(i => ['eq-1','eq-3','eq-5'].includes(i)).length;
  simState.tasks.entT1 = { questions: entQuestions, correct };
  simState.scores.engagement += 25;
  simState.scores.confidence += correct * 10;
  simState.scores.exploration += 15;
  document.getElementById('ent-t1').classList.add('hidden');
  document.getElementById('ent-t2').classList.remove('hidden');
  setProgress(2, 2);
  showToast('Task 1 complete! Allocate your budget.', '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Budget sliders
const budgetIds = ['budg-dev','budg-mkt','budg-ops','budg-res','budg-rsv'];

budgetIds.forEach(id => {
  const slider = document.getElementById(id);
  const pctEl  = document.getElementById(`${id}-pct`);
  if (!slider) return;
  slider.addEventListener('input', () => {
    pctEl.textContent = slider.value + '%';
    updateBudgetTotal();
  });
});

function updateBudgetTotal() {
  const total = budgetIds.reduce((sum, id) => {
    const el = document.getElementById(id);
    return sum + (el ? parseInt(el.value) : 0);
  }, 0);
  const totalEl   = document.getElementById('budg-total');
  const warningEl = document.getElementById('budg-warning');
  totalEl.textContent = total + '%';
  if (total > 100) {
    totalEl.classList.add('over');
    warningEl.classList.remove('hidden');
  } else {
    totalEl.classList.remove('over');
    warningEl.classList.add('hidden');
  }
}

function entSimDone() {
  const total = budgetIds.reduce((s, id) => s + parseInt(document.getElementById(id)?.value || 0), 0);
  if (Math.abs(total - 100) > 5) { showToast('Budget must total 100% (±5% allowed)', '⚠️'); return; }
  const explain = document.getElementById('ent-explain').value.trim();
  if (explain.length < 10) { showToast('Add a brief justification', '📝'); return; }
  const devPct = parseInt(document.getElementById('budg-dev').value);
  simState.tasks.entT2 = { budget: budgetIds.reduce((o, id) => ({ ...o, [id]: document.getElementById(id).value }), {}), explain };
  simState.scores.engagement += 35;
  simState.scores.confidence += devPct >= 30 && devPct <= 55 ? 20 : 10;
  simState.scores.exploration += 20;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  AI/ML SIMULATION
// ═══════════════════════════════════════════════
const correctLabels = { 1: 'neutral', 2: 'negative', 3: 'neutral', 4: 'positive' };
let labelsDone = 0, labelResults = {};

function setLabel(rowNum, val, btn) {
  const row = document.getElementById(`lr-${rowNum}`);
  row.querySelectorAll('.lr-btn').forEach(b => b.classList.remove('active-positive','active-neutral','active-negative'));
  btn.classList.add(`active-${val}`);

  const correct = correctLabels[rowNum];
  const isRight = val === correct;
  const feedbacks = {
    1: { neutral: '✅ Neutral — "fine I guess" and "Does what it says" signals mild satisfaction but no enthusiasm', positive: '⚠️ Leaning neutral — the hedging language ("I guess") suggests tepid satisfaction, not positive', negative: '❌ This isn\'t negative — it\'s resigned acceptance, which is neutral sentiment' },
    2: { negative: '✅ Clearly negative — strong negative language ("absolutely horrible"), specific complaint, anger', neutral: '❌ Not neutral — "absolutely horrible" is unambiguous negative sentiment', positive: '❌ Definitely negative — this is a highly negative experience clearly expressed' },
    3: { neutral: '✅ Neutral — the "not what I expected" is negative but "husband likes it" is positive — net neutral', negative: '⚠️ Close but the mixed signals balance out — it\'s more neutral than negative', positive: '❌ Not positive — "not what I expected" signals disappointment even if husband is happy' },
    4: { positive: '✅ Positive — three factual statements ("Fast", "Good", "Would order again") are all positive signals', neutral: '❌ Not neutral — "Would order again" is a clear buying signal and positive sentiment', negative: '❌ Definitely not negative — all three statements are positive' },
  };
  document.getElementById(`lrf-${rowNum}`).textContent = feedbacks[rowNum][val] || '';

  if (!labelResults[rowNum]) {
    labelsDone++;
    document.getElementById('labels-done').textContent = labelsDone;
    document.getElementById('label-progress').style.width = (labelsDone * 25) + '%';
  }
  labelResults[rowNum] = { val, correct: isRight };
  if (isRight) simState.scores.confidence += 5;
}

function aiTask1Done() {
  if (labelsDone < 4) { showToast('Please label all 4 reviews', '⚠️'); return; }
  const correctCount = Object.values(labelResults).filter(r => r.correct).length;
  simState.tasks.aiT1 = { results: labelResults, correct: correctCount };
  simState.scores.engagement += 30;
  simState.scores.exploration += 15;
  document.getElementById('ai-t1').classList.add('hidden');
  document.getElementById('ai-t2').classList.remove('hidden');
  setProgress(2, 2);
  showToast(`${correctCount}/4 correct labels! Now spot model bias.`, '✅');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let biasChoice = null;
document.querySelectorAll('.bias-card').forEach(card => {
  const handle = () => {
    biasChoice = card.id;
    const isBias = card.dataset.biased === 'true';
    document.querySelectorAll('.bias-card').forEach(c => c.classList.remove('chosen-biased','chosen-not-biased'));
    card.classList.add(isBias ? 'chosen-biased' : 'chosen-not-biased');
    const fb = document.getElementById('bias-feedback');
    fb.style.display = 'block';
    fb.innerHTML = isBias
      ? '<strong>✅ Correct! Pattern C is gender bias.</strong> A 23% systematic difference for identical qualifications is discriminatory bias — likely inherited from historical training data where engineering roles were male-dominated. This is why AI ethics and diverse training data matter deeply.'
      : `<strong>${isBias ? '' : '❌ That pattern is not algorithmic bias.</strong> '}${card.id === 'bc-1' ? 'Pattern A reflects institutional privilege and is worth questioning — but Pattern C is a clear-cut gender bias case.' : card.id === 'bc-2' ? 'Pattern B is correct behavior — ranking experience for an experienced role is appropriate.' : 'Pattern D is also valid — GitHub contributions are a relevant signal for software engineering.'}`;
    showToast(isBias ? 'You identified the bias!' : 'Read the patterns more carefully...', isBias ? '✅' : '🤔');
    if (isBias) { simState.scores.confidence += 30; }
  };
  card.addEventListener('click', handle);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(); } });
});

function aiSimDone() {
  if (!biasChoice) { showToast('Please select a bias pattern', '⚠️'); return; }
  const correct = document.getElementById(biasChoice)?.dataset.biased === 'true';
  simState.tasks.aiT2 = { choice: biasChoice, correct };
  simState.scores.engagement += 35;
  simState.scores.exploration += 20;
  finishSimulation();
}

// ═══════════════════════════════════════════════
//  FINISH SIMULATION
// ═══════════════════════════════════════════════
function finishSimulation() {
  clearInterval(timerInterval);
  const elapsed = Math.floor((Date.now() - simState.startTime) / 1000);

  // Exploration bonus for time spent
  simState.scores.exploration = Math.min(100, Math.round(simState.scores.exploration + Math.min(elapsed / 10, 20)));

  // Cap all scores at 100
  simState.scores.engagement  = Math.min(100, Math.round(simState.scores.engagement));
  simState.scores.confidence  = Math.min(100, Math.round(simState.scores.confidence));
  simState.scores.exploration = Math.min(100, Math.round(simState.scores.exploration));

  // Save to localStorage + API
  if (window.CS) {
    CS.saveSimScore(simState.career, simState.scores, elapsed, simState.tasks);
    // Also save to sessionStorage for immediate results page access
    sessionStorage.setItem('csSimData',   JSON.stringify(simState));
    sessionStorage.setItem('csSimCareer', simState.career);
    sessionStorage.setItem('csElapsed',   elapsed);
    sessionStorage.setItem('cs_career',   simState.career);
  }

  document.getElementById('sim-progress-fill').style.width = '100%';
  document.getElementById('prog-pct').textContent = '100%';
  document.getElementById('prog-label').textContent = 'Simulation Complete!';

  sessionStorage.setItem('cs_just_completed', '1');
  showToast('Simulation complete! Generating your results...', '🏁');

  setTimeout(() => {
    window.location.href = 'results.html';
  }, 1600);
}

// ── Boot ───────────────────────────────────────────────────────
initSim();
