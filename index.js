// ── CareerSandbox API Server ─────────────────────────────────
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const { initDB, run, get, all } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ── Logic Helpers ─────────────────────────────────────────────
function ensureUser(userId) {
  run(`INSERT OR IGNORE INTO users (id) VALUES (:id)`, { ':id': userId });
}

function computeDifficulty(year, existingScores) {
  const yearNum = parseInt(year) || 1;
  const avgScore = existingScores.length
    ? existingScores.reduce((a, b) => a + (b.score || 0), 0) / existingScores.length
    : 0;
  if (yearNum >= 4 || (avgScore > 75 && yearNum >= 3)) return 'advanced';
  if (yearNum >= 3 || avgScore > 50) return 'intermediate';
  return 'beginner';
}

function computeRecommendations(profile, careerScores) {
  const base = { ux: 50, fe: 50, pm: 50, da: 48, cs: 46, entrepreneurship: 48, aiml: 44 };

  const interestMap = {
    design: { ux: 22, cs: 5 }, coding: { fe: 22, aiml: 12 }, data: { da: 25, aiml: 15 },
    writing: { cs: 25, pm: 5 }, people: { pm: 18, entrepreneurship: 10 },
    strategy: { pm: 22, entrepreneurship: 18 }, research: { da: 18, aiml: 10 },
    ux: { ux: 28, pm: 12 }, creative: { ux: 18, cs: 15 },
    biz: { pm: 20, entrepreneurship: 25 }, tech: { fe: 15, aiml: 18 },
    problem: { fe: 15, da: 12 }, finance: { entrepreneurship: 15, da: 8 },
    social: { cs: 12, entrepreneurship: 10 },
  };
  const subjectMap = {
    cs: { fe: 18, aiml: 12 }, maths: { da: 18, aiml: 12 }, stats: { da: 22 },
    design: { ux: 22 }, english: { cs: 18 }, psych: { ux: 12, pm: 12 },
    econ: { pm: 10, entrepreneurship: 12 }, mgmt: { pm: 22, entrepreneurship: 15 },
  };

  try {
    const interests = JSON.parse(profile.interests || '[]');
    const liked     = JSON.parse(profile.subjects_liked || '[]');
    const output    = profile.output_type;

    interests.forEach(i => {
      Object.entries(interestMap[i] || {}).forEach(([k, v]) => {
        base[k] = Math.min(97, (base[k] || 50) + v);
      });
    });
    liked.forEach(s => {
      Object.entries(subjectMap[s] || {}).forEach(([k, v]) => {
        base[k] = Math.min(97, (base[k] || 50) + v);
      });
    });
    const outMap = { visual: { ux: 18 }, written: { cs: 22 }, code: { fe: 22 }, strategy: { pm: 18, entrepreneurship: 15 } };
    if (output && outMap[output]) {
      Object.entries(outMap[output]).forEach(([k, v]) => { base[k] = Math.min(97, (base[k] || 50) + v); });
    }
    careerScores.forEach(({ career, score }) => {
      if (base[career] !== undefined) base[career] = Math.min(98, base[career] + Math.floor(score / 5));
    });
  } catch (e) { /* ignore */ }

  return base;
}

function computeWellbeing(simResults, careerScores) {
  const careersTried = new Set(simResults.map(r => r.career)).size;
  const avgConfidence = simResults.length
    ? Math.round(simResults.reduce((a, b) => a + (b.confidence || 0), 0) / simResults.length) : 0;
  const clarityScore = careersTried === 1 ? 85 : careersTried === 2 ? 70 : careersTried >= 4 ? 35 : 55;
  const topCareers = [...careerScores].sort((a, b) => b.score - a.score).slice(0, 2).map(c => c.career.toUpperCase());
  return {
    clarityScore, avgConfidence,
    confidenceTrend: avgConfidence > 65 ? 'growing' : avgConfidence > 40 ? 'steady' : 'building',
    explorationFatigue: careersTried >= 4 ? 'high' : careersTried >= 3 ? 'medium' : 'low',
    careersTried,
    focusRecommendation: careersTried >= 3
      ? `You've explored ${careersTried} careers. Consider focusing on: ${topCareers.join(' & ')}.`
      : "You're exploring at a healthy pace. Keep going!",
  };
}

// ── Routes ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', ts: new Date().toISOString() });
});

