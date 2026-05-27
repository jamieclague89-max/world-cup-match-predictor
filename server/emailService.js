/**
 * emailService.js — World Cup 2026 Predictor
 * Sends notification emails via Resend.
 *
 * To switch to a real domain later:
 *   1. Verify domain in Resend dashboard
 *   2. Update NOTIFY_FROM in server/.env
 *   Done — no code changes needed.
 */

const { Resend } = require('resend');

const resend  = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM    = process.env.NOTIFY_FROM || 'onboarding@resend.dev';
const APP_URL = process.env.APP_URL     || 'http://localhost:5173';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isConfigured() {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — email disabled');
    return false;
  }
  return true;
}

/** Fetch all user emails from Supabase auth (service role bypasses RLS) */
async function getAllUsers(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users;
}

/** Fetch profiles (id → name map) for a list of user IDs */
async function getProfiles(supabase, ids) {
  const { data } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', ids);
  const map = {};
  (data || []).forEach(p => { map[p.id] = p.name; });
  return map;
}

/** Single-match scoring — mirrors server calcScore */
function scoreMatch(pred, result) {
  if (!pred || pred.home === '' || pred.away === '' || pred.home == null) {
    return { points: 0, outcome: 'no-prediction', scorerHit: false };
  }
  const ph = parseInt(pred.home, 10), pa = parseInt(pred.away, 10);
  const ah = parseInt(result.home, 10), aa = parseInt(result.away, 10);
  let points = 0, outcome = 'wrong';

  if (ph === ah && pa === aa) {
    points += 5; outcome = 'exact';
  } else {
    const po = Math.sign(ph - pa), ao = Math.sign(ah - aa);
    if (po === ao)                    { points += 3; outcome = 'correct'; }
    else if ((ph - pa) === (ah - aa)) { points += 1; outcome = 'gdiff';   }
  }
  const scorerHit =
    (ah + aa) > 0 && pred.scorer && result.scorer &&
    pred.scorer.toLowerCase().trim() === result.scorer.toLowerCase().trim();
  if (scorerHit) points += 3;
  return { points, outcome, scorerHit };
}

const OUTCOME_LABEL = {
  exact:           '🎯 Exact score (+5)',
  correct:         '✅ Correct result (+3)',
  gdiff:           '📏 Goal difference (+1)',
  wrong:           '❌ No points',
  'no-prediction': '— No prediction entered',
};

// ── HTML base template ────────────────────────────────────────────────────────
function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f1923;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;min-height:100vh;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#162130;border-radius:16px 16px 0 0;padding:24px 28px;border-bottom:1px solid #1e2d3d;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">🏆 World Cup 2026</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#c9a227;">Match Predictor</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#162130;padding:24px 28px;border-radius:0 0 16px 16px;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3a4f63;">
            World Cup 2026 Predictor ·
            <a href="${APP_URL}" style="color:#c9a227;text-decoration:none;">Open app</a>
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#2a3d4f;">
            You're receiving this because you have an account on the predictor.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Template: Daily results digest ───────────────────────────────────────────
