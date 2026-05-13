# World Cup 2026 Match Predictor

A full-featured football predictor site for the 2026 FIFA World Cup — covering all 72 group stage fixtures across 12 groups, with mini-league support.

## Features

- **User profile** — Enter your name, date of birth and country of residence
- **All 72 group stage fixtures** — Teams, flags, stadium, kick-off time (ET), group and round
- **Auto-save predictions** — Scores persist across page refreshes via localStorage
- **Filter by group or round** — Quickly jump to Group A–L or Round 1/2/3
- **Progress bar** — See how many of 72 matches you've predicted
- **Knockout bracket preview** — Read-only view of all knockout rounds (Round of 32 through Final)
- **Mini leagues** — Create a private league, share a 6-character code with friends, view standings
- **Points system** — Exact scoreline = 3 pts, correct result = 1 pt

## Quick Start

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Run in development (two terminals)

**Terminal 1 — Frontend:**
```bash
cd client
npm run dev
# Opens at http://localhost:5173
```

**Terminal 2 — Backend (needed for league features):**
```bash
cd server
npm run dev
# Runs at http://localhost:3001
```

### 3. Or run both together from root

```bash
npm install            # installs concurrently
npm run dev            # starts both
```

## Project Structure

```
world-cup-predictor/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── data/
│       │   ├── wc2026.js    # All 72 fixtures + knockout placeholders
│       │   └── countries.js # Country dropdown list
│       ├── components/
│       │   ├── UserSetup.jsx
│       │   ├── Header.jsx
│       │   ├── FixtureList.jsx
│       │   ├── FixtureCard.jsx
│       │   ├── Filters.jsx
│       │   ├── KnockoutBracket.jsx
│       │   └── LeagueManager.jsx
│       └── hooks/
│           └── useLocalStorage.js
└── server/                  # Express + JSON file database
    ├── server.js
    └── db.js
```

## League Scoring

Once official match results are available, a league admin can update them via:

```bash
curl -X POST http://localhost:3001/api/leagues/YOURCODE/results \
  -H "Content-Type: application/json" \
  -d '{"adminKey":"wc2026admin","results":{"A1":{"home":2,"away":1}}}'
```

Standings recalculate automatically for all members.

## Fixture Data

The fixture list is stored in `client/src/data/wc2026.js`. Group assignments and dates
are based on reasonable projections — verify against the official FIFA schedule once published.
To update a fixture, edit the corresponding entry in the `FIXTURES` array.

## Deploying

1. `cd client && npm run build` — builds static files to `client/dist/`
2. Set `NODE_ENV=production` on your server
3. Run `node server/server.js` — it serves both the API and the static frontend
