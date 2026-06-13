// ── Recommendations Page JS v2 ─────────────────────────────
// Dynamically renders all 7 careers with live affinity scores

// ── Navbar / Hamburger ─────────────────────────────────────
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
  mobileMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { mobileMenu.classList.remove('open'); hamburger.classList.remove('open'); })
  );
}

// ── Scroll reveal ──────────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, icon = '🎮') {
  const t = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  t.querySelector('.toast-icon').textContent = icon;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Career Definitions ─────────────────────────────────────
const ALL_CAREERS = [
  {
    id: 'ux',
    emoji: '🎨',
    name: 'UI/UX Design',
    desc: 'Shape how products look and feel. UX designers are advocates for the user — making sure interfaces are intuitive, beautiful, and purposeful.',
    tags: ['Creative', 'Empathetic', 'Visual'],
    skills: ['Design evaluation & comparison', 'User empathy & reasoning', 'Visual decision-making'],
    time: '~8 min',
    color: 'var(--career-ux)',
    gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)',
    ringColor: ['#7c3aed','#a855f7'],
  },
  {
    id: 'pm',
    emoji: '📋',
    name: 'Product Management',
    desc: 'Be the person who decides what gets built and why. PMs sit at the crossroads of business, technology, and user experience.',
    tags: ['Strategic', 'Analytical', 'Leadership'],
    skills: ['Feature prioritization under constraints', 'User complaint analysis', 'Metric selection'],
    time: '~6 min',
    color: 'var(--career-pm)',
    gradient: 'linear-gradient(90deg,#a855f7,#ec4899)',
    ringColor: ['#a855f7','#ec4899'],
  },
  {
    id: 'fe',
    emoji: '💻',
    name: 'Frontend Development',
    desc: 'Build the part of the web people actually see. Frontend devs craft interfaces using code — blending engineering with visual sensibility.',
    tags: ['Technical', 'Creative', 'Detail-oriented'],
    skills: ['Bug identification in HTML/CSS', 'UI improvement thinking', 'Code quality judgement'],
    time: '~7 min',
    color: 'var(--career-fe)',
    gradient: 'linear-gradient(90deg,#06b6d4,#3b82f6)',
    ringColor: ['#06b6d4','#3b82f6'],
  },
  {
    id: 'da',
    emoji: '📊',
    name: 'Data Analytics',
    desc: 'Find stories hidden in numbers. Data analysts turn raw data into insights that drive real business decisions.',
    tags: ['Logical', 'Curious', 'Storyteller'],
    skills: ['Misleading chart detection', 'Funnel analysis & insights', 'Data interpretation'],
    time: '~8 min',
    color: 'var(--career-da)',
    gradient: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    ringColor: ['#f59e0b','#ef4444'],
  },
  {
    id: 'cs',
    emoji: '✍️',
    name: 'Content Strategy',
    desc: 'Shape the voice of a brand. Content strategists craft narratives that connect with real people and drive meaningful engagement.',
    tags: ['Creative', 'Research-driven', 'Communicative'],
    skills: ['Brand voice matching', 'Headline A/B thinking', 'Audience empathy'],
    time: '~5 min',
    color: 'var(--career-cs)',
    gradient: 'linear-gradient(90deg,#10b981,#06b6d4)',
    ringColor: ['#10b981','#06b6d4'],
  },
  {
    id: 'entrepreneurship',
    emoji: '🚀',
    name: 'Entrepreneurship',
    desc: 'Build something from nothing. Founders validate ideas, allocate resources under pressure, and make high-stakes decisions daily.',
    tags: ['Risk-taking', 'Resourceful', 'Strategic'],
    skills: ['Startup idea validation', 'Budget allocation thinking', 'Customer discovery'],
    time: '~7 min',
    color: 'var(--career-ent)',
    gradient: 'linear-gradient(90deg,#f43f5e,#f97316)',
    ringColor: ['#f43f5e','#f97316'],
  },
  {
    id: 'aiml',
    emoji: '🤖',
    name: 'AI/ML Exploration',
    desc: 'Work at the frontier of technology and ethics. ML roles require precision, critical thinking, and deep understanding of bias.',
    tags: ['Analytical', 'Ethical', 'Technical'],
    skills: ['Data labeling & quality', 'Bias detection', 'ML ethics judgement'],
    time: '~6 min',
    color: 'var(--career-aiml)',
    gradient: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
    ringColor: ['#3b82f6','#8b5cf6'],
  },
];

