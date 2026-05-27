import { useState, useEffect, useCallback } from 'react';
import { FIXTURES } from '../data/wc2026';
import { TEAMS } from '../data/wc2026';

// ── Scoring logic (mirrors server calcScore, per-match) ───────────────────────
function scoreMatch(pred, result) {
  if (!pred || pred.home === '' || pred.away === '' || pred.home == null || pred.away == null) {
    return { points: 0, outcome: 'no-prediction', scorerCorrect: false };
  }

  const ph = parseInt(pred.home, 10);
  const pa = parseInt(pred.away, 10);
  const ah = parseInt(result.home, 10);
  const aa = parseInt(result.away, 10);

  let points = 0;
  let outcome = 'wrong';

  if (ph === ah && pa === aa) {
    points += 5;
    outcome = 'exact';
  } else {
    const po = Math.sign(ph - pa);
    const ao = Math.sign(ah - aa);
    if (po === ao) {
      points += 3;
      outcome = 'correct';
    } else if ((ph - pa) === (ah - aa)) {
      points += 1;
      outcome = 'gdiff';
    }
  }

  const totalGoals = ah + aa;
  const scorerCorrect =
    totalGoals > 0 &&
    !!pred.scorer &&
    !!result.scorer &&
    pred.scorer.toLowerCase().trim() === result.scorer.toLowerCase().trim();

  if (scorerCorrect) points += 3;

  return { points, outcome, scorerCorrect };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Flag({ team }) {
  const code = TEAMS[team]?.code;
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      width={24}
      height={16}
      className="rounded-sm object-cover flex-shrink-0"
      loading="lazy"
    />
  );
}

