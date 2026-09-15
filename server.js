const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('workouts.db', (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY,
    username TEXT,
    date TEXT,
    sets INTEGER,
    times TEXT,
    duration INTEGER,
    FOREIGN KEY(username) REFERENCES users(username)
  )`);
});

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === '1' && password === '1') {
    res.json({ success: true, message: 'Logged in' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get all workouts for a user
app.get('/api/workouts/:username', (req, res) => {
  const { username } = req.params;

  db.all(`SELECT * FROM workouts WHERE username = ? ORDER BY date DESC`, [username], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// Save a workout
app.post('/api/workouts', (req, res) => {
  const { username, date, sets, times, duration } = req.body;

  db.run(
    `INSERT INTO workouts (username, date, sets, times, duration) VALUES (?, ?, ?, ?, ?)`,
    [username, date, sets, JSON.stringify(times), duration],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// Get today's workout
app.get('/api/workouts/:username/today', (req, res) => {
  const { username } = req.params;
  const today = new Date().toISOString().split('T')[0];

  db.get(
    `SELECT * FROM workouts WHERE username = ? AND date = ?`,
    [username, today],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(row || null);
      }
    }
  );
});

// Get streak
app.get('/api/streak/:username', (req, res) => {
  const { username } = req.params;

  db.all(`SELECT date FROM workouts WHERE username = ? ORDER BY date DESC`, [username], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      let streak = 0;
      const today = new Date();

      if (rows && rows.length > 0) {
        for (let i = 0; i < rows.length; i++) {
          const workoutDate = new Date(rows[i].date);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);

          if (workoutDate.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }
      }

      res.json({ streak });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