// ── Load Profile ───────────────────────────────────────────
const profile = window.CS ? CS.loadProfile() : null;
const careerScores = window.CS ? CS.loadCareerScores() : {};
const difficulty   = window.CS ? CS.getDifficulty() : 'beginner';

// Name
const firstName = (profile?.name || 'Explorer').split(' ')[0];
document.getElementById('user-name-display').textContent = firstName;
document.title = `${firstName}'s Career Paths – CareerSandbox`;

// Profile strip
const branchMap = { cs:'CS / IT', ece:'ECE', mech:'Mechanical', civil:'Civil', bba:'BBA', bca:'BCA/MCA', design:'Design', arts:'Arts', science:'Science', med:'Medicine', other:'Other' };
document.getElementById('strip-branch-val').textContent  = branchMap[profile?.branch] || '—';
document.getElementById('strip-year-val').textContent    = profile?.year ? `Year ${profile.year}` : '—';
document.getElementById('strip-interests-val').textContent = (profile?.interests || []).slice(0, 3).join(', ') || '—';
const styleMap = { solo: 'Independent', collab: 'Collaborative', mix: 'Flexible' };
document.getElementById('strip-style-val').textContent   = styleMap[profile?.workStyle] || '—';
const diffEl = document.getElementById('strip-diff-val');
if (diffEl) diffEl.innerHTML = `<span class="diff-badge diff-${difficulty}">${difficulty.charAt(0).toUpperCase()+difficulty.slice(1)}</span>`;

// Nav difficulty badge
const navBadge = document.getElementById('diff-badge-nav');
if (navBadge) { navBadge.textContent = difficulty.charAt(0).toUpperCase()+difficulty.slice(1); navBadge.className = `diff-badge diff-${difficulty}`; }

