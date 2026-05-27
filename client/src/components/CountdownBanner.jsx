import { useEffect } from 'react';
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
export default function CountdownBanner({ fixtures }) {
  const now = useNow(1000); // live per-second clock

  // Next fixture that hasn't kicked off yet (chronological order)
  const upcoming = fixtures
    .filter(f => !isKickoffPassed(f.date, f.kickoff))
    .sort((a, b) => kickoffDate(a.date, a.kickoff) - kickoffDate(b.date, b.kickoff));

  const next = upcoming[0];
  if (!next) return null;

  const kickoff = kickoffDate(next.date, next.kickoff);
  const msLeft  = kickoff ? kickoff - now : -1;
  if (msLeft <= 0) return null;

  // Urgency thresholds
  const hrs  = msLeft / 3_600_000;
  const days = msLeft / 86_400_000;

  const isUrgent   = hrs < 1;        // < 1 hour
  const isImminent = hrs < 6;        // < 6 hours
  const isSoon     = days < 1;       // < 24 hours
  const isFirst    = next === upcoming[0] && fixtures.indexOf(next) === 0; // very first match

  // Styles
  const cardStyle = isUrgent   ? 'border-red-500/50 bg-red-950/40'     :
                    isImminent ? 'border-amber-500/40 bg-amber-950/30'  :
                    isSoon     ? 'border-amber-600/25 bg-amber-950/10'  :
                                 'border-gold-500/25 bg-pitch-800/40';

  const countdownStyle = isUrgent   ? 'text-red-400'   :
                         isImminent ? 'text-amber-300'  :
                                      'text-gold-400';

  // Label
  const label = isFirst && days > 3
    ? '🏆 Tournament begins in'
    : isSoon
    ? '⚽ Kick-off in'
    : '⚽ Next match';

  return (
    <div className={`card mb-4 ${cardStyle}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* Left: match details */}
        <div className="min-w-0">
          <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-white font-black text-base leading-snug truncate">
            {next.homeTeam}
            <span className="text-slate-500 font-normal mx-1.5">vs</span>
            {next.awayTeam}
          </p>
          <p className="text-slate-400 text-xs mt-0.5 truncate">
            {fmtMatchDate(next.date, next.kickoff)}
            &nbsp;·&nbsp;{next.kickoff}
            &nbsp;·&nbsp;{next.stadium}
          </p>
        </div>

        {/* Right: countdown clock */}
        <div className="text-right flex-shrink-0">
          <p className={`text-2xl font-black tracking-tight tabular-nums leading-none ${countdownStyle}`}>
            {fmtCountdown(msLeft)}
          </p>
          {isImminent && (
            <p className="text-[11px] font-semibold text-amber-400 mt-1">
              ⚠️ Predictions lock at kick-off!
            </p>
          )}
          {!isImminent && isSoon && (
            <p className="text-[11px] text-slate-500 mt-1">
              Predictions lock at kick-off
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
