import { useState, useMemo } from 'react';
import { isKickoffPassed, kickoffDate } from '../utils/fixtures';

// ── Urgency levels ────────────────────────────────────────────────────────────
// Based on days remaining until the first unpredicted, upcoming match
function getUrgency(daysLeft) {
  if (daysLeft < 1)  return 'critical'; // < 24 hours
  if (daysLeft < 3)  return 'high';     // 1–3 days
  if (daysLeft < 7)  return 'medium';   // 3–7 days
  return 'low';                          // > 7 days
}

const URGENCY_STYLES = {
  critical: {
    wrapper: 'bg-red-500/10 border-red-500/40',
    icon:    '🚨',
    title:   'text-red-400',
    bar:     'bg-red-500',
    badge:   'bg-red-500/20 text-red-400 border-red-500/40',
    btn:     'bg-red-500 hover:bg-red-400 text-white',
  },
  high: {
    wrapper: 'bg-orange-500/10 border-orange-500/40',
    icon:    '⚠️',
    title:   'text-orange-400',
    bar:     'bg-orange-500',
    badge:   'bg-orange-500/20 text-orange-400 border-orange-500/40',
    btn:     'bg-orange-500 hover:bg-orange-400 text-white',
  },
  medium: {
    wrapper: 'bg-amber-500/10 border-amber-500/40',
    icon:    '⏰',
    title:   'text-amber-400',
    bar:     'bg-amber-500',
    badge:   'bg-amber-500/20 text-amber-400 border-amber-500/40',
    btn:     'bg-amber-500 hover:bg-amber-400 text-white',
  },
  low: {
    wrapper: 'bg-blue-500/10 border-blue-500/40',
    icon:    '📋',
    title:   'text-blue-400',
    bar:     'bg-blue-500',
    badge:   'bg-blue-500/20 text-blue-400 border-blue-500/40',
    btn:     'bg-blue-500 hover:bg-blue-400 text-white',
  },
};

function formatTimeLeft(daysLeft) {
  if (daysLeft < 1) {
    const hoursLeft = daysLeft * 24;
    if (hoursLeft < 1) return 'less than an hour';
    return `${Math.floor(hoursLeft)} hour${Math.floor(hoursLeft) !== 1 ? 's' : ''}`;
  }
  if (daysLeft < 2) return '1 day';
  return `${Math.floor(daysLeft)} days`;
}

function getMessage(urgency, unpredictedCount, daysLeft) {
  const matches = `${unpredictedCount} match${unpredictedCount !== 1 ? 'es' : ''}`;
  const timeLeft = formatTimeLeft(daysLeft);

  switch (urgency) {
    case 'critical':
      return {
        heading: `Last chance — ${timeLeft} to go!`,
        body:    `You still have ${matches} without a prediction. Once a match kicks off, it's locked.`,
      };
    case 'high':
      return {
        heading: `Hurry — only ${timeLeft} left!`,
        body:    `${matches} still need a prediction before they kick off.`,
      };
    case 'medium':
      return {
        heading: `Tournament is ${timeLeft} away`,
        body:    `You have ${matches} without a prediction — fill them in before they lock.`,
      };
    default:
      return {
        heading: `${matches} still to predict`,
        body:    `The World Cup kicks off in ${timeLeft}. Make sure all your predictions are in!`,
      };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NudgeBanner({ predictions, fixtures, onShowUnpredicted }) {
  const [dismissed, setDismissed] = useState(false);

  // Only count fixtures that are upcoming (not yet locked)
  const { unpredictedCount, daysLeft, pct } = useMemo(() => {
    const total    = fixtures.length;
    const locked   = fixtures.filter(f => isKickoffPassed(f.date, f.kickoff));
    const upcoming = fixtures.filter(f => !isKickoffPassed(f.date, f.kickoff));

    const unpredicted = upcoming.filter(f => {
      const p = predictions[f.id];
      return !p || (p.home === '' && p.away === '');
    });

    // Days until the NEXT upcoming fixture that has no prediction
    const nextUnpred = unpredicted
      .map(f => kickoffDate(f.date, f.kickoff))
      .filter(Boolean)
      .sort((a, b) => a - b)[0];

    const msLeft  = nextUnpred ? nextUnpred.getTime() - Date.now() : Infinity;
    const days    = msLeft / (1000 * 60 * 60 * 24);

    // Completion % of upcoming matches
    const predictedUpcoming = upcoming.filter(f => {
      const p = predictions[f.id];
      return p && (p.home !== '' || p.away !== '');
    }).length;
    const completion = upcoming.length > 0
      ? Math.round((predictedUpcoming / upcoming.length) * 100)
      : 100;

    return {
      unpredictedCount: unpredicted.length,
      daysLeft:         days,
      pct:              completion,
    };
  }, [predictions, fixtures]);

  // Don't render if all upcoming matches are predicted or banner dismissed
  if (dismissed || unpredictedCount === 0) return null;

  const urgency = getUrgency(daysLeft);
  const styles  = URGENCY_STYLES[urgency];
  const { heading, body } = getMessage(urgency, unpredictedCount, daysLeft);

  return (
    <div className={`rounded-xl border px-4 py-3.5 mb-4 ${styles.wrapper}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">{styles.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${styles.title}`}>{heading}</p>
            <p className="text-slate-400 text-xs mt-0.5">{body}</p>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 text-lg leading-none mt-0.5"
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{pct}% of upcoming matches predicted</span>
          <span className={`font-bold border rounded-full px-2 py-0 text-xs ${styles.badge}`}>
            {unpredictedCount} remaining
          </span>
        </div>
        <div className="h-1.5 bg-pitch-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => {
          setDismissed(true);
          onShowUnpredicted?.();
        }}
        className={`mt-3 text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${styles.btn}`}
      >
        Show unpredicted matches →
      </button>
    </div>
  );
}
