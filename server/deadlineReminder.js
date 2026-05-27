/**
 * Deadline reminder — checks once per hour for fixtures happening today.
 * For each fixture today that has no result yet, notifies users who haven't
 * predicted it yet (respects the notifyDeadlines user preference).
 */

const supabase  = require('./supabase');
const FIXTURES  = require('./fixtures-lookup');
const { sendDeadlineNotifications } = require('./notifications');

async function checkDeadlines() {
  if (!supabase) return;

  // Today's date in UTC (YYYY-MM-DD)
  const todayUTC = new Date().toISOString().slice(0, 10);

  // Fixtures kicking off today
  const todayFixtures = FIXTURES.filter(f => f.date === todayUTC);
  if (todayFixtures.length === 0) return;

  // Skip fixtures that already have a confirmed result
  const { data: results } = await supabase
    .from('results')
    .select('fixture_id');

  const completedIds = new Set((results || []).map(r => r.fixture_id));

  const pending = todayFixtures.filter(f => !completedIds.has(f.id));
  if (pending.length === 0) return;

  console.log(`[deadlineReminder] ${pending.length} fixture(s) today without results — sending deadline reminders`);

  for (const fixture of pending) {
    await sendDeadlineNotifications(
      fixture.id,
      fixture.homeTeam,
      fixture.awayTeam,
      fixture.date
    );
  }
}

let interval = null;

function start() {
  // Run once on start, then every hour
  checkDeadlines();
  interval = setInterval(checkDeadlines, 60 * 60 * 1000);
  console.log('[deadlineReminder] Started — checking every hour for today\'s fixtures.');
}

function stop() {
  if (interval) clearInterval(interval);
}

module.exports = { start, stop, checkDeadlines };
