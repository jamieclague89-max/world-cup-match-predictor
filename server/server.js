const express = require('express');
const cors = require('cors');
const path = require('path');
const resultsSync       = require('./resultsSync');
const supabase          = require('./supabase');
const emailService      = require('./emailService');
const deadlineReminder  = require('./deadlineReminder');
const { sendResultNotifications, sendDailyDigestNotifications } = require('./notifications');

// ── League code generator ─────────────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS — restrict to known origins ─────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
}));
app.use(express.json());

// ── Admin auth — verify Supabase JWT + is_admin flag ─────────────────────────
async function verifyAdmin(req, res) {
  if (!supabase) { res.status(503).json({ error: 'Database not configured' }); return false; }
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  const token = auth.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) { res.status(401).json({ error: 'Invalid session' }); return false; }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) { res.status(403).json({ error: 'Forbidden' }); return false; }
  return true;
}

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// ── Create a new league ──────────────────────────────────────────────────────
app.post('/api/leagues', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const { name, userId } = req.body;
  if (!name || !userId) return res.status(400).json({ error: 'name and userId required' });

  // Generate a unique code
  let code;
  let attempts = 0;
  do {
    code = generateCode();
    const { data } = await supabase.from('leagues').select('code').eq('code', code).maybeSingle();
    if (!data) break; // code is free
    attempts++;
  } while (attempts < 10);

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({ code, name: name.trim(), created_by: userId })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Add creator as first member
  await supabase.from('league_members').insert({ league_code: code, user_id: userId });

  res.json({ code, league });
});

// ── Get league metadata (name, created_by) ───────────────────────────────────
app.get('/api/leagues/:code', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const code = req.params.code.toUpperCase();
  const { data: league, error } = await supabase
    .from('leagues')
    .select('code, name, created_by')
    .eq('code', code)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!league) return res.status(404).json({ error: 'League not found' });
  res.json({ league });
});

// ── Join a league ─────────────────────────────────────────────────────────────
app.post('/api/leagues/:code/join', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const { userId } = req.body;
  const code = req.params.code.toUpperCase();
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // Check league exists
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (leagueErr) return res.status(500).json({ error: leagueErr.message });
  if (!league)   return res.status(404).json({ error: 'League not found' });

  // Upsert member (idempotent — rejoin is fine)
  const { error: memberErr } = await supabase
    .from('league_members')
    .upsert({ league_code: code, user_id: userId }, { onConflict: 'league_code,user_id' });

  if (memberErr) return res.status(500).json({ error: memberErr.message });

  res.json({ message: 'Joined successfully', league });
});

// ── Delete a league (creator only) ───────────────────────────────────────────
app.delete('/api/leagues/:code', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const code   = req.params.code.toUpperCase();
  const userId = req.body?.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const { data: league } = await supabase
    .from('leagues').select('created_by').eq('code', code).maybeSingle();

  if (!league) return res.status(404).json({ error: 'League not found' });
  if (league.created_by !== userId) return res.status(403).json({ error: 'Only the league creator can delete it' });

  // Remove all members first (FK), then the league itself
  await supabase.from('league_members').delete().eq('league_code', code);
  await supabase.from('leagues').delete().eq('code', code);

  res.json({ message: 'League deleted' });
});

// ── Remove a member from a league ────────────────────────────────────────────
// Allowed for: the league creator (kicking someone), or the member themselves (leaving)
app.delete('/api/leagues/:code/members/:memberId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const code     = req.params.code.toUpperCase();
  const memberId = req.params.memberId;
  const userId   = req.body?.userId; // the person making the request
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const { data: league } = await supabase
    .from('leagues').select('created_by').eq('code', code).maybeSingle();

  if (!league) return res.status(404).json({ error: 'League not found' });

  const isCreator  = league.created_by === userId;
  const isSelfLeave = memberId === userId;

  if (!isCreator && !isSelfLeave) {
    return res.status(403).json({ error: 'Only the league creator can remove other members' });
  }
  if (isCreator && memberId === userId) {
    return res.status(400).json({ error: 'Delete the league instead of removing yourself' });
  }

  await supabase.from('league_members').delete().eq('league_code', code).eq('user_id', memberId);

  res.json({ message: 'Member removed' });
});

