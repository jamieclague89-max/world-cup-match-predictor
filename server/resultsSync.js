/**
 * Automated results sync from football-data.org
 *
 * Polls the free API every 5 minutes for finished World Cup 2026 matches
 * and writes results into db.leaderboard.results automatically.
 *
 * Requires: FOOTBALL_DATA_API_KEY environment variable
 * Free tier: 10 requests/minute, covers WC matches at /v4/competitions/WC/matches
 */

const https    = require('https');
const supabase = require('./supabase');
const FIXTURES = require('./fixtures-lookup');
const { sendResultNotifications } = require('./notifications');

// ── Team name normalisation ──────────────────────────────────────────────────
// Maps football-data.org names → our internal names
const TEAM_NAME_MAP = {
  'Korea Republic':             'South Korea',
  'United States':              'USA',
  'Côte d\'Ivoire':             'Ivory Coast',
  'Cote d\'Ivoire':             'Ivory Coast',
  "Côte d'Ivoire":              'Ivory Coast',
  "Cote d'Ivoire":              'Ivory Coast',
  'Bosnia and Herzegovina':     'Bosnia & Herzegovina',
  'Congo DR':                   'DR Congo',
  'Congo, DR':                  'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'DR Congo':                   'DR Congo',
  'Curacao':                    'Curaçao',
  'Czech Republic':             'Czechia',
  'Czechia':                    'Czechia',
  'New Zealand':                'New Zealand',
  'Saudi Arabia':               'Saudi Arabia',
  'Cape Verde':                 'Cape Verde',
  'South Africa':               'South Africa',
  'North Macedonia':            'North Macedonia',
  'Trinidad and Tobago':        'Trinidad & Tobago',
  'Korea DPR':                  'North Korea',
  // Pass-throughs (already correct)
  'Mexico':       'Mexico',
  'Canada':       'Canada',
  'Brazil':       'Brazil',
  'Haiti':        'Haiti',
  'Scotland':     'Scotland',
  'Morocco':      'Morocco',
  'Australia':    'Australia',
  'Turkey':       'Turkey',
  'Paraguay':     'Paraguay',
  'Germany':      'Germany',
  'Ecuador':      'Ecuador',
  'Netherlands':  'Netherlands',
  'Japan':        'Japan',
  'Sweden':       'Sweden',
  'Tunisia':      'Tunisia',
  'Belgium':      'Belgium',
  'Egypt':        'Egypt',
  'Iran':         'Iran',
  'Spain':        'Spain',
  'Uruguay':      'Uruguay',
  'France':       'France',
  'Senegal':      'Senegal',
  'Iraq':         'Iraq',
  'Norway':       'Norway',
  'Argentina':    'Argentina',
  'Algeria':      'Algeria',
  'Austria':      'Austria',
  'Jordan':       'Jordan',
  'Portugal':     'Portugal',
  'Uzbekistan':   'Uzbekistan',
  'Colombia':     'Colombia',
  'England':      'England',
  'Croatia':      'Croatia',
  'Ghana':        'Ghana',
  'Panama':       'Panama',
  'Qatar':        'Qatar',
  'Switzerland':  'Switzerland',
};

function normalise(name) {
  return TEAM_NAME_MAP[name] || name;
}

// ── Fixture lookup ────────────────────────────────────────────────────────────
// Build a lookup: "HomeTeam|AwayTeam" → fixture id
const fixtureIndex = {};
FIXTURES.forEach(f => {
  fixtureIndex[`${f.homeTeam}|${f.awayTeam}`] = f.id;
});