app.post('/api/profile', (req, res) => {
  try {
    const { userId, profile } = req.body;
    if (!userId || !profile) return res.status(400).json({ error: 'userId and profile required' });

    ensureUser(userId);
    const existingScores = all(`SELECT career, score FROM career_scores WHERE user_id = :uid`, { ':uid': userId });
    const difficulty = computeDifficulty(profile.year, existingScores);
    const profileId = profile.profileId || uuidv4();

    run(`INSERT OR REPLACE INTO profiles
        (id, user_id, name, year, branch, aspirations, subjects_liked, subjects_disliked,
         interests, other_interests, work_style, task_type, output_type, difficulty, updated_at)
        VALUES (:id, :uid, :name, :year, :branch, :asp, :sl, :sd, :int, :oi, :ws, :tt, :ot, :diff, datetime('now'))`,
      { ':id': profileId, ':uid': userId, ':name': profile.name || null, ':year': profile.year || null,
        ':branch': profile.branch || null, ':asp': profile.aspirations || null,
        ':sl': JSON.stringify(profile.subjectsEnjoyed || []), ':sd': JSON.stringify(profile.subjectsDisliked || []),
        ':int': JSON.stringify(profile.interests || []), ':oi': profile.otherInterests || null,
        ':ws': profile.workStyle || null, ':tt': profile.taskType || null,
        ':ot': profile.outputType || null, ':diff': difficulty });

    res.json({ success: true, difficulty, profileId });
  } catch (err) {
    console.error('POST /api/profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/profile/:userId', (req, res) => {
  try {
    const profile = get(`SELECT * FROM profiles WHERE user_id = :uid ORDER BY updated_at DESC LIMIT 1`,
      { ':uid': req.params.userId });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    profile.subjectsEnjoyed  = JSON.parse(profile.subjects_liked  || '[]');
    profile.subjectsDisliked = JSON.parse(profile.subjects_disliked || '[]');
    profile.interests        = JSON.parse(profile.interests || '[]');
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/recommendations/:userId', (req, res) => {
  try {
    const profile = get(`SELECT * FROM profiles WHERE user_id = :uid ORDER BY updated_at DESC LIMIT 1`,
      { ':uid': req.params.userId });
    if (!profile) return res.status(404).json({ error: 'Not found' });
    const careerScores = all(`SELECT career, score FROM career_scores WHERE user_id = :uid`, { ':uid': req.params.userId });
    const scores = computeRecommendations(profile, careerScores);
    const difficulty = computeDifficulty(profile.year, careerScores);
    res.json({ scores, difficulty, career_scores: careerScores });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/simulation', (req, res) => {
  try {
    const { userId, career, difficulty, scores, tasksData, elapsedSeconds } = req.body;
    if (!userId || !career) return res.status(400).json({ error: 'userId and career required' });

    ensureUser(userId);
    const simId = uuidv4();

    run(`INSERT INTO simulation_results (id, user_id, career, difficulty, engagement, confidence, exploration, tasks_data, elapsed_seconds)
         VALUES (:id, :uid, :career, :diff, :eng, :conf, :expl, :tasks, :elapsed)`,
      { ':id': simId, ':uid': userId, ':career': career, ':diff': difficulty || 'beginner',
        ':eng': scores?.engagement || 0, ':conf': scores?.confidence || 0,
        ':expl': scores?.exploration || 0, ':tasks': JSON.stringify(tasksData || {}),
        ':elapsed': elapsedSeconds || 0 });

    const avgScore = Math.round(((scores?.engagement || 0) + (scores?.confidence || 0) + (scores?.exploration || 0)) / 3);

    // Upsert career score (keep highest)
    const existing = get(`SELECT score FROM career_scores WHERE user_id = :uid AND career = :career`,
      { ':uid': userId, ':career': career });
    if (existing) {
      if (avgScore > existing.score) {
        run(`UPDATE career_scores SET score = :score, updated_at = datetime('now') WHERE user_id = :uid AND career = :career`,
          { ':score': avgScore, ':uid': userId, ':career': career });
      }
    } else {
      run(`INSERT INTO career_scores (id, user_id, career, score) VALUES (:id, :uid, :career, :score)`,
        { ':id': uuidv4(), ':uid': userId, ':career': career, ':score': avgScore });
    }

    res.json({ success: true, simId, avgScore });
  } catch (err) {
    console.error('POST /api/simulation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/simulations/:userId', (req, res) => {
  try {
    const results = all(`SELECT * FROM simulation_results WHERE user_id = :uid ORDER BY completed_at DESC`,
      { ':uid': req.params.userId });
    const careerScores = all(`SELECT career, score FROM career_scores WHERE user_id = :uid`,
      { ':uid': req.params.userId });
    res.json({ results, careerScores });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/dashboard/:userId', (req, res) => {
  try {
    const profile      = get(`SELECT * FROM profiles WHERE user_id = :uid ORDER BY updated_at DESC LIMIT 1`,
      { ':uid': req.params.userId });
    const simResults   = all(`SELECT * FROM simulation_results WHERE user_id = :uid ORDER BY completed_at DESC`,
      { ':uid': req.params.userId });
    const careerScores = all(`SELECT career, score FROM career_scores WHERE user_id = :uid`,
      { ':uid': req.params.userId });
    const recommendations = profile ? computeRecommendations(profile, careerScores) : {};
    const wellbeing = computeWellbeing(simResults, careerScores);
    res.json({ profile, simResults, careerScores, recommendations, wellbeing });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Start ─────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🧪 CareerSandbox API → http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   App:    http://localhost:${PORT}/index.html\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