function OutcomePill({ outcome, points }) {
  const map = {
    exact:         { label: '🎯 Exact score',      cls: 'bg-gold-500/20 text-gold-400 border-gold-500/30' },
    correct:       { label: '✅ Correct result',    cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    gdiff:         { label: '📏 Correct score, wrong winner',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    wrong:         { label: '❌ No points',          cls: 'bg-pitch-700 text-slate-500 border-pitch-600' },
    'no-prediction': { label: '— No prediction',   cls: 'bg-pitch-700 text-slate-600 border-pitch-600' },
  };
  const { label, cls } = map[outcome] ?? map.wrong;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
      {points > 0 && <span className="font-black">· {points} pts</span>}
    </span>
  );
}

function PointsBadge({ points, outcome }) {
  if (outcome === 'no-prediction') {
    return <span className="text-slate-600 font-bold text-sm w-12 text-right flex-shrink-0">—</span>;
  }
  const colour = points >= 5 ? 'text-gold-400' : points >= 3 ? 'text-green-400' : points >= 1 ? 'text-blue-400' : 'text-slate-600';
  return (
    <span className={`font-black text-base w-12 text-right flex-shrink-0 ${colour}`}>
      {points > 0 ? `+${points}` : '0'}
    </span>
  );
}

// ── Single match result row ───────────────────────────────────────────────────
function ResultRow({ fixture, pred, result }) {
  const { outcome, points, scorerCorrect } = scoreMatch(pred, result);
  const hasPred = outcome !== 'no-prediction';

  const rowBg = {
    exact:   'border-l-2 border-l-gold-500 bg-gold-500/5',
    correct: 'border-l-2 border-l-green-500 bg-green-500/5',
    gdiff:   'border-l-2 border-l-blue-500 bg-blue-500/5',
    wrong:   '',
    'no-prediction': 'opacity-60',
  }[outcome] ?? '';

  return (
    <div className={`card py-3 px-4 ${rowBg}`}>
      {/* Top row: group/round badge + points */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-semibold">
            Group {fixture.group} · Round {fixture.round}
          </span>
        </div>
        <PointsBadge points={points} outcome={outcome} />
      </div>

      {/* Score row */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Flag team={fixture.homeTeam} />
          <span className="text-white font-semibold text-sm truncate">{fixture.homeTeam}</span>
        </div>

        {/* Actual score */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-white font-black text-lg w-5 text-center">{result.home}</span>
          <span className="text-slate-500 font-bold">–</span>
          <span className="text-white font-black text-lg w-5 text-center">{result.away}</span>
        </div>

        {/* Away team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-white font-semibold text-sm truncate text-right">{fixture.awayTeam}</span>
          <Flag team={fixture.awayTeam} />
        </div>
      </div>

      {/* Your prediction row */}
      <div className="mt-2 pt-2 border-t border-pitch-700 flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          {/* Outcome pill */}
          <OutcomePill outcome={outcome} points={outcome === 'no-prediction' ? 0 : points - (scorerCorrect ? 3 : 0)} />

          {/* Prediction detail */}
          {hasPred && (
            <p className="text-xs text-slate-500">
              Your prediction:&nbsp;
              <span className="text-slate-300 font-semibold">{pred.home} – {pred.away}</span>
            </p>
          )}

          {/* Scorer line */}
          {hasPred && pred?.scorer && (
            <p className="text-xs">
              <span className="text-slate-500">⚽ Scorer: </span>
              <span className={`font-semibold ${scorerCorrect ? 'text-gold-400' : 'text-slate-400'}`}>
                {pred.scorer}
              </span>
              {result.scorer && (
                <span className="text-slate-600">
                  &nbsp;(actual: {result.scorer || 'none'})
                </span>
              )}
              {scorerCorrect && <span className="text-gold-500 ml-1 font-bold">+3 pts</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────
function SummaryBar({ entries }) {
  const played = entries.filter(e => e.outcome !== 'no-prediction').length;
  const totalPts = entries.reduce((sum, e) => sum + e.points, 0);
  const exact   = entries.filter(e => e.outcome === 'exact').length;
  const correct = entries.filter(e => e.outcome === 'correct').length;
  const scorer  = entries.filter(e => e.scorerCorrect).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {[
        { label: 'Total points', value: totalPts, highlight: true },
        { label: 'Matches scored', value: `${played}/${entries.length}` },
        { label: 'Exact scores', value: exact,   sub: `× 5pts` },
        { label: 'Correct results', value: correct, sub: `× 3pts` },
      ].map(({ label, value, sub, highlight }) => (
        <div key={label}
          className={`text-center rounded-xl px-3 py-3 border
            ${highlight ? 'bg-gold-500/10 border-gold-500/20' : 'bg-pitch-800/60 border-pitch-700'}`}
        >
          <div className={`text-2xl font-black leading-none mb-0.5
            ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
          {sub && <div className="text-xs text-slate-600">{sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyResults({ predictions }) {
  const [results, setResults]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchResults = useCallback(async () => {
    setError('');
    try {
      const res  = await fetch('/api/results');
      const data = await res.json();
      setResults(data.results ?? {});
      setLastUpdated(new Date());
    } catch {
      setError('Could not load results. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const id = setInterval(fetchResults, 60_000);
    return () => clearInterval(id);
  }, [fetchResults]);

  // Build scored entries — only fixtures with a confirmed result
  const entries = FIXTURES
    .filter(f => results[f.id])
    .map(f => {
      const result = results[f.id];
      const pred   = predictions[f.id];
      const { outcome, points, scorerCorrect } = scoreMatch(pred, result);
      return { fixture: f, pred, result, outcome, points, scorerCorrect };
    })
    .sort((a, b) => {
      // Chronological — same date sort by kickoff
      const d = a.fixture.date.localeCompare(b.fixture.date);
      return d !== 0 ? d : a.fixture.kickoff.localeCompare(b.fixture.kickoff);
    });

  // Group by date
  const byDate = entries.reduce((acc, e) => {
    const d = e.fixture.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  const lastLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in mt-2 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">My Results</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {loading ? 'Loading…' : entries.length > 0
              ? `${entries.length} match${entries.length !== 1 ? 'es' : ''} played`
              : 'No results confirmed yet'}
            {lastLabel && <span className="text-slate-600"> · Updated {lastLabel}</span>}
          </p>
        </div>
        <button
          onClick={fetchResults}
          disabled={loading}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* No results yet */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">⏳</div>
          <p className="font-semibold text-slate-400">No results confirmed yet</p>
          <p className="text-sm mt-1">Your points breakdown will appear here once the first match is played on 11 June 2026.</p>
        </div>
      )}

      {/* Summary + results */}
      {entries.length > 0 && (
        <>
          <SummaryBar entries={entries} />

          <div className="space-y-6">
            {Object.entries(byDate).map(([date, dayEntries]) => {
              const label = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long',
              });
              const dayPts = dayEntries.reduce((sum, e) => sum + e.points, 0);
              return (
                <section key={date}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <span className="flex-1 h-px bg-pitch-700" />
                    {label}
                    {dayPts > 0 && (
                      <span className="text-gold-600 font-black normal-case tracking-normal text-sm">
                        +{dayPts} pts
                      </span>
                    )}
                    <span className="flex-1 h-px bg-pitch-700" />
                  </h3>
                  <div className="space-y-2.5">
                    {dayEntries.map(e => (
                      <ResultRow
                        key={e.fixture.id}
                        fixture={e.fixture}
                        pred={e.pred}
                        result={e.result}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