// ── Render Cards ───────────────────────────────────────────
async function renderCareers() {
  // Get affinity scores
  let scores = { ux:50, pm:50, fe:50, da:48, cs:46, entrepreneurship:48, aiml:44 };
  if (window.CS) {
    const result = await CS.getRecommendations();
    if (result?.scores) scores = result.scores;
  }

  // Update pill text
  document.getElementById('reco-pill-text').textContent = `Scores computed · ${difficulty.charAt(0).toUpperCase()+difficulty.slice(1)} mode`;

  // Sort by score descending
  const sorted = [...ALL_CAREERS].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  // Hide loading, show grid
  document.getElementById('reco-loading').style.display = 'none';
  const grid = document.getElementById('careers-grid');
  grid.classList.remove('hidden');
  grid.innerHTML = '';

  sorted.forEach((career, idx) => {
    const pct    = Math.min(99, Math.round(scores[career.id] || 50));
    const isDone = !!careerScores[career.id];
    const isTop  = idx === 0;
    const circumference = 2 * Math.PI * 18; // r=18
    const dashOffset = circumference - (pct / 100) * circumference;
    const gradId = `cg-${career.id}`;

    const card = document.createElement('div');
    card.className = `career-card card card-glow${isTop ? ' top-match' : ''}`;
    card.id = `card-${career.id}`;
    card.setAttribute('data-career', career.id);
    card.style.animationDelay = `${idx * 0.06}s`;

    card.innerHTML = `
      <div class="cc-stripe" style="background:${career.gradient}"></div>

      ${isTop ? '<div class="top-match-badge">⭐ Top Match</div>' : ''}

      <!-- Match ring -->
      <div class="cc-match-wrap" aria-label="${pct}% career affinity">
        <div class="match-ring-wrap">
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs>
              <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${career.ringColor[0]}"/>
                <stop offset="100%" stop-color="${career.ringColor[1]}"/>
              </linearGradient>
            </defs>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="4"/>
            <circle cx="22" cy="22" r="18" fill="none"
              stroke="url(#${gradId})" stroke-width="4"
              stroke-dasharray="${circumference.toFixed(1)}"
              stroke-dashoffset="${circumference.toFixed(1)}"
              stroke-linecap="round"
              data-target-offset="${dashOffset.toFixed(1)}"
              id="ring-${career.id}"/>
          </svg>
          <div class="match-pct-text" id="pct-text-${career.id}">—</div>
        </div>
        <span class="match-pct-label">Affinity</span>
      </div>

      <div class="cc-body">
        <div class="cc-emoji" aria-hidden="true">${career.emoji}</div>
        <h2 class="cc-name">${career.name}</h2>
        <p class="cc-desc">${career.desc}</p>

        <div class="cc-tags">
          ${career.tags.map(t => `<span class="cc-tag">${t}</span>`).join('')}
        </div>

        <div class="cc-skills">
          <div class="cc-skills-title">What you'll practice</div>
          <ul class="cc-skills-list">
            ${career.skills.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="cc-footer">
        ${isDone
          ? `<button class="cc-already-done" onclick="startSim('${career.id}')" id="sim-${career.id}-btn">✅ Try Again</button>`
          : `<button class="cc-sim-btn" onclick="startSim('${career.id}')" id="sim-${career.id}-btn">🎮 Try Simulation</button>`
        }
        <span class="cc-sim-time">${career.time}</span>
      </div>
    `;

    grid.appendChild(card);

    // Animate match ring + percentage after a short delay
    setTimeout(() => {
      const ring = document.getElementById(`ring-${career.id}`);
      const pctEl = document.getElementById(`pct-text-${career.id}`);
      if (ring) ring.style.strokeDashoffset = dashOffset.toFixed(1);

      // Animate number
      if (pctEl) {
        let current = 0;
        const dur = 1200;
        const t0 = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          pctEl.textContent = Math.floor(eased * pct) + '%';
          if (progress < 1) requestAnimationFrame(tick);
          else pctEl.textContent = pct + '%';
        };
        requestAnimationFrame(tick);
      }
    }, 300 + idx * 80);
  });

  // Trigger scroll reveals for new cards
  grid.querySelectorAll('.career-card').forEach(el => {
    el.classList.add('reveal');
    revealObs.observe(el);
  });
}

renderCareers();

// ── Start Simulation ───────────────────────────────────────
function startSim(career) {
  if (!profile) {
    showToast('Please complete your profile first!', '⚠️');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
    return;
  }
  sessionStorage.setItem('cs_career', career);
  showToast(`Loading ${career.toUpperCase()} simulation...`, '🚀');
  setTimeout(() => {
    window.location.href = `simulation.html?career=${career}`;
  }, 700);
}

// ── API Status ─────────────────────────────────────────────
async function checkApi() {
  if (!window.CS) return;
  const online = await CS.isApiAvailable();
  const badge  = document.getElementById('api-badge');
  const text   = document.getElementById('api-badge-text');
  if (!badge) return;
  badge.classList.toggle('online', online);
  badge.classList.toggle('offline', !online);
  if (text) text.textContent = online ? 'API Connected' : 'Offline mode';
}
checkApi();

// ── No profile redirect ────────────────────────────────────
if (!profile) {
  document.getElementById('reco-loading').style.display = 'none';
  const grid = document.getElementById('careers-grid');
  grid.classList.remove('hidden');
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:var(--s-16) 0">
      <div style="font-size:3rem;margin-bottom:1rem">👋</div>
      <h3 style="font-family:var(--font-display);font-size:1.4rem;color:var(--ink);margin-bottom:0.75rem">Build your profile first</h3>
      <p style="color:var(--ink-2);margin-bottom:1.5rem">We need to know a bit about you to compute your career affinities.</p>
      <a href="profile.html" class="btn btn-primary btn-lg">Build My Profile →</a>
    </div>`;
}