// ── League standings ──────────────────────────────────────────────────────────
app.get('/api/leagues/:code/standings', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const code = req.params.code.toUpperCase();

  // Verify league exists
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('code, name, created_by')
    .eq('code', code)
    .maybeSingle();

  if (leagueErr) return res.status(500).json({ error: leagueErr.message });
  if (!league)   return res.status(404).json({ error: 'League not found' });

  // Fetch all members, their profiles, predictions, and results in parallel
  const [membersRes, predsRes, resultsRes] = await Promise.all([
    supabase
      .from('league_members')
      .select('user_id, profiles(name)')
      .eq('league_code', code),
    supabase.from('predictions').select('user_id, fixture_id, home_score, away_score, scorer'),
    supabase.from('results').select('fixture_id, home_score, away_score, scorer'),
  ]);

  if (membersRes.error) return res.status(500).json({ error: membersRes.error.message });
  if (predsRes.error)   return res.status(500).json({ error: predsRes.error.message });
  if (resultsRes.error) return res.status(500).json({ error: resultsRes.error.message });

  const members   = membersRes.data  || [];
  const predRows  = predsRes.data    || [];
  const resultRows = resultsRes.data || [];

  // Build results dict keyed by fixture_id
  const results = {};
  resultRows.forEach(r => {
    results[r.fixture_id] = { home: r.home_score, away: r.away_score, scorer: r.scorer };
  });

  // Score each member
  const standings = members.map(m => {
    const name = m.profiles?.name || 'Unknown';
    const userPreds = {};
    predRows
      .filter(pr => pr.user_id === m.user_id)
      .forEach(pr => {
        userPreds[pr.fixture_id] = { home: pr.home_score, away: pr.away_score, scorer: pr.scorer };
      });
    return { name, userId: m.user_id, ...calcScore(userPreds, results) };
  });

  standings.sort((a, b) => b.points - a.points || b.exact - a.exact);
  res.json({ league, standings });
});

// ── Member predictions (completed matches only) ───────────────────────────────
// Returns a specific member's predictions, but ONLY for fixtures that have a
// confirmed result — so you can never see predictions for upcoming matches.
app.get('/api/leagues/:code/member/:userId/predictions', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const code   = req.params.code.toUpperCase();
  const userId = req.params.userId;

  // Verify league exists and user is a member
  const { data: member } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_code', code)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) return res.status(404).json({ error: 'Member not found in this league' });

  // Fetch confirmed results
  const { data: resultRows, error: rErr } = await supabase
    .from('results')
    .select('fixture_id');

  if (rErr) return res.status(500).json({ error: rErr.message });

  const completedIds = (resultRows || []).map(r => r.fixture_id);
  if (completedIds.length === 0) return res.json({ predictions: {} });

  // Fetch this member's predictions for completed fixtures only
  const { data: predRows, error: pErr } = await supabase
    .from('predictions')
    .select('fixture_id, home_score, away_score, scorer')
    .eq('user_id', userId)
    .in('fixture_id', completedIds);

  if (pErr) return res.status(500).json({ error: pErr.message });

  const predictions = {};
  (predRows || []).forEach(p => {
    predictions[p.fixture_id] = {
      home: p.home_score, away: p.away_score, scorer: p.scorer,
    };
  });

  res.json({ predictions });
});

// ── Scoring helper (5/3/1 + goalscorer bonus) ────────────────────────────────
function calcScore(predictions, results) {
  let points = 0, exact = 0, correct = 0, gdiff = 0, scorerBonus = 0;
  Object.entries(results).forEach(([matchId, result]) => {
    const pred = predictions[matchId];
    if (!pred || pred.home === '' || pred.away === '') return;
    const ph = parseInt(pred.home, 10), pa = parseInt(pred.away, 10);
    const ah = parseInt(result.home, 10), aa = parseInt(result.away, 10);

    // Score prediction points
    if (ph === ah && pa === aa) {
      points += 5; exact++;
    } else {
      const po = Math.sign(ph - pa), ao = Math.sign(ah - aa);
      if (po === ao) { points += 3; correct++; }
      else if ((ph - pa) === (ah - aa)) { points += 1; gdiff++; }
    }

    // First goalscorer bonus (3 pts) — only if match had goals
    const totalGoals = ah + aa;
    if (
      totalGoals > 0 &&
      pred.scorer && result.scorer &&
      pred.scorer.toLowerCase().trim() === result.scorer.toLowerCase().trim()
    ) {
      points += 3;
      scorerBonus++;
    }
  });
  return { points, exact, correct, gdiff, scorerBonus };
}

// ── Public leaderboard ────────────────────────────────────────────────────────

