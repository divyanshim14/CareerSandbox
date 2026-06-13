// ── CareerSandbox Database Layer (sql.js – pure JS SQLite) ───
const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'careersandbox.db');

let db;
let SQL;

async function initDB() {
  SQL = await initSqlJs();

  // Load existing DB file if present
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      name              TEXT,
      year              TEXT,
      branch            TEXT,
      aspirations       TEXT,
      subjects_liked    TEXT,
      subjects_disliked TEXT,
      interests         TEXT,
      other_interests   TEXT,
      work_style        TEXT,
      task_type         TEXT,
      output_type       TEXT,
      difficulty        TEXT DEFAULT 'beginner',
      updated_at        TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS simulation_results (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      career          TEXT NOT NULL,
      difficulty      TEXT,
      engagement      INTEGER DEFAULT 0,
      confidence      INTEGER DEFAULT 0,
      exploration     INTEGER DEFAULT 0,
      tasks_data      TEXT,
      elapsed_seconds INTEGER DEFAULT 0,
      completed_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS career_scores (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      career     TEXT NOT NULL,
      score      INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  saveDB();
  return db;
}

// Save DB to disk after every write
function saveDB() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper to normalise params — sql.js accepts:
//   positional: [val1, val2]  →  stmt.bind([val1,val2])
//   named:      { ':key': val } →  stmt.bind({ ':key': val })
// Both work via stmt.bind(). The old positional-only path via getAsObject(params)
// silently ignored named objects, causing all named-param queries to return no rows.
function normalise(params) {
  if (!params) return {};
  if (Array.isArray(params)) return params;
  return params; // object pass-through for named params
}

// Helper to run a statement and auto-save
function run(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(normalise(params));
  stmt.step();
  stmt.free();
  saveDB();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(normalise(params));
  const result = stmt.step() ? stmt.getAsObject() : {};
  stmt.free();
  return Object.keys(result).length ? result : null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(normalise(params));
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { initDB, run, get, all, saveDB };