function dailyResultsHtml({ name, dateLabel, matchRows, dayPoints, totalPoints, rank, totalPlayers }) {
  const matchHtml = matchRows.map(({ homeTeam, awayTeam, actualHome, actualAway,
                                     predHome, predAway, outcome, points, scorerHit, scorerPick }) => {
    const noPred   = outcome === 'no-prediction';
    const outLabel = OUTCOME_LABEL[outcome] ?? '—';
    const ptColour = points >= 5 ? '#c9a227' : points >= 3 ? '#5cb85c' : points >= 1 ? '#5b9bd5' : '#3a4f63';

    return `
    <tr style="border-top:1px solid #1e2d3d;">
      <!-- Match -->
      <td style="padding:12px 12px 12px 0;vertical-align:top;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">
          ${homeTeam} <span style="color:#c9a227;">${actualHome}–${actualAway}</span> ${awayTeam}
        </p>
        ${noPred
          ? `<p style="margin:4px 0 0;font-size:12px;color:#3a4f63;">No prediction entered</p>`
          : `<p style="margin:4px 0 0;font-size:12px;color:#8899aa;">
               Your pick: <strong style="color:#ffffff;">${predHome}–${predAway}</strong>
             </p>
             <p style="margin:2px 0 0;font-size:12px;color:#8899aa;">${outLabel}</p>
             ${scorerHit
               ? `<p style="margin:2px 0 0;font-size:12px;color:#c9a227;">⚽ Scorer correct! +3 pts</p>`
               : scorerPick
                 ? `<p style="margin:2px 0 0;font-size:12px;color:#3a4f63;">⚽ ${scorerPick} — no match</p>`
                 : ''
             }`
        }
      </td>
      <!-- Points -->
      <td style="padding:12px 0 12px 12px;text-align:right;vertical-align:top;white-space:nowrap;">
        <span style="font-size:18px;font-weight:900;color:${ptColour};">
          ${points > 0 ? `+${points}` : noPred ? '—' : '0'}
        </span>
      </td>
    </tr>`;
  }).join('');

  const rankLine = rank
    ? `<p style="margin:6px 0 0;font-size:13px;color:#8899aa;">
         Current rank: <strong style="color:#c9a227;">#${rank}</strong>
         ${totalPlayers > 1 ? ` of ${totalPlayers}` : ''}
       </p>`
    : '';

  return baseTemplate(`Your results for ${dateLabel}`, `
    <p style="margin:0 0 20px;font-size:16px;color:#8899aa;">Hi ${name},</p>

    <p style="margin:0 0 16px;font-size:14px;color:#8899aa;">
      Here's how you got on today — <strong style="color:#ffffff;">${dateLabel}</strong>.
    </p>

    <!-- Match table -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#0f1923;border-radius:12px;margin-bottom:20px;">
      <thead>
        <tr style="background:#162130;border-radius:12px 12px 0 0;">
          <th style="padding:10px 12px 10px 0;text-align:left;font-size:11px;color:#8899aa;
            text-transform:uppercase;letter-spacing:1px;font-weight:700;">Match</th>
          <th style="padding:10px 0 10px 12px;text-align:right;font-size:11px;color:#c9a227;
            text-transform:uppercase;letter-spacing:1px;font-weight:700;">Pts</th>
        </tr>
      </thead>
      <tbody>
        ${matchHtml}
      </tbody>
    </table>

    <!-- Day summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td width="48%" style="background:#0f1923;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#c9a227;">
            ${dayPoints > 0 ? `+${dayPoints}` : dayPoints}
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#8899aa;">pts today</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#0f1923;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;">${totalPoints}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#8899aa;">pts total</p>
          ${rankLine}
        </td>
      </tr>
    </table>

    <p style="margin:0;text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:#c9a227;color:#0f1923;font-weight:700;
        font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        View full standings →
      </a>
    </p>
  `);
}

// ── Template: Prediction reminder ─────────────────────────────────────────────
function reminderEmailHtml({ name, missing, hoursLeft }) {
  const timeStr = hoursLeft < 24
    ? `${Math.round(hoursLeft)} hours`
    : `${Math.round(hoursLeft / 24)} days`;

  return baseTemplate('Reminder: fill in your predictions', `
    <p style="margin:0 0 20px;font-size:16px;color:#8899aa;">Hi ${name},</p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#c9a227;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;font-size:36px;">⏰</p>
        <p style="margin:8px 0 0;font-size:20px;font-weight:900;color:#0f1923;">
          ${timeStr} until kick-off!
        </p>
        <p style="margin:6px 0 0;font-size:14px;color:#6b4a00;">
          The World Cup starts on 11 June 2026
        </p>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#0f1923;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0;font-size:40px;font-weight:900;color:#e05252;">${missing}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#8899aa;">
          match${missing !== 1 ? 'es' : ''} still without a prediction
        </p>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#8899aa;line-height:1.6;">
      Once a match kicks off, predictions are locked and you'll miss out on points.
      Head over to the app now and fill in your remaining picks!
    </p>

    <p style="margin:0;text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:#c9a227;color:#0f1923;font-weight:700;
        font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Complete my predictions →
      </a>
    </p>
  `);
}