// GET standings — reads profiles + predictions + results from Supabase
app.get('/api/leaderboard', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured', standings: [], resultsCount: 0 });

  try {
    const [profilesRes, predsRes, resultsRes] = await Promise.all([
      supabase.from('profiles').select('id, name'),
      supabase.from('predictions').select('user_id, fixture_id, home_score, away_score, scorer'),
      supabase.from('results').select('fixture_id, home_score, away_score, scorer'),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (predsRes.error)    throw predsRes.error;
    if (resultsRes.error)  throw resultsRes.error;

    const profiles  = profilesRes.data  || [];
    const predRows  = predsRes.data     || [];
    const resultRows = resultsRes.data  || [];

    // Build results dict
    const results = {};
    resultRows.forEach(r => {
      results[r.fixture_id] = { home: r.home_score, away: r.away_score, scorer: r.scorer };
    });

    // Calculate standings per user
    const standings = profiles.map(p => {
      const userPreds = {};
      predRows
        .filter(pr => pr.user_id === p.id)
        .forEach(pr => {
          userPreds[pr.fixture_id] = { home: pr.home_score, away: pr.away_score, scorer: pr.scorer };
        });
      return { name: p.name, ...calcScore(userPreds, results) };
    });

    standings.sort((a, b) => b.points - a.points || b.exact - a.exact);
    res.json({ standings, resultsCount: resultRows.length });
  } catch (err) {
    console.error('[leaderboard] Error:', err.message);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// GET all confirmed results — public endpoint (scorelines are public info)
app.get('/api/results', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data, error } = await supabase
    .from('results')
    .select('fixture_id, home_score, away_score, scorer');
  if (error) return res.status(500).json({ error: error.message });
  const results = {};
  data?.forEach(r => {
    results[r.fixture_id] = { home: r.home_score, away: r.away_score, scorer: r.scorer };
  });
  res.json({ results, count: data?.length ?? 0 });
});

// GET stored results (admin only)
app.get('/api/leaderboard/results', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const { data, error } = await supabase.from('results').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const results = {};
  data?.forEach(r => {
    results[r.fixture_id] = { home: r.home_score, away: r.away_score, scorer: r.scorer };
  });
  res.json({ results });
});

// POST set/clear results (admin only)
// Pass null as a value to clear: { results: { A1: null } }
app.post('/api/leaderboard/results', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  const { results } = req.body;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const ops = Object.entries(results).map(([fixtureId, val]) => {
    if (val === null) {
      return supabase.from('results').delete().eq('fixture_id', fixtureId);
    }
    return supabase.from('results').upsert(
      {
        fixture_id: fixtureId,
        home_score: String(val.home),
        away_score: String(val.away),
        scorer:     val.scorer || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fixture_id' }
    );
  });

  const responses = await Promise.all(ops);
  const errors = responses.filter(r => r.error).map(r => r.error.message);
  if (errors.length) return res.status(500).json({ error: errors.join(', ') });

  const { data } = await supabase.from('results').select('fixture_id');

  // Fire result notifications for newly saved (non-null) results
  const FIXTURES = require('./fixtures-lookup');
  for (const [fixtureId, val] of Object.entries(results)) {
    if (val === null) continue;
    const fixture = FIXTURES.find(f => f.id === fixtureId);
    if (fixture) {
      sendResultNotifications(
        fixtureId, fixture.homeTeam, fixture.awayTeam,
        String(val.home), String(val.away), val.scorer || ''
      ).catch(e => console.error('[server] Notification error:', e.message));
    }
  }

  res.json({ message: 'Results updated', total: data?.length || 0 });
});

// ── Jules Rimet Jackpot enquiry ───────────────────────────────────────────────
// Public endpoint — no auth required (user is just submitting their email)
app.post('/api/jules-rimet/enquire', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { email, name } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'A valid email address is required' });

  try {
    await emailService.sendJulesRimetEnquiry(supabase, email.trim().toLowerCase(), name?.trim() || '');
    res.json({ message: 'Details sent! Check your inbox.' });
  } catch (e) {
    console.error('[email] Jules Rimet enquiry error:', e.message);
    res.status(500).json({ error: 'Failed to send — please try again' });
  }
});

// ── Admin email triggers ──────────────────────────────────────────────────────

