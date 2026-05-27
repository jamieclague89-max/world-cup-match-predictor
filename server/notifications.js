/**
 * Notification helpers — creates in-app notifications for result updates
 * and prediction deadline reminders.
 *
 * The server uses the service-role key so it can insert notifications for
 * any user without needing to satisfy RLS.
 */

const supabase = require('./supabase');

// ── Scoring (mirrors server.js calcScore logic) ───────────────────────────────
function calcMatchPoints(pred, result) {
  if (!pred || pred.home === '' || pred.away === '') return null;

  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  const ah = parseInt(result.home, 10);
  const aa = parseInt(result.away, 10);
  if (isNaN(ph) || isNaN(pa) || isNaN(ah) || isNaN(aa)) return null;

  let points     = 0;
  let exactScore = false;
  let correctOutcome = false;
  let scorerCorrect  = false;

  if (ph === ah && pa === aa) {
    points += 5;
    exactScore = true;
  } else {
    const po = Math.sign(ph - pa);
    const ao = Math.sign(ah - aa);
    if (po === ao) {
      points += 3;
      correctOutcome = true;
    } else if ((ph - pa) === (ah - aa)) {
      points += 1;
    }
  }

  const totalGoals = ah + aa;
  if (
    totalGoals > 0 &&
    pred.scorer && result.scorer &&
    pred.scorer.toLowerCase().trim() === result.scorer.toLowerCase().trim()
  ) {
    points += 3;
    scorerCorrect = true;
  }

  return { points, exactScore, correctOutcome, scorerCorrect };
}

// Build a human-readable body line from the scoring breakdown
function buildResultBody(breakdown, predHome, predAway, actualHome, actualAway) {
  if (!breakdown) return 'You didn\'t predict this match.';

  const { points, exactScore, correctOutcome, scorerCorrect } = breakdown;
  const parts = [];

  if (exactScore) {
    parts.push('🎯 Exact score');
  } else if (correctOutcome) {
    parts.push('✓ Correct result');
  } else {
    parts.push('✗ Wrong result');
  }

  if (scorerCorrect) parts.push('⚽ Scorer');

  const summary = parts.join(' · ');
  const predStr = `${predHome}–${predAway}`;

  return points > 0
    ? `${summary} — +${points} pts  (your prediction: ${predStr})`
    : `${summary}  (your prediction: ${predStr})`;
}

// ── Result notifications ──────────────────────────────────────────────────────
/**
 * Called after a match result is saved (by auto-sync or admin).
 * Finds every user who predicted the fixture and inserts a personalised
 * notification showing their points and prediction vs actual score.
 */
async function sendResultNotifications(fixtureId, homeTeam, awayTeam, homeScore, awayScore, scorer) {
  if (!supabase) return;

  try {
    // Find all predictions for this fixture
    const { data: fixturePreds, error: fpErr } = await supabase
      .from('predictions')
      .select('user_id, home_score, away_score, scorer')
      .eq('fixture_id', fixtureId);

    if (fpErr) {
      console.error('[notifications] Failed to fetch predictions:', fpErr.message);
      return;
    }

    if (!fixturePreds?.length) return;

    // Get users who have opted OUT of result notifications
    const { data: optedOut } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('key', 'notifyResults')
      .eq('value', 'false');

    const optedOutIds = new Set((optedOut || []).map(r => r.user_id));

    // Check for already-sent notifications for this fixture (avoid duplicates)
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('type', 'result')
      .eq('metadata->>fixtureId', fixtureId);

    const alreadyNotified = new Set((existing || []).map(r => r.user_id));

    const result = { home: homeScore, away: awayScore, scorer: scorer || '' };
    const rows   = [];

    for (const pred of fixturePreds) {
      if (optedOutIds.has(pred.user_id))    continue;
      if (alreadyNotified.has(pred.user_id)) continue;

      const userPred = { home: pred.home_score, away: pred.away_score, scorer: pred.scorer || '' };
      const breakdown = calcMatchPoints(userPred, result);

      rows.push({
        user_id: pred.user_id,
        type:    'result',
        title:   `${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`,
        body:    buildResultBody(breakdown, pred.home_score, pred.away_score, homeScore, awayScore),
        metadata: {
          fixtureId,
          points:         breakdown?.points        ?? 0,
          exactScore:     breakdown?.exactScore     ?? false,
          correctOutcome: breakdown?.correctOutcome ?? false,
          scorerCorrect:  breakdown?.scorerCorrect  ?? false,
        },
      });
    }

    if (rows.length === 0) return;

    const { error: insertErr } = await supabase.from('notifications').insert(rows);
    if (insertErr) {
      console.error('[notifications] Insert failed:', insertErr.message);
    } else {
      console.log(`[notifications] Sent result notifications to ${rows.length} users for ${fixtureId}`);
    }
  } catch (err) {
    console.error('[notifications] sendResultNotifications error:', err.message);
  }
}

// ── Deadline notifications ────────────────────────────────────────────────────
/**
 * For a given fixture, finds all users who have NOT yet predicted it and
 * haven't already received a deadline notification for it.
 * Called by the deadline reminder when a fixture is coming up today.
 */
