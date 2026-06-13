// ── Landing Page JS v3 ────────────────────────────────────────
// Warm Explorer theme — light mode, no particle dark effects

// ── Navbar scroll ─────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ── Mobile hamburger ─────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen.toString());
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Returning user detection ─────────────────────────────────
function checkReturningUser() {
  if (!window.CS) return;
  const profile = CS.loadProfile();
  const banner  = document.getElementById('returning-banner');
  if (profile && profile.name && banner) {
    const nameEl = document.getElementById('returning-name');
    if (nameEl) nameEl.textContent = `Welcome back, ${profile.name.split(' ')[0]}!`;
    banner.classList.remove('hidden');
  }
}
checkReturningUser();

// ── Scroll reveal ─────────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Smooth anchor scrolling ───────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── Journey map node hover ────────────────────────────────────
document.querySelectorAll('.jm-node').forEach(node => {
  node.addEventListener('click', () => { window.location.href = 'profile.html'; });
  node.addEventListener('keydown', e => { if (e.key === 'Enter') window.location.href = 'profile.html'; });
  node.setAttribute('tabindex', '0');
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', 'Start exploring careers');
});

// ── Career card "Try Simulation" links ───────────────────────
document.querySelectorAll('.lc-btn').forEach(btn => {
  const card = btn.closest('.lc-card');
  if (!card) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    if (window.CS && CS.loadProfile()) {
      const careerMap = {
        'lc-ux':'ux','lc-pm':'pm','lc-fe':'fe','lc-da':'da',
        'lc-cs':'cs','lc-ent':'entrepreneurship','lc-aiml':'aiml'
      };
      const career = careerMap[card.id];
      if (career) {
        sessionStorage.setItem('cs_career', career);
        window.location.href = `simulation.html?career=${career}`;
        return;
      }
    }
    window.location.href = 'profile.html';
  });
});

// ── API status badge ──────────────────────────────────────────
async function checkApiStatus() {
  const badge    = document.getElementById('api-badge');
  const badgeText = document.getElementById('api-badge-text');
  if (!badge) return;

  if (window.CS) {
    const available = await CS.isApiAvailable();
    badge.classList.toggle('online',  available);
    badge.classList.toggle('offline', !available);
    if (badgeText) badgeText.textContent = available ? 'API Connected' : 'Offline mode';
  } else {
    badge.classList.add('offline');
    if (badgeText) badgeText.textContent = 'Offline mode';
  }
}
setTimeout(checkApiStatus, 600);

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, icon = '✨') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const msgEl = document.getElementById('toast-message') || document.getElementById('toast-msg');
  if (msgEl) msgEl.textContent = msg;
  const iconEl = toast.querySelector('.toast-icon');
  if (iconEl) iconEl.textContent = icon;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Show completion toast if returning from simulation
const justCompleted = sessionStorage.getItem('cs_just_completed');
if (justCompleted) {
  sessionStorage.removeItem('cs_just_completed');
  setTimeout(() => showToast('Simulation complete! Your results are ready.', '🎉'), 800);
}