// POST /api/admin/email/reminder — send prediction reminder to all users with gaps
app.post('/api/admin/email/reminder', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await emailService.sendReminderEmails(supabase);
    res.json({ message: 'Reminder emails sent', ...result });
  } catch (e) {
    console.error('[email] Reminder error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/email/digest — send weekly standings digest to all users
app.post('/api/admin/email/digest', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await emailService.sendWeeklyDigest(supabase);
    res.json({ message: 'Digest emails sent', ...result });
  } catch (e) {
    console.error('[email] Digest error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/notifications/deadline — manually trigger deadline reminders
app.post('/api/admin/notifications/deadline', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  try {
    await deadlineReminder.checkDeadlines();
    res.json({ message: 'Deadline reminders sent' });
  } catch (e) {
    console.error('[deadlineReminder] Manual trigger error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/notifications/daily-digest — manually trigger end-of-day digest
app.post('/api/admin/notifications/daily-digest', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  const dateStr = req.body.date || new Date().toISOString().slice(0, 10);
  try {
    await sendDailyDigestNotifications(dateStr);
    res.json({ message: `Daily digest sent for ${dateStr}` });
  } catch (e) {
    console.error('[notifications] Manual digest error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/email/daily-results — manually trigger today's results digest
app.post('/api/admin/email/daily-results', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  const { date } = req.body;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await emailService.sendDailyResultsEmail(supabase, date || null);
    res.json({ message: 'Daily results email sent', ...result });
  } catch (e) {
    console.error('[email] Daily results error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/email/daily-prediction-reminder — manually trigger daily prediction reminder
app.post('/api/admin/email/daily-prediction-reminder', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  const { date } = req.body;
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await emailService.sendDailyPredictionReminderEmail(supabase, date || null);
    res.json({ message: 'Daily prediction reminder sent', ...result });
  } catch (e) {
    console.error('[email] Daily prediction reminder error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Sends daily prediction reminder emails for unpredicted fixtures today — runs at 20:00 UTC (21:00 BST)
app.get('/api/cron/daily-prediction-reminder', async (req, res) => {
  if (!verifyCron(req, res)) return;
  try {
    const result = await emailService.sendDailyPredictionReminderEmail(supabase);
    res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[cron] Daily prediction reminder error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Sync status (admin only) ─────────────────────────────────────────────────
// In Vercel's serverless environment each invocation is stateless, so the
// in-memory `status.enabled` flag is always false even when the API key is set.
// We override `enabled` and `apiKey` here using the actual env var so the admin
// panel shows the correct configuration state.
app.get('/api/sync-status', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  const hasKey = !!process.env.FOOTBALL_DATA_API_KEY;
  const base   = resultsSync.getStatus();
  res.json({
    ...base,
    enabled: hasKey,
    apiKey:  hasKey ? '***configured***' : null,
  });
});

// ── Delete own account ───────────────────────────────────────────────────────
// Verifies the caller's JWT, wipes all their data, then removes the auth user.
app.delete('/api/user/account', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const uid = user.id;
  try {
    // Delete user data in parallel where safe
    await Promise.all([
      supabase.from('predictions').delete().eq('user_id', uid),
      supabase.from('notifications').delete().eq('user_id', uid),
      supabase.from('user_preferences').delete().eq('user_id', uid),
      supabase.from('league_members').delete().eq('user_id', uid),
    ]);
    // Profile must go after league_members (FK)
    await supabase.from('profiles').delete().eq('id', uid);
    // Finally remove the auth user (requires service role)
    const { error: delErr } = await supabase.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('[delete-account]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Admin analytics ──────────────────────────────────────────────────────────
// Returns combined app stats (Supabase) + Vercel web analytics traffic data.
app.get('/api/admin/analytics', async (req, res) => {
  if (!await verifyAdmin(req, res)) return;
  try {
    const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today         = new Date().toISOString().split('T')[0];

    // ── Supabase counts ───────────────────────────────────────────────────
    const [
      { count: totalUsers },
      { count: totalPredictions },
      { count: newUsersThisWeek },
      { count: predictionsThisWeek },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('predictions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('predictions').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    ]);

    // ── Top 5 predictors ─────────────────────────────────────────────────
    const { data: allPreds } = await supabase.from('predictions').select('user_id');
    const userCounts = {};
    (allPreds || []).forEach(p => { userCounts[p.user_id] = (userCounts[p.user_id] || 0) + 1; });
    const topUserIds = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([uid]) => uid);
    let topPredictors = [];
    if (topUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles').select('id, display_name').in('id', topUserIds);
      topPredictors = topUserIds.map(uid => ({
        name: profileData?.find(p => p.id === uid)?.display_name || 'Unknown',
        count: userCounts[uid],
      }));
    }

    // ── Vercel web analytics (optional — requires VERCEL_TOKEN) ───────────
    let vercelData = null;
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    if (VERCEL_TOKEN) {
      const TEAM_ID    = 'team_BCab7MCFobNktmenUREDB536';
      const PROJECT_ID = 'prj_pSASc3dY9MStQOIn3dh8vIsyXfFV';
      const params = `teamId=${TEAM_ID}&projectId=${PROJECT_ID}&from=${thirtyDaysAgo}&to=${today}&granularity=day`;
      try {
        const [tsRes, pagesRes] = await Promise.all([
          fetch(`https://vercel.com/api/web-analytics/timeseries?${params}`,
            { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }),
          fetch(`https://vercel.com/api/web-analytics/breakdown?${params}&groupBy=path&limit=5`,
            { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }),
        ]);
        vercelData = {
          timeseries: tsRes.ok   ? await tsRes.json()   : null,
          pages:      pagesRes.ok ? await pagesRes.json() : null,
        };
      } catch {
        vercelData = { error: 'Could not reach Vercel API' };
      }
    }

    res.json({
      app: {
        totalUsers:            totalUsers           ?? 0,
        totalPredictions:      totalPredictions     ?? 0,
        newUsersThisWeek:      newUsersThisWeek     ?? 0,
        predictionsThisWeek:   predictionsThisWeek  ?? 0,
        avgPredictionsPerUser: totalUsers
          ? Math.round((totalPredictions / totalUsers) * 10) / 10
          : 0,
        topPredictors,
      },
      traffic: { hasToken: !!VERCEL_TOKEN, ...vercelData },
    });
  } catch (err) {
    console.error('[analytics]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Vercel Cron endpoints ─────────────────────────────────────────────────────
// These are called by Vercel Cron on a schedule (see vercel.json).
// In local dev the equivalent background tasks run via start() / scheduleDailyEmail().
// Protected by CRON_SECRET set in the Vercel environment.
function verifyCron(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// Polls football-data.org for finished matches — runs every 5 minutes
app.get('/api/cron/sync-results', async (req, res) => {
  if (!verifyCron(req, res)) return;
  await resultsSync.runOnce(process.env.FOOTBALL_DATA_API_KEY);
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Sends deadline reminders for today's unpredicted fixtures — runs hourly
app.get('/api/cron/deadline-check', async (req, res) => {
  if (!verifyCron(req, res)) return;
  await deadlineReminder.checkDeadlines();
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Sends daily results email + in-app digest — runs at 22:00 UTC (23:00 BST)
app.get('/api/cron/daily-digest', async (req, res) => {
  if (!verifyCron(req, res)) return;
  const dateStr = new Date().toISOString().slice(0, 10);
  await emailService.sendDailyResultsEmail(supabase)
    .catch(e => console.error('[cron] Daily results email error:', e.message));
  await sendDailyDigestNotifications(dateStr)
    .catch(e => console.error('[cron] Daily digest notification error:', e.message));
  res.json({ ok: true, date: dateStr });
});

// ── Local dev server ──────────────────────────────────────────────────────────
// Only starts when run directly (node server.js). On Vercel, the app is
// exported below and cron jobs replace the in-process intervals.
if (require.main === module) {
  // Catch-all for local production build testing
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    resultsSync.start(process.env.FOOTBALL_DATA_API_KEY);
    deadlineReminder.start();
    scheduleDailyEmail();
  });
}

// Export for Vercel serverless
module.exports = app;

// ── Daily results email scheduler ────────────────────────────────────────────
// Fires at 23:00 BST (= 22:00 UTC) every evening during the World Cup.
function scheduleDailyEmail() {
  function msUntilNextRun() {
    const now = new Date();
    // Target: 22:00 UTC (= 23:00 BST during BST / summer time)
    const next = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0, 0, 0
    ));
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1); // already past → tomorrow
    return next - now;
  }

  function run() {
    if (!supabase) return;
    const today = new Date();
    const utcDate = today.toISOString().slice(0, 10);
    console.log(`[scheduler] Nightly run firing for ${utcDate}`);

    // Daily results email
    emailService.sendDailyResultsEmail(supabase)
      .catch(e => console.error('[email] Scheduled daily results error:', e.message));

    // Daily digest in-app notification
    sendDailyDigestNotifications(utcDate)
      .catch(e => console.error('[notifications] Scheduled daily digest error:', e.message));

    // Schedule next run in ~24 hours
    setTimeout(run, msUntilNextRun());
  }

  const delay = msUntilNextRun();
  console.log(`[email] Daily results email scheduled — first run in ${Math.round(delay / 60000)} min`);
  setTimeout(run, delay);
}