// ── Template: Weekly standings digest ────────────────────────────────────────
function weeklyDigestHtml({ name, standings, resultsCount, userRank }) {
  const top5   = standings.slice(0, 5);
  const MEDALS = ['🥇', '🥈', '🥉'];

  const rows = top5.map((s, i) => {
    const isMe = s.name.toLowerCase() === name.toLowerCase();
    return `
      <tr style="border-top:1px solid #1e2d3d;">
        <td style="padding:10px 12px;color:#8899aa;font-size:14px;">${i < 3 ? MEDALS[i] : `#${i + 1}`}</td>
        <td style="padding:10px 12px;font-size:14px;font-weight:${isMe ? 700 : 400};
          color:${isMe ? '#c9a227' : '#ffffff'};">
          ${s.name}${isMe ? ' (you)' : ''}
        </td>
        <td style="padding:10px 12px;text-align:right;font-size:14px;color:#c9a227;font-weight:700;">
          ${s.points} pts
        </td>
      </tr>`;
  }).join('');

  return baseTemplate('Weekly standings update', `
    <p style="margin:0 0 20px;font-size:16px;color:#8899aa;">Hi ${name},</p>

    <p style="margin:0 0 16px;font-size:14px;color:#8899aa;line-height:1.6;">
      Here's the current leaderboard after
      <strong style="color:#ffffff;">${resultsCount} match${resultsCount !== 1 ? 'es' : ''}</strong> played.
      ${userRank ? `You're ranked <strong style="color:#c9a227;">#${userRank}</strong>.` : ''}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#0f1923;border-radius:12px;margin-bottom:20px;">
      <tr style="background:#162130;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8899aa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Rank</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#8899aa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Player</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#c9a227;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Pts</th>
      </tr>
      ${rows}
      ${standings.length > 5 ? `
        <tr style="border-top:1px solid #1e2d3d;">
          <td colspan="3" style="padding:10px 12px;font-size:12px;color:#3a4f63;text-align:center;">
            + ${standings.length - 5} more players
          </td>
        </tr>` : ''}
    </table>

    <p style="margin:0;text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:#c9a227;color:#0f1923;font-weight:700;
        font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        View full leaderboard →
      </a>
    </p>
  `);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a daily results email to every user — aggregates all results from today.
 * Fires automatically at 23:00 BST each evening via the scheduler in server.js.
 * Can also be triggered manually from the admin panel.
 *
 * @param {object} supabase  - Supabase admin client
 * @param {string} [dateOverride] - ISO date string e.g. '2026-06-11' (defaults to today)
 */
async function sendDailyResultsEmail(supabase, dateOverride) {
  if (!isConfigured()) return;

  try {
    // Determine which calendar date we're reporting on (BST = UTC+1)
    const now     = dateOverride ? new Date(dateOverride + 'T23:00:00+01:00') : new Date();
    const bstDate = new Date(now.getTime() + 60 * 60 * 1000); // shift to BST
    const dateStr = bstDate.toISOString().slice(0, 10);        // 'YYYY-MM-DD'

    const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // Fetch results updated on this date
    const { data: resultRows, error: rErr } = await supabase
      .from('results')
      .select('fixture_id, home_score, away_score, scorer, updated_at');

    if (rErr) throw rErr;

    // Filter to results confirmed today (BST date match)
    const todayResults = (resultRows || []).filter(r => {
      const updatedBST = new Date(new Date(r.updated_at).getTime() + 60 * 60 * 1000);
      return updatedBST.toISOString().slice(0, 10) === dateStr;
    });

    if (!todayResults.length) {
      console.log(`[email] No results for ${dateStr} — skipping daily email`);
      return;
    }

    console.log(`[email] Sending daily results for ${dateStr} (${todayResults.length} matches)`);

    // Build a results map for today
    const todayMap = {};
    todayResults.forEach(r => {
      todayMap[r.fixture_id] = { home: r.home_score, away: r.away_score, scorer: r.scorer };
    });

    // Fetch fixture metadata for team names
    const fixtures = require('./fixtures-lookup');
    const fixtureMap = {};
    fixtures.forEach(f => { fixtureMap[f.id] = f; });

    // Fetch leaderboard for rank/total points
    let standings = [];
    try {
      const sRes  = await fetch(`http://localhost:${process.env.PORT || 3001}/api/leaderboard`);
      const sData = await sRes.json();
      standings   = sData.standings || [];
    } catch { /* standings optional */ }

    // Fetch all profiles + their predictions for today's fixtures
    const { data: profiles } = await supabase.from('profiles').select('id, name');
    if (!profiles?.length) return;

    const fixtureIds = Object.keys(todayMap);
    const { data: allPreds } = await supabase
      .from('predictions')
      .select('user_id, fixture_id, home_score, away_score, scorer')
      .in('fixture_id', fixtureIds);

    // Fetch auth user emails
    const users   = await getAllUsers(supabase);
    const emailMap = {};
    users.forEach(u => { emailMap[u.id] = u.email; });

    // Build and send one email per user
    const sends = profiles
      .filter(p => emailMap[p.id])
      .map(p => {
        const userPreds = {};
        (allPreds || [])
          .filter(pr => pr.user_id === p.id)
          .forEach(pr => {
            userPreds[pr.fixture_id] = {
              home: pr.home_score, away: pr.away_score, scorer: pr.scorer,
            };
          });

        // Build per-match rows for this user
        let dayPoints = 0;
        const matchRows = Object.entries(todayMap).map(([fId, result]) => {
          const fixture = fixtureMap[fId];
          if (!fixture) return null;
          const pred = userPreds[fId] ?? null;
          const { points, outcome, scorerHit } = scoreMatch(pred, result);
          dayPoints += points;
          return {
            homeTeam:   fixture.homeTeam,
            awayTeam:   fixture.awayTeam,
            actualHome: result.home,
            actualAway: result.away,
            predHome:   pred?.home ?? '—',
            predAway:   pred?.away ?? '—',
            scorerPick: pred?.scorer || '',
            outcome,
            points,
            scorerHit,
          };
        }).filter(Boolean);

        // Sort by fixture order (as they appear in fixtures-lookup)
        matchRows.sort((a, b) => {
          const ia = fixtures.findIndex(f => f.homeTeam === a.homeTeam && f.awayTeam === a.awayTeam);
          const ib = fixtures.findIndex(f => f.homeTeam === b.homeTeam && f.awayTeam === b.awayTeam);
          return ia - ib;
        });

        const rankIdx   = standings.findIndex(s => s.name === p.name);
        const rank      = rankIdx >= 0 ? rankIdx + 1 : null;
        const totalPts  = rankIdx >= 0 ? standings[rankIdx].points : 0;

        return resend.emails.send({
          from:    FROM,
          to:      emailMap[p.id],
          subject: `⚽ Today's results — ${dayPoints > 0 ? `+${dayPoints} pts` : 'no points today'} · ${dateLabel}`,
          html:    dailyResultsHtml({
            name:         p.name,
            dateLabel,
            matchRows,
            dayPoints,
            totalPoints:  totalPts,
            rank,
            totalPlayers: standings.length,
          }),
        });
      });

    const results = await Promise.allSettled(sends);
    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.filter(r => r.status === 'rejected').length;
    console.log(`[email] Daily results (${dateStr}): ${sent} sent, ${failed} failed`);
  } catch (err) {
    console.error('[email] sendDailyResultsEmail error:', err.message);
  }
}

