// ── CareerSandbox Shared Storage & API Utilities ─────────────
// Handles localStorage persistence + API sync with graceful degradation

const CS = {
  // Use relative path so it works on any host (Railway, Render, localhost)
  API_BASE: '/api',
  _apiAvailable: null,

  // ── User ID ─────────────────────────────────────────────────
  getUserId() {
    let id = localStorage.getItem('cs_user_id');
    if (!id) {
      id = 'cs_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('cs_user_id', id);
    }
    return id;
  },

  // ── Profile ─────────────────────────────────────────────────
  saveProfile(data) {
    localStorage.setItem('cs_profile', JSON.stringify({ ...data, savedAt: Date.now() }));
    this.syncProfile(data).catch(() => {});
  },

  loadProfile() {
    try {
      const raw = localStorage.getItem('cs_profile');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async syncProfile(data) {
    if (!(await this.isApiAvailable())) return;
    try {
      const res = await fetch(`${this.API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.getUserId(), profile: data }),
      });
      const json = await res.json();
      if (json.difficulty) {
        localStorage.setItem('cs_difficulty', json.difficulty);
      }
    } catch { /* offline */ }
  },

  // ── Difficulty ───────────────────────────────────────────────
  getDifficulty() {
    return localStorage.getItem('cs_difficulty') || 'beginner';
  },

  computeDifficultyFromProfile(profile) {
    const year = parseInt(profile?.year) || 1;
    const scores = this.loadCareerScores();
    const avgScore = Object.values(scores).length
      ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
      : 0;
    if (year >= 4 || (avgScore > 75 && year >= 3)) return 'advanced';
    if (year >= 3 || avgScore > 50) return 'intermediate';
    return 'beginner';
  },

  // ── Simulation Scores ────────────────────────────────────────
  saveSimScore(career, scores, elapsedSeconds, tasksData) {
    const key = `cs_sim_${career}`;
    const data = { career, scores, elapsedSeconds, tasksData, savedAt: Date.now() };
    // Save per-career (most recent for that career)
    localStorage.setItem(key, JSON.stringify(data));
    // Save last-played career so results page survives refresh
    localStorage.setItem('cs_last_career', career);

    // ── Append to history (max 20 entries) ──
    const history = this.loadSimHistory();
    history.unshift({ ...data }); // newest first
    if (history.length > 20) history.length = 20;
    localStorage.setItem('cs_sim_history', JSON.stringify(history));

    // Update career scores
    const allScores = this.loadCareerScores();
    const avg = Math.round((scores.engagement + scores.confidence + scores.exploration) / 3);
    allScores[career] = Math.max(allScores[career] || 0, avg);
    localStorage.setItem('cs_career_scores', JSON.stringify(allScores));

    this.syncSimScore(career, scores, elapsedSeconds, tasksData).catch(() => {});
  },

  loadSimHistory() {
    try {
      const raw = localStorage.getItem('cs_sim_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  loadLastSim() {
    // Returns the most recent sim result regardless of career
    const history = this.loadSimHistory();
    if (history.length > 0) return history[0];
    return null;
  },



  loadSimScore(career) {
    try {
      const raw = localStorage.getItem(`cs_sim_${career}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  loadCareerScores() {
    try {
      const raw = localStorage.getItem('cs_career_scores');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  async syncSimScore(career, scores, elapsedSeconds, tasksData) {
    if (!(await this.isApiAvailable())) return;
    try {
      const profile = this.loadProfile();
      await fetch(`${this.API_BASE}/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.getUserId(),
          career,
          difficulty: this.getDifficulty(),
          scores,
          tasksData,
          elapsedSeconds,
        }),
      });
    } catch { /* offline */ }
  },

  // ── Recommendations ─────────────────────────────────────────
  async getRecommendations() {
    const profile = this.loadProfile();
    const careerScores = this.loadCareerScores();
    const localReco = this.computeLocalRecommendations(profile, careerScores);

    if (!(await this.isApiAvailable())) return localReco;

    try {
      const res = await fetch(`${this.API_BASE}/recommendations/${this.getUserId()}`);
      if (res.ok) {
        const json = await res.json();
        return { scores: json.scores, difficulty: json.difficulty, source: 'api' };
      }
    } catch { /* offline */ }

    return localReco;
  },

  computeLocalRecommendations(profile, careerScores) {
    const base = { ux: 50, fe: 50, pm: 50, da: 48, cs: 46, entrepreneurship: 48, aiml: 44 };

    const interestMap = {
      design: { ux: 22, cs: 5, aiml: 3 },
      coding: { fe: 22, da: 5, aiml: 12 },
      data: { da: 25, pm: 5, aiml: 15 },
      writing: { cs: 25, pm: 5 },
      people: { pm: 18, cs: 8, entrepreneurship: 10 },
      strategy: { pm: 22, entrepreneurship: 18 },
      research: { da: 18, pm: 12, aiml: 10 },
      ux: { ux: 28, pm: 12 },
      creative: { ux: 18, cs: 15, entrepreneurship: 5 },
      biz: { pm: 20, entrepreneurship: 25 },
      tech: { fe: 15, da: 12, aiml: 18 },
      problem: { fe: 15, da: 12, aiml: 10 },
      finance: { pm: 10, entrepreneurship: 15, da: 8 },
      social: { cs: 12, entrepreneurship: 10 },
      video: { cs: 15, ux: 8 },
    };

    const subjectMap = {
      cs: { fe: 18, da: 10, aiml: 12 },
      maths: { da: 18, aiml: 12 },
      stats: { da: 22, aiml: 10 },
      design: { ux: 22 },
      english: { cs: 18, pm: 6 },
      psych: { ux: 12, pm: 12, cs: 6 },
      econ: { pm: 10, da: 6, entrepreneurship: 12 },
      mgmt: { pm: 22, entrepreneurship: 15 },
    };

    const outputMap = {
      visual: { ux: 18 },
      written: { cs: 22, pm: 6 },
      code: { fe: 22, aiml: 8 },
      strategy: { pm: 18, entrepreneurship: 15 },
    };

    if (profile) {
      (profile.interests || []).forEach(i => {
        const m = interestMap[i] || {};
        Object.entries(m).forEach(([k, v]) => { base[k] = Math.min(97, (base[k]||50) + v); });
      });
      (profile.subjectsEnjoyed || []).forEach(s => {
        const m = subjectMap[s] || {};
        Object.entries(m).forEach(([k, v]) => { base[k] = Math.min(97, (base[k]||50) + v); });
      });
      if (profile.outputType && outputMap[profile.outputType]) {
        Object.entries(outputMap[profile.outputType]).forEach(([k, v]) => {
          base[k] = Math.min(97, (base[k]||50) + v);
        });
      }
    }

    // Boost from existing sim scores
    Object.entries(careerScores).forEach(([career, score]) => {
      if (base[career] !== undefined) {
        base[career] = Math.min(98, base[career] + Math.floor(score / 5));
      }
    });

    const difficulty = profile ? this.computeDifficultyFromProfile(profile) : 'beginner';
    return { scores: base, difficulty, source: 'local' };
  },

  // ── Dashboard ────────────────────────────────────────────────
  async getDashboardData() {
    if (!(await this.isApiAvailable())) {
      return this.getLocalDashboard();
    }
    try {
      const res = await fetch(`${this.API_BASE}/dashboard/${this.getUserId()}`);
      if (res.ok) return { ...(await res.json()), source: 'api' };
    } catch { /* offline */ }
    return this.getLocalDashboard();
  },

  getLocalDashboard() {
    const profile = this.loadProfile();
    const careerScores = this.loadCareerScores();
    const careersTried = Object.keys(careerScores).length;
    const avgConfidence = careersTried
      ? Math.round(Object.values(careerScores).reduce((a, b) => a + b, 0) / careersTried)
      : 0;

    const clarityScore = careersTried === 1 ? 85 : careersTried === 2 ? 70 : careersTried >= 4 ? 35 : 55;
    const topCareers = Object.entries(careerScores).sort(([,a],[,b]) => b - a).slice(0, 2).map(([c]) => c.toUpperCase());

    return {
      profile, careerScores,
      wellbeing: {
        clarityScore,
        confidenceTrend: avgConfidence > 65 ? 'growing' : avgConfidence > 40 ? 'steady' : 'building',
        explorationFatigue: careersTried >= 4 ? 'high' : careersTried >= 3 ? 'medium' : 'low',
        careersTried,
        focusRecommendation: careersTried >= 3
          ? `You've explored ${careersTried} careers. Consider focusing on: ${topCareers.join(' & ')}.`
          : 'You\'re exploring at a healthy pace. Keep going!',
        avgConfidence,
      },
      source: 'local',
    };
  },

  // ── Session (in-progress sim) ─────────────────────────────────
  saveSession(key, data) {
    sessionStorage.setItem(`cs_sess_${key}`, JSON.stringify(data));
  },
  loadSession(key) {
    try {
      const raw = sessionStorage.getItem(`cs_sess_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  clearSession(key) {
    sessionStorage.removeItem(`cs_sess_${key}`);
  },

  // ── API availability check ───────────────────────────────────
  async isApiAvailable() {
    if (this._apiAvailable !== null) return this._apiAvailable;
    try {
      const res = await fetch(`${this.API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      this._apiAvailable = res.ok;
    } catch {
      this._apiAvailable = false;
    }
    // Reset every 30 seconds
    setTimeout(() => { this._apiAvailable = null; }, 30000);
    return this._apiAvailable;
  },

  // ── Clear all data ───────────────────────────────────────────
  clearAll() {
    Object.keys(localStorage).filter(k => k.startsWith('cs_')).forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  },

  // ── Returning user check ─────────────────────────────────────
  isReturningUser() {
    const profile = this.loadProfile();
    return profile && profile.name;
  },
};

window.CS = CS;
