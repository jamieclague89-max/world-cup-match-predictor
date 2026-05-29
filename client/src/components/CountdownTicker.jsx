import { kickoffDate, isKickoffPassed } from '../utils/fixtures';
import { useNow } from '../hooks/useNow';

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2, '0'); }

function fmtCountdown(ms) {
  const s    = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86400);
  const hrs  = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}d ${pad2(hrs)}h ${pad2(mins)}m`;
  if (hrs  > 0) return `${pad2(hrs)}h ${pad2(mins)}m ${pad2(secs)}s`;
  return `${pad2(mins)}m ${pad2(secs)}s`;
}

function fmtMatchDate(dateStr, kickoffStr) {
  const d = kickoffDate(dateStr, kickoffStr);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CountdownTicker({ fixtures }) {
  const now = useNow(1000);

  const upcoming = fixtures
    .filter(f => !isKickoffPassed(f.date, f.kickoff))
    .sort((a, b) => kickoffDate(a.date, a.kickoff) - kickoffDate(b.date, b.kickoff));

  const next = upcoming[0];
  if (!next) return null;

  const kickoff = kickoffDate(next.date, next.kickoff);
  const msLeft  = kickoff ? kickoff - now : -1;
  if (msLeft <= 0) return null;

  const hrs  = msLeft / 3_600_000;
  const days = msLeft / 86_400_000;

  const isUrgent      = hrs < 1;
  const isImminent    = hrs < 6;
  const isSoon        = days < 1;
  const isFirstEver   = fixtures.indexOf(next) === 0; // very first tournament match

  // ── Label (left badge) ────────────────────────────────────────────────────
  const label = isFirstEver && days > 3
    ? '🏆 Tournament starts in'
    : isUrgent
    ? '🔴 Kicking off soon'
    : isSoon
    ? '⚽ Kick-off in'
    : '⚽ Next match';

  // ── Ticker text (duplicated for seamless loop) ────────────────────────────
  const countdownStr = fmtCountdown(msLeft);
  const dateStr      = fmtMatchDate(next.date, next.kickoff);

  const segment = isFirstEver && days > 3
    ? `${next.homeTeam} vs ${next.awayTeam}  ·  ${dateStr}  ·  ${next.kickoff}  ·  ${next.stadium}, ${next.city}  ·  ${countdownStr}`
    : `${next.homeTeam} vs ${next.awayTeam}  ·  ${dateStr}  ·  ${next.kickoff}  ·  ${next.stadium}, ${next.city}  ·  Kick-off in ${countdownStr}`;

  // ── Urgency colours ───────────────────────────────────────────────────────
  const labelClass = isUrgent
    ? 'bg-red-500/20 border-r border-red-500/30 text-red-400'
    : isImminent
    ? 'bg-amber-500/20 border-r border-amber-500/30 text-amber-300'
    : isFirstEver
    ? 'bg-gold-500/15 border-r border-gold-500/20 text-gold-400'
    : 'bg-pitch-700/60 border-r border-pitch-700 text-slate-400';

  const textClass = isUrgent
    ? 'text-red-300'
    : isImminent
    ? 'text-amber-200'
    : 'text-slate-300';

  const dotClass = isUrgent
    ? 'text-red-800'
    : isImminent
    ? 'text-amber-800'
    : 'text-slate-600';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center overflow-hidden bg-pitch-800 border border-pitch-700 rounded-lg h-9 mt-4 mb-2">

      {/* Static label badge */}
      <div className={`flex-shrink-0 h-full flex items-center px-3 ${labelClass}`}>
        {(isFirstEver && days > 3) ? (
          <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">
            🏆 <span className="hidden sm:inline">Tournament </span>starts in
          </span>
        ) : (
          <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">
            {label}
          </span>
        )}
      </div>

      {/* Scrolling ticker — pauses on hover so users can read it */}
      <div
        className="flex-1 overflow-hidden"
        onMouseEnter={e => {
          const el = e.currentTarget.querySelector('.ticker-inner');
          if (el) el.style.animationPlayState = 'paused';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget.querySelector('.ticker-inner');
          if (el) el.style.animationPlayState = 'running';
        }}
      >
        <span className={`ticker-inner inline-block whitespace-nowrap text-xs font-medium pl-4 ${textClass}`}>
          {segment}
          <span className={`mx-8 ${dotClass}`}>◆</span>
          {segment}
          <span className={`mx-8 ${dotClass}`}>◆</span>
        </span>
      </div>

    </div>
  );
}
