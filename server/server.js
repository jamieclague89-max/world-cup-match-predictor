const express = require('express');
const cors = require('cors');
const path = require('path');
const { read, write, generateCode } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// ── Create a new league ──────────────────────────────────
app.post('/api/leagues', (req, res) => {
  const { name, creatorName, creatorCountry } = req.body;
  if (!name || !creatorName) return res.status(400).json({ error: 'Name and creator required' });

  const db = read();
  let code;
  do { code = generateCode(); } while (db.leagues[code]);

  db.leagues[code] = {
    code,
    name,
    createdAt: new Date().toISOString(),
    members: [{ name: creatorName, country: creatorCountry || '', joinedAt: new Date().toISOString(), predictions: {} }],
    results: {},
  };
  write(db);
  res.json({ code, league: db.leagues[code] });
});

// ── Get league by code ───────────────────────────────────
app.get('/api/leagues/:code', (req, res) => {
  const db = read();
  const league = db.leagues[req.params.code.toUpperCase()];
  if (!league) return res.status(404).json({ error: 'League not found' });
  res.json(league);
});

// ── Join a league ────────────────────────────────────────
app.post('/api/leagues/:code/join', (req, res) => {
  const { name, country } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const db = read();
  const league = db.leagues[req.params.code.toUpperCase()];
  if (!league) return res.status(404).json({ error: 'League not found' });

  const existing = league.members.find(m => m.name.toLowerCase() === name.toLowerCase());
  if (existing) return res.json({ message: 'Already a member', league });

  league.members.push({ name, country: country || '', joinedAt: new Date().toISOString(), predictions: {} });
  write(db);
  res.json({ message: 'Joined successfully', league });
});

// ── Submit/update predictions for a member ───────────────
app.post('/api/leagues/:code/predictions', (req, res) => {
  const { memberName, predictions } = req.body;
  if (!memberName || !predictions) return res.status(400).json({ error: 'memberName and predictions required' });

  const db = read();
  const league = db.leagues[req.params.code.toUpperCase()];
  if (!league) return res.status(404).json({ error: 'League not found' });

  const member = league.members.find(m => m.name.toLowerCase() === memberName.toLowerCase());
  if (!member) return res.status(404).json({ error: 'Member not in league' });

  member.predictions = predictions;
  write(db);
  res.json({ message: 'Predictions saved' });
});

// ── Set actual match results (admin) ─────────────────────
app.post('/api/leagues/:code/results', (req, res) => {
  const { results, adminKey } = req.body;
  if (adminKey !== (process.env.ADMIN_KEY || 'wc2026admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const db = read();
  const league = db.leagues[req.params.code.toUpperCase()];
  if (!league) return res.status(404).json({ error: 'League not found' });

  league.results = { ...league.results, ...results };
  write(db);
  res.json({ message: 'Results updated' });
});

// ── Get league standings ─────────────────────────────────
app.get('/api/leagues/:code/standings', (req, res) => {
  const db = read();
  const league = db.leagues[req.params.code.toUpperCase()];
  if (!league) return res.status(404).json({ error: 'League not found' });

  const standings = league.members.map(member => {
    let points = 0;
    let exact = 0;
    let correct = 0;

    Object.entries(league.results).forEach(([matchId, result]) => {
      const pred = member.predictions[matchId];
      if (!pred) return;

      const predHome = parseInt(pred.home, 10);
      const predAway = parseInt(pred.away, 10);
      const actHome = parseInt(result.home, 10);
      const actAway = parseInt(result.away, 10);

      if (predHome === actHome && predAway === actAway) {
        points += 3;
        exact += 1;
      } else {
        const predResult = Math.sign(predHome - predAway);
        const actResult = Math.sign(actHome - actAway);
        if (predResult === actResult) {
          points += 1;
          correct += 1;
        }
      }
    });

    return { name: member.name, country: member.country, points, exact, correct };
  });

  standings.sort((a, b) => b.points - a.points || b.exact - a.exact);
  res.json({ league: { code: league.code, name: league.name }, standings });
});

// ── Scoring helper (5/3/1 system) ───────────────────────────────────────────
function calcScore(predictions, results) {
  let points = 0, exact = 0, correct = 0, gdiff = 0;
  Object.entries(results).forEach(([matchId, result]) => {
    const pred = predictions[matchId];
    if (!pred || pred.home === '' || pred.away === '') return;
    const ph = parseInt(pred.home, 10), pa = parseInt(pred.away, 10);
    const ah = parseInt(result.home, 10), aa = parseInt(result.away, 10);
    if (ph === ah && pa === aa) { points += 5; exact++; return; }
    const predOutcome = Math.sign(ph - pa), actOutcome = Math.sign(ah - aa);
    if (predOutcome === actOutcome) { points += 3; correct++; return; }
    if ((ph - pa) === (ah - aa)) { points += 1; gdiff++; }
  });
  return { points, exact, correct, gdiff };
}

// ── Public leaderboard ───────────────────────────────────────────────────────

// Register / update participant
app.post('/api/leaderboard', (req, res) => {
  const { name, country, predictions } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = read();
  const lb = db.leaderboard;
  const existing = lb.participants.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.country = country || existing.country;
    existing.predictions = predictions || existing.predictions;
    existing.updatedAt = new Date().toISOString();
  } else {
    lb.participants.push({
      name,
      country: country || '',
      predictions: predictions || {},
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  write(db);
  res.json({ message: existing ? 'Updated' : 'Registered' });
});

// Get leaderboard standings
app.get('/api/leaderboard', (req, res) => {
  const db = read();
  const { participants, results } = db.leaderboard;
  const standings = participants.map(p => {
    const predCount = Object.values(p.predictions).filter(v => v.home !== '' || v.away !== '').length;
    const score = calcScore(p.predictions, results);
    return { name: p.name, country: p.country, predicted: predCount, ...score };
  });
  standings.sort((a, b) => b.points - a.points || b.exact - a.exact || b.predicted - a.predicted);
  res.json({ standings, resultsCount: Object.keys(results).length });
});

// Set global results (admin only)
app.post('/api/leaderboard/results', (req, res) => {
  const { results, adminKey } = req.body;
  if (adminKey !== (process.env.ADMIN_KEY || 'wc2026admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const db = read();
  db.leaderboard.results = { ...db.leaderboard.results, ...results };
  write(db);
  res.json({ message: 'Results updated', total: Object.keys(db.leaderboard.results).length });
});

// Catch-all for production SPA routing
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
