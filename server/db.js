const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function read() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { leagues: {}, leaderboard: { participants: [], results: {} } };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  // Migrate: add leaderboard if missing
  if (!data.leaderboard) {
    data.leaderboard = { participants: [], results: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
  return data;
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

module.exports = { read, write, generateCode };
