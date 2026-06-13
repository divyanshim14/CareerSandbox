// ── Profile Page JS v2 ─────────────────────────────────────
// Multi-step form, chip toggles, localStorage + API sync

// ── Navbar ─────────────────────────────────────────────────
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

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, icon = '✨') {
  const t = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  t.querySelector('.toast-icon').textContent = icon;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── State ──────────────────────────────────────────────────
const state = {
  currentStep: 1,
  totalSteps:  4,
  name: '', year: '', branch: '', aspirations: '',
  subjectsEnjoyed: [], subjectsDisliked: [], interests: [], freeInterests: '',
  workStyle: null, taskType: null, outputType: null,
};

// ── Pre-fill from localStorage ─────────────────────────────
function prefill() {
  const saved = window.CS ? CS.loadProfile() : null;
  if (!saved) return;
  if (saved.name)    document.getElementById('input-name').value = saved.name;
  if (saved.year)    document.getElementById('input-year').value = saved.year;
  if (saved.branch)  document.getElementById('input-branch').value = saved.branch;
  if (saved.aspirations) document.getElementById('input-aspirations').value = saved.aspirations;

  (saved.subjectsEnjoyed || []).forEach(v => activateChip('chips-enjoy', v));
  (saved.subjectsDisliked || []).forEach(v => activateChip('chips-dislike', v));
  (saved.interests || []).forEach(v => activateChip('chips-interests', v));

  if (saved.freeInterests) document.getElementById('input-more-interests').value = saved.freeInterests;
  if (saved.workStyle)  selectStyle('work-style-grid', saved.workStyle);
  if (saved.taskType)   selectStyle('task-type-grid',  saved.taskType);
  if (saved.outputType) selectStyle('output-type-grid', saved.outputType);

  Object.assign(state, saved);
}

function activateChip(groupId, val) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const chip = group.querySelector(`[data-val="${val}"]`);
  if (chip) {
    chip.classList.add('active');
    chip.setAttribute('aria-checked', 'true');
  }
}

function selectStyle(gridId, val) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const opt = grid.querySelector(`[data-val="${val}"]`);
  if (opt) {
    grid.querySelectorAll('.style-opt').forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-checked','false'); });
    opt.classList.add('selected');
    opt.setAttribute('aria-checked','true');
  }
}

prefill();

// ── Chip Toggle Logic ──────────────────────────────────────
function initChips(groupId, stateKey) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const toggle = (chip) => {
    const val = chip.dataset.val;
    if (chip.classList.contains('active')) {
      chip.classList.remove('active');
      chip.setAttribute('aria-checked','false');
      state[stateKey] = state[stateKey].filter(v => v !== val);
    } else {
      chip.classList.add('active');
      chip.setAttribute('aria-checked','true');
      state[stateKey].push(val);
    }
  };
  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => toggle(chip));
    chip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(chip); } });
  });
}

initChips('chips-enjoy',    'subjectsEnjoyed');
initChips('chips-dislike',  'subjectsDisliked');
initChips('chips-interests','interests');

// ── Style Option Logic ─────────────────────────────────────
function initStyleGrid(gridId, stateKey) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const select = (opt) => {
    grid.querySelectorAll('.style-opt').forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-checked','false'); });
    opt.classList.add('selected');
    opt.setAttribute('aria-checked','true');
    state[stateKey] = opt.dataset.val;
  };
  grid.querySelectorAll('.style-opt').forEach(opt => {
    opt.addEventListener('click', () => select(opt));
    opt.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(opt); } });
  });
}

initStyleGrid('work-style-grid',  'workStyle');
initStyleGrid('task-type-grid',   'taskType');
initStyleGrid('output-type-grid', 'outputType');

// ── Step Navigation ────────────────────────────────────────
function updateStepUI(step) {
  // Indicators
  for (let i = 1; i <= state.totalSteps; i++) {
    const si = document.getElementById(`si-${i}`);
    if (!si) continue;
    si.classList.remove('active','done');
    if (i < step) { si.classList.add('done'); si.querySelector('.step-num').textContent = '✓'; }
    else if (i === step) si.classList.add('active');
    else si.querySelector('.step-num').textContent = i;
  }
  // Connectors
  for (let i = 1; i < state.totalSteps; i++) {
    const sc = document.getElementById(`sc-${i}`);
    if (sc) sc.classList.toggle('done', i < step);
  }
  // Mini progress bar
  const ppm = document.getElementById('ppm-fill');
  if (ppm) ppm.style.width = ((step - 1) / state.totalSteps * 100) + '%';
}

function goToStep(step) {
  if (step === 2 && !validateStep1()) return;
  if (step === 4 && !validateStep3()) return;

  // Hide current, show target
  document.getElementById(`form-step-${state.currentStep}`).classList.add('hidden');
  const next = document.getElementById(`form-step-${step}`);
  if (next) { next.classList.remove('hidden'); next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  state.currentStep = step;
  updateStepUI(step);
}

// ── Validation ─────────────────────────────────────────────
function validateStep1() {
  const name   = document.getElementById('input-name').value.trim();
  const year   = document.getElementById('input-year').value;
  const branch = document.getElementById('input-branch').value;

  if (!name)   { showToast('Please enter your name', '⚠️'); document.getElementById('input-name').focus();   return false; }
  if (!year)   { showToast('Please select your year', '⚠️'); document.getElementById('input-year').focus();  return false; }
  if (!branch) { showToast('Please select your branch', '⚠️'); document.getElementById('input-branch').focus(); return false; }

  state.name   = name;
  state.year   = year;
  state.branch = branch;
  state.aspirations = document.getElementById('input-aspirations').value.trim();
  return true;
}

function validateStep3() {
  if (!state.interests.length) { showToast('Pick at least one interest!', '⚠️'); return false; }
  state.freeInterests = document.getElementById('input-more-interests').value.trim();
  return true;
}

function validateStep4() {
  if (!state.workStyle)  { showToast('Please pick a work style', '⚠️'); return false; }
  if (!state.taskType)   { showToast('Please pick a task preference', '⚠️'); return false; }
  if (!state.outputType) { showToast('Please pick an output preference', '⚠️'); return false; }
  return true;
}

// ── Submit ─────────────────────────────────────────────────
async function submitProfile() {
  if (!validateStep1()) return;
  if (!validateStep3()) return;
  if (!validateStep4()) return;

  const btn = document.getElementById('submit-profile');
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';

  const profileData = {
    name:            state.name,
    year:            state.year,
    branch:          state.branch,
    aspirations:     state.aspirations,
    subjectsEnjoyed: state.subjectsEnjoyed,
    subjectsDisliked:state.subjectsDisliked,
    interests:       state.interests,
    freeInterests:   state.freeInterests,
    workStyle:       state.workStyle,
    taskType:        state.taskType,
    outputType:      state.outputType,
  };

  if (window.CS) {
    CS.saveProfile(profileData);
  } else {
    localStorage.setItem('cs_profile', JSON.stringify({ ...profileData, savedAt: Date.now() }));
  }

  // Mini progress = 100%
  const ppm = document.getElementById('ppm-fill');
  if (ppm) ppm.style.width = '100%';

  showToast(`Profile saved! Analysing your affinities, ${state.name.split(' ')[0]}...`, '🚀');

  setTimeout(() => {
    window.location.href = 'recommendations.html';
  }, 1200);
}

// ── Returning user ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const returning = window.CS && CS.isReturningUser();
  if (returning) {
    const profile = CS.loadProfile();
    showToast(`Welcome back, ${(profile.name || 'Explorer').split(' ')[0]}! 👋`, '👋');
  }
});
