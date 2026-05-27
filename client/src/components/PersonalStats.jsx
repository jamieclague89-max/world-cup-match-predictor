import { useState, useEffect, useCallback } from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

function Skeleton({ compact }) {
  return <div className={`animate-pulse bg-pitch-700 rounded-xl ${compact ? 'h-14' : 'h-20'}`} />;
}

function StatCard({ label, value, sub, highlight = false, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-2 ${compact ? 'py-2' : 'py-3'} rounded-xl border
      ${highlight
        ? 'bg-gold-500/10 border-gold-500/20'
        : 'bg-pitch-800/60 border-pitch-700'
      }`}
    >
      <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black leading-none mb-1
        ${highlight ? 'text-gold-400' : 'text-white'}`}
      >
        {value}
      </div>
      <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-semibold text-slate-400 uppercase tracking-wide leading-tight`}>
        {label}
      </div>
      {sub && (
        <div className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-600 mt-0.5`}>{sub}</div>
      )}
    </div>
  );
}

export default function PersonalStats({ user, predictions, fixtures, compact = false }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Local stats from props (instant, no network) ──────────────────────────
  const totalFixtures = fixtures.length;
  const predicted = fixtures.filter(f => {
    const p = predictions[f.id];
    return p && (p.home !== '' || p.away !== '');
  }).length;
  const withScorer = fixtures.filter(f => !!predictions[f.id]?.scorer).length;
  const pct = totalFixtures > 0 ? Math.round((predicted / totalFixtures) * 100) : 0;

  // ── Fetch leaderboard for live points / rank ──────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const res  = await fetch('/api/leaderboard');
      const json = await res.json();
      const standings = json.standings || [];
      const idx = standings.findIndex(
        s => s.name.toLowerCase() === user.name.toLowerCase()
      );
      setData({
        standing:     idx >= 0 ? standings[idx] : null,
        rank:         idx >= 0 ? idx + 1 : null,
        total:        standings.length,
        resultsCount: json.resultsCount ?? 0,
      });
      setLastUpdated(new Date());
    } catch {
      // silent — stats just stay as they were
    } finally {
      setLoading(false);
    }
  }, [user.name]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const hasResults = (data?.resultsCount ?? 0) > 0;
  const { standing, rank, total } = data ?? {};

  const lastLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  // ── Outer wrapper ─────────────────────────────────────────────────────────
  const wrapperClass = compact
    ? 'bg-pitch-800 rounded-xl border border-pitch-700 p-3 space-y-2'
    : 'mt-6 mb-4 space-y-3';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={wrapperClass}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`font-bold text-slate-400 uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-sm'}`}>
          📊 Your Stats
        </h2>
        <div className="flex items-center gap-2">
          {!compact && lastLabel && (
            <span className="text-slate-600 text-xs">Updated {lastLabel}</span>
          )}
          <button onClick={refresh} disabled={loading} title="Refresh"
            className="text-slate-500 hover:text-slate-300 text-xs transition-colors disabled:opacity-40">
            ↻
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-5'}`}>
          {Array.from({ length: compact ? 4 : 5 }).map((_, i) => (
            <Skeleton key={i} compact={compact} />
          ))}
        </div>
      ) : (
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-5'}`}>

          {/* Rank */}
          <StatCard
            compact={compact}
            label="Rank"
            value={hasResults && rank ? (rank <= 3 ? MEDALS[rank - 1] : `#${rank}`) : '—'}
            sub={hasResults && total > 1 ? `of ${total}` : hasResults ? undefined : 'No results'}
            highlight={hasResults && !!rank && rank <= 3}
          />

          {/* Points */}
          <StatCard
            compact={compact}
            label="Points"
            value={hasResults && standing ? standing.points : '—'}
            sub={standing?.scorerBonus > 0 ? `+${standing.scorerBonus} scorer` : undefined}
            highlight={hasResults && !!standing && standing.points > 0}
          />

          {/* Predicted */}
          <StatCard
            compact={compact}
            label="Predicted"
            value={predicted}
            sub={`of ${totalFixtures}`}
            highlight={predicted === totalFixtures}
          />

          {/* Exact scores */}
          <StatCard
            compact={compact}
            label="Exact"
            value={hasResults && standing ? standing.exact : '—'}
            sub={standing?.exact > 0 ? '5 pts' : undefined}
            highlight={hasResults && standing?.exact > 0}
          />

          {/* Correct results — hidden in compact mode to keep 2×2 grid clean */}
          {!compact && (
            <StatCard
              label="Correct"
              value={hasResults && standing ? standing.correct : '—'}
              sub={standing?.correct > 0 ? '3 pts each' : undefined}
              highlight={false}
            />
          )}

        </div>
      )}

      {/* Prediction completion bar */}
      <div>
        <div className={`flex justify-between items-center text-slate-400 mb-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          <span className={pct === 100 ? 'text-green-400 font-semibold' : 'font-semibold'}>
            {pct === 100
              ? '✅ All predicted!'
              : `${predicted}/${totalFixtures} predicted`}
          </span>
          {withScorer > 0 && (
            <span className="text-gold-600">⚽ {withScorer}</span>
          )}
        </div>
        <div className={`bg-pitch-700 rounded-full overflow-hidden ${compact ? 'h-1' : 'h-2'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct === 100
                ? 'bg-gradient-to-r from-green-500 to-green-400'
                : 'bg-gradient-to-r from-gold-500 to-gold-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!compact && predicted < totalFixtures && (
          <p className="text-slate-600 text-xs mt-1">
            {totalFixtures - predicted} match{totalFixtures - predicted !== 1 ? 'es' : ''} still to predict
          </p>
        )}
      </div>

      {/* Pre-tournament placeholder */}
      {!hasResults && !compact && (
        <p className="text-slate-600 text-xs text-center bg-pitch-800/40 rounded-lg py-2 px-3 border border-pitch-700/50">
          Points and rankings appear here once the first results are confirmed on 11 June 2026.
        </p>
      )}
    </div>
  );
}
