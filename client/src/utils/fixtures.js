/**
 * Fixture utility helpers — shared across components.
 * All times in the fixture data use BST (UTC+1).
 */

/**
 * Returns true when the fixture's kickoff time has passed.
 * kickoff format: "20:00 BST"
 */
export function isKickoffPassed(date, kickoff) {
  try {
    const [time] = kickoff.split(' ');           // "20:00"
    const [hh, mm] = time.split(':').map(Number);
    // BST = UTC+1 → subtract 1 hour to get UTC
    const kickoffUTC = new Date(
      `${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`
    );
    kickoffUTC.setUTCHours(kickoffUTC.getUTCHours() - 1);
    return Date.now() >= kickoffUTC.getTime();
  } catch {
    return false;
  }
}

/**
 * Returns the UTC Date object for a fixture's kickoff time.
 * kickoff format: "20:00 BST"
 */
export function kickoffDate(date, kickoff) {
  try {
    const [time] = kickoff.split(' ');
    const [hh, mm] = time.split(':').map(Number);
    const d = new Date(
      `${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`
    );
    d.setUTCHours(d.getUTCHours() - 1);
    return d;
  } catch {
    return null;
  }
}

/**
 * Returns a human-readable countdown string to the fixture kickoff.
 * e.g. "3d 4h", "2h 15m", "45m", "Starting soon"
 */
export function countdownTo(date, kickoff) {
  const target = kickoffDate(date, kickoff);
  if (!target) return '';

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null; // already kicked off

  const totalSecs  = Math.floor(diff / 1000);
  const days       = Math.floor(totalSecs / 86400);
  const hours      = Math.floor((totalSecs % 86400) / 3600);
  const minutes    = Math.floor((totalSecs % 3600) / 60);

  if (days > 0)    return `${days}d ${hours}h`;
  if (hours > 0)   return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Starting soon';
}