function findFixtureId(homeTeam, awayTeam) {
  const key = `${normalise(homeTeam)}|${normalise(awayTeam)}`;
  return fixtureIndex[key] || null;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
// Returns the parsed JSON body.
// Also reads football-data.org rate-limit headers and stores them in `status`
// so the next sync() call can skip if we're close to the limit.
//   X-Requests-Available-Minute  — how many calls remain in the current window
//   X-RequestCounter-Reset       — seconds until the window resets
function apiGet(apiKey, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path,
      method: 'GET',
      headers: { 'X-Auth-Token': apiKey },
    };
    const req = https.request(options, res => {
      // ── Read rate-limit headers immediately (before body arrives) ──────────
      const available = parseInt(res.headers['x-requests-available-minute'], 10);
      const resetIn   = parseInt(res.headers['x-requestcounter-reset'],      10);
      if (!isNaN(available)) status.requestsAvailable = available;
      if (!isNaN(resetIn))   status.rateLimitReset    = resetIn;
      if (!isNaN(available)) {
        console.log(`[resultsSync] Rate-limit headers: ${available} requests remaining, reset in ${isNaN(resetIn) ? '?' : resetIn}s`);
      }

      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);

          if (res.statusCode === 429) {
            // Hard rate-limit hit — back off for the reset window (minimum 60 s)
            const backoffMs = (!isNaN(resetIn) ? resetIn + 2 : 60) * 1000;
            console.warn(`[resultsSync] 429 Too Many Requests — backing off ${Math.round(backoffMs / 1000)}s`);
            reject(new Error(`RATE_LIMITED:${backoffMs}`));
          } else if (res.statusCode !== 200) {
            reject(new Error(`API ${res.statusCode}: ${json.message || body}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

// ── State ─────────────────────────────────────────────────────────────────────
let status = {
  enabled:          false,
  lastRun:          null,
  lastSuccess:      null,
  lastError:        null,
  resultsFound:     0,
  newThisRun:       0,
  apiKey:           null,
  // Rate-limit tracking (populated from response headers)
  requestsAvailable: null,
  rateLimitReset:    null,
};

// ── Core sync function ────────────────────────────────────────────────────────
async function sync() {
  if (!status.apiKey) return;

  // Respect rate-limit headers from the previous response.
  // If fewer than 3 requests remain in the current window, skip this run —
  // the next scheduled poll will fire after the window has reset.
  if (status.requestsAvailable !== null && status.requestsAvailable < 3) {
    const waitSecs = status.rateLimitReset ?? 60;
    console.log(`[resultsSync] Rate limit low (${status.requestsAvailable} remaining) — skipping run, window resets in ~${waitSecs}s`);
    return;
  }

  status.lastRun = new Date().toISOString();
  status.newThisRun = 0;

  try {
    // Fetch finished WC 2026 matches
    const data = await apiGet(
      status.apiKey,
      '/v4/competitions/WC/matches?status=FINISHED&season=2026'
    );

    const matches = data.matches || [];
    if (matches.length === 0) {
      status.lastSuccess = new Date().toISOString();
      return;
    }

    if (!supabase) {
      status.lastError = 'Supabase not configured — skipping write';
      return;
    }

    // Fetch currently stored results so we can diff
    const { data: existingRows, error: fetchErr } = await supabase
      .from('results')
      .select('fixture_id, home_score, away_score, scorer');

    if (fetchErr) throw new Error(fetchErr.message);

    const storedMap = {};
    existingRows?.forEach(r => { storedMap[r.fixture_id] = r; });

    for (const match of matches) {
      const homeTeam = match.homeTeam?.name;
      const awayTeam = match.awayTeam?.name;
      const score    = match.score;

      if (!homeTeam || !awayTeam || !score) continue;

      const ft = score.fullTime;
      if (ft?.home == null || ft?.away == null) continue;

      const fixtureId = findFixtureId(homeTeam, awayTeam);
      if (!fixtureId) {
        console.warn(`[resultsSync] No fixture match for: ${homeTeam} vs ${awayTeam}`);
        continue;
      }

      // First goalscorer (free tier may not include goal data)
      let firstScorer = '';
      if (match.goals?.length > 0) {
        const regularGoals = match.goals
          .filter(g => g.type !== 'OWN_GOAL' && g.scorer?.name)
          .sort((a, b) => (a.minute || 0) - (b.minute || 0));
        if (regularGoals.length > 0) firstScorer = regularGoals[0].scorer.name;
      }

      const homeScore = String(ft.home);
      const awayScore = String(ft.away);

      // Only upsert if something changed
      const stored = storedMap[fixtureId];
      if (
        !stored ||
        stored.home_score !== homeScore ||
        stored.away_score !== awayScore ||
        stored.scorer !== firstScorer
      ) {
        const { error: upsertErr } = await supabase.from('results').upsert(
          {
            fixture_id: fixtureId,
            home_score: homeScore,
            away_score: awayScore,
            scorer:     firstScorer,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'fixture_id' }
        );

        if (upsertErr) {
          console.error(`[resultsSync] Upsert failed for ${fixtureId}: ${upsertErr.message}`);
        } else {
          status.newThisRun++;
          console.log(`[resultsSync] Recorded ${fixtureId}: ${homeTeam} ${homeScore}–${awayScore} ${awayTeam}${firstScorer ? ` (scorer: ${firstScorer})` : ''}`);
          // Fire-and-forget result notifications to all users who predicted this
          sendResultNotifications(fixtureId, normalise(homeTeam), normalise(awayTeam), homeScore, awayScore, firstScorer)
            .catch(e => console.error(`[resultsSync] Notification error for ${fixtureId}:`, e.message));
        }
      }
    }

    // Refresh stored count
    const { data: allResults } = await supabase.from('results').select('fixture_id');
    status.resultsFound = allResults?.length || 0;
    status.lastSuccess  = new Date().toISOString();

  } catch (err) {
    if (err.message.startsWith('RATE_LIMITED:')) {
      const backoffMs = parseInt(err.message.split(':')[1], 10) || 60000;
      status.lastError = `Rate limited — retrying in ${Math.round(backoffMs / 1000)}s`;
      // Schedule a one-off retry after the backoff (in addition to the normal 5-min interval)
      setTimeout(sync, backoffMs);
    } else {
      status.lastError = err.message;
      console.error(`[resultsSync] Error: ${err.message}`);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
let interval = null;

function start(apiKey) {
  if (!apiKey) {
    console.warn('[resultsSync] No FOOTBALL_DATA_API_KEY set — automated results disabled.');
    return;
  }

  status.apiKey   = apiKey;
  status.enabled  = true;

  // Run immediately on start, then every 5 minutes
  sync();
  interval = setInterval(sync, 5 * 60 * 1000);
  console.log('[resultsSync] Started — polling football-data.org every 5 minutes.');
}

function stop() {
  if (interval) clearInterval(interval);
  status.enabled = false;
}

function getStatus() {
  return {
    ...status,
    apiKey:            status.apiKey ? '***configured***' : null,
    totalResults:      status.resultsFound,
    requestsAvailable: status.requestsAvailable,
    rateLimitReset:    status.rateLimitReset,
  };
}

// Run a single sync cycle (used by Vercel Cron instead of the interval)
async function runOnce(apiKey) {
  if (apiKey && !status.apiKey) {
    status.apiKey  = apiKey;
    status.enabled = true;
  }
  await sync();
}

module.exports = { start, stop, getStatus, runOnce };