/**
 * Send prediction reminders to users who have unfilled predictions.
 */
async function sendReminderEmails(supabase) {
  if (!isConfigured()) return;
  try {
    const { data: profiles } = await supabase.from('profiles').select('id, name');
    if (!profiles?.length) return;

    const { data: allPreds } = await supabase
      .from('predictions')
      .select('user_id, fixture_id, home_score, away_score');

    const TOTAL_FIXTURES = 72;
    const firstKickoff   = new Date('2026-06-11T19:00:00Z');
    const hoursLeft      = (firstKickoff - Date.now()) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      console.log('[email] Tournament already started — skipping reminders');
      return;
    }

    const users    = await getAllUsers(supabase);
    const emailMap = {};
    users.forEach(u => { emailMap[u.id] = u.email; });

    const sends = profiles
      .filter(p => emailMap[p.id])
      .map(p => {
        const done = (allPreds || []).filter(pr =>
          pr.user_id === p.id && (pr.home_score !== '' || pr.away_score !== '')
        ).length;
        const missing = TOTAL_FIXTURES - done;
        if (missing <= 0) return null;

        return resend.emails.send({
          from:    FROM,
          to:      emailMap[p.id],
          subject: `⏰ ${missing} prediction${missing !== 1 ? 's' : ''} to go — ${Math.round(hoursLeft)}h until kick-off`,
          html:    reminderEmailHtml({ name: p.name, missing, hoursLeft }),
        });
      })
      .filter(Boolean);

    if (!sends.length) {
      console.log('[email] All users fully predicted — no reminders needed');
      return;
    }

    const results = await Promise.allSettled(sends);
    console.log(`[email] Reminders: ${results.filter(r => r.status === 'fulfilled').length}/${sends.length} sent`);
  } catch (err) {
    console.error('[email] sendReminderEmails error:', err.message);
  }
}

/**
 * Send weekly standings digest to all users.
 */
async function sendWeeklyDigest(supabase) {
  if (!isConfigured()) return;
  try {
    let standings = [], resultsCount = 0;
    try {
      const res  = await fetch(`http://localhost:${process.env.PORT || 3001}/api/leaderboard`);
      const data = await res.json();
      standings    = data.standings    || [];
      resultsCount = data.resultsCount || 0;
    } catch { return; }

    if (resultsCount === 0) {
      console.log('[email] No results yet — skipping digest');
      return;
    }

    const { data: profiles } = await supabase.from('profiles').select('id, name');
    if (!profiles?.length) return;

    const users    = await getAllUsers(supabase);
    const emailMap = {};
    users.forEach(u => { emailMap[u.id] = u.email; });

    const sends = profiles
      .filter(p => emailMap[p.id])
      .map(p => {
        const rankIdx = standings.findIndex(s => s.name === p.name);
        return resend.emails.send({
          from:    FROM,
          to:      emailMap[p.id],
          subject: `📊 Standings update — ${resultsCount} match${resultsCount !== 1 ? 'es' : ''} played`,
          html:    weeklyDigestHtml({
            name:         p.name,
            standings,
            resultsCount,
            userRank: rankIdx >= 0 ? rankIdx + 1 : null,
          }),
        });
      });

    const results = await Promise.allSettled(sends);
    console.log(`[email] Weekly digest: ${results.filter(r => r.status === 'fulfilled').length}/${sends.length} sent`);
  } catch (err) {
    console.error('[email] sendWeeklyDigest error:', err.message);
  }
}

module.exports = { sendDailyResultsEmail, sendReminderEmails, sendWeeklyDigest };