async function sendDeadlineNotifications(fixtureId, homeTeam, awayTeam, date) {
  if (!supabase) return;

  try {
    // All user IDs in the system
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id');

    if (pErr || !profiles?.length) return;

    // Users who HAVE predicted this fixture
    const { data: hasPred } = await supabase
      .from('predictions')
      .select('user_id')
      .eq('fixture_id', fixtureId);

    const predictedIds = new Set((hasPred || []).map(r => r.user_id));

    // Users who already received a deadline notification for this fixture
    const { data: alreadySent } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('type', 'deadline')
      .eq('metadata->>fixtureId', fixtureId);

    const sentIds = new Set((alreadySent || []).map(r => r.user_id));

    // Users who opted OUT of deadline notifications
    const { data: optedOut } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('key', 'notifyDeadlines')
      .eq('value', 'false');

    const optedOutIds = new Set((optedOut || []).map(r => r.user_id));

    // Friendly date for the body
    const friendlyDate = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
    });

    const rows = [];

    for (const profile of profiles) {
      const uid = profile.id;
      if (predictedIds.has(uid)) continue;  // already predicted
      if (sentIds.has(uid))      continue;  // already notified
      if (optedOutIds.has(uid))  continue;  // opted out

      rows.push({
        user_id:  uid,
        type:     'deadline',
        title:    `⏰ Predict before it's too late!`,
        body:     `${homeTeam} vs ${awayTeam} kicks off ${friendlyDate} — you haven't predicted this yet.`,
        metadata: { fixtureId, homeTeam, awayTeam, date },
      });
    }

    if (rows.length === 0) return;

    const { error: insertErr } = await supabase.from('notifications').insert(rows);
    if (insertErr) {
      console.error('[notifications] Deadline insert failed:', insertErr.message);
    } else {
      console.log(`[notifications] Sent deadline reminders to ${rows.length} users for ${fixtureId}`);
    }
  } catch (err) {
    console.error('[notifications] sendDeadlineNotifications error:', err.message);
  }
}

// ── Daily digest notification ─────────────────────────────────────────────────
/**
 * Sent once per day at end of day to all users who have notifyResults enabled.
 * Skipped entirely on days with no scheduled fixtures, and on the specific
 * rest days listed below. Also skipped if no results were actually recorded
 * today (handles postponements / API delays gracefully).
 */

const FIXTURES_LOOKUP = require('./fixtures-lookup');

// Days during the tournament when no matches are played
const NO_FIXTURE_DATES = new Set([
  '2026-07-08', // Wednesday
  '2026-07-12', // Sunday
  '2026-07-13', // Monday
  '2026-07-16', // Thursday
  '2026-07-17', // Friday
]);

async function sendDailyDigestNotifications(dateStr) {
  if (!supabase) return;

  // ── Guard 1: hardcoded rest days ────────────────────────────────────────────
  if (NO_FIXTURE_DATES.has(dateStr)) {
    console.log(`[notifications] Daily digest skipped — rest day (${dateStr})`);
    return;
  }

  // ── Guard 2: no fixtures scheduled this date in our fixture list ────────────
  const todayFixtures = FIXTURES_LOOKUP.filter(f => f.date === dateStr);
  if (todayFixtures.length === 0) {
    console.log(`[notifications] Daily digest skipped — no fixtures on ${dateStr}`);
    return;
  }

  // ── Guard 3: no results actually recorded for today's fixtures ───────────────
  // (handles postponements and API delays gracefully)
  const todayIds = todayFixtures.map(f => f.id);
  const { data: todayResults, error: rErr } = await supabase
    .from('results')
    .select('fixture_id')
    .in('fixture_id', todayIds);

  if (rErr) {
    console.error('[notifications] Daily digest — results check failed:', rErr.message);
    return;
  }
  if (!todayResults?.length) {
    console.log(`[notifications] Daily digest skipped — no results recorded for ${dateStr}`);
    return;
  }

  const matchCount = todayResults.length;
  const matchWord  = matchCount === 1 ? 'match' : 'matches';

  try {
    // All user profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id');

    if (pErr || !profiles?.length) return;

    // Users who opted out of leaderboard/digest notifications
    const { data: optedOut } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('key', 'notifyLeaderboard')
      .eq('value', 'false');

    const optedOutIds = new Set((optedOut || []).map(r => r.user_id));

    // Avoid sending a second digest to the same user on the same day
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd   = `${dateStr}T23:59:59.999Z`;

    const { data: alreadySent } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('type', 'leaderboard')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd)
      .filter('metadata->>isDigest', 'eq', 'true');

    const sentIds = new Set((alreadySent || []).map(r => r.user_id));

    const rows = [];

    for (const profile of profiles) {
      if (optedOutIds.has(profile.id)) continue;
      if (sentIds.has(profile.id))     continue;

      rows.push({
        user_id: profile.id,
        type:    'leaderboard',
        title:   `📊 Today's results are in!`,
        body:    `${matchCount} ${matchWord} played today — head over to see your score and check your leaderboard position.`,
        metadata: {
          isDigest:     true,
          date:         dateStr,
          matchesPlayed: matchCount,
        },
      });
    }

    if (rows.length === 0) {
      console.log(`[notifications] Daily digest — no eligible users to notify for ${dateStr}`);
      return;
    }

    const { error: insertErr } = await supabase.from('notifications').insert(rows);
    if (insertErr) {
      console.error('[notifications] Daily digest insert failed:', insertErr.message);
    } else {
      console.log(`[notifications] Daily digest sent to ${rows.length} users for ${dateStr} (${matchCount} ${matchWord})`);
    }
  } catch (err) {
    console.error('[notifications] sendDailyDigestNotifications error:', err.message);
  }
}

module.exports = { sendResultNotifications, sendDeadlineNotifications, sendDailyDigestNotifications };
