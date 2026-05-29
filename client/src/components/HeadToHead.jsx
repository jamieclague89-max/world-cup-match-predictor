import { useState, useEffect } from 'react';
import { FIXTURES, TEAMS } from '../data/wc2026';

// ── Scoring (mirrors server, single match) ────────────────────────────────────
function scoreMatch(pred, result) {
  if (!pred || pred.home === '' || pred.away === '' || pred.home == null) {
    return { points: 0, outcome: 'none' };
  }
  const ph = parseInt(pred.home, 10), pa = parseInt(pred.away, 10);
  const ah = parseInt(result.home, 10), aa = parseInt(result.away, 10);

  let points = 0, outcome = 'wrong';

  if (ph === ah && pa === aa) {
    points += 5; outcome = 'exact';
  } else {
    const po = Math.sign(ph - pa), ao = Math.sign(ah - aa);
    if (po === ao)                     { points += 3; outcome = 'correct'; }
    else if ((ph - pa) === (ah - aa))  { points += 1; outcome = 'gdiff';   }
  }

  const totalGoals = ah + aa;
  const scorerHit =
    totalGoals > 0 && pred.scorer && result.scorer &&
    pred.scorer.toLowerCase().trim() === result.scorer.toLowerCase().trim();
  if (scorerHit) points += 3;

  return { points, outcome, scorerHit };
}

function Flag({ team, size = 24 }) {
  const code = TEAMS[team]?.code;
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm object-cover flex-shrink-0"
      loading="lazy"
    />
  );
}

const OUTCOME_LABEL = {
  exact:   { label: '🎯 Exact',    cls: 'text-gold-400' },
  correct: { label: '✅ Result',   cls: 'text-green-400' },
  gdiff:   { label: '📏 GD',       cls: 'text-blue-400'  },
  wrong:   { label: '❌ Miss',     cls: 'text-slate-500'  },
  none:    { label: '— None',      cls: 'text-slate-600'  },
};

// ── Single match comparison row ───────────────────────────────────────────────
function MatchRow({ fixture, myPred, theirPred, result }) {
  const mine  = scoreMatch(myPred,    result);
  const theirs = scoreMatch(theirPred, result);

  const myWins    = mine.points  > theirs.points;
  const theirWins = theirs.points > mine.points;
  const tied      = mine.points === theirs.points && mine.points > 0;

  const myOut    = OUTCOME_LABEL[mine.outcome]   ?? OUTCOME_LABEL.none;
  const theirOut = OUTCOME_LABEL[theirs.outcome] ?? OUTCOME_LABEL.none;

  return (
    <div className="card py-3 px-3 sm:px-4">
      {/* Match header */}
      <div className="flex items-center justify-center gap-2 mb-3 text-xs text-slate-500 font-semibold">
        <span>Group {fixture.group} · Rd {fixture.round}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Flag team={fixture.homeTeam} size={14} />
          <span className="text-white font-bold">{result.home}–{result.away}</span>
          <Flag team={fixture.awayTeam} size={14} />
        </span>
        <span className="text-slate-600">{fixture.homeTeam} vs {fixture.awayTeam}</span>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-3 gap-2 items-center">

        {/* My side */}
        <div className={`text-center rounded-lg px-2 py-2.5 border transition-all ${
          myWins  ? 'bg-green-500/10 border-green-500/30' :
          tied    ? 'bg-gold-500/10 border-gold-500/20'  :
          theirWins ? 'bg-pitch-800 border-pitch-700 opacity-70' :
          'bg-pitch-800 border-pitch-700'
        }`}>
          {myPred ? (
            <>
              <div className="text-white font-black text-lg leading-none">
                {myPred.home}–{myPred.away}
              </div>
              <div className={`text-xs font-semibold mt-1 ${myOut.cls}`}>
                {myOut.label}
              </div>
              <div className={`text-xs font-black mt-0.5 ${mine.points > 0 ? 'text-gold-400' : 'text-slate-600'}`}>
                {mine.points > 0 ? `+${mine.points}` : '0'} pts
              </div>
              {myPred.scorer && (
                <div className={`text-xs mt-0.5 ${mine.scorerHit ? 'text-gold-500 font-semibold' : 'text-slate-500'}`}>
                  ⚽ {myPred.scorer}{mine.scorerHit ? ' +3' : ''}
                </div>
              )}
            </>
          ) : (
            <span className="text-slate-600 text-xs">No prediction</span>
          )}
        </div>

        {/* Centre divider */}
        <div className="text-center">
          <div className="text-slate-500 text-xs font-semibold">VS</div>
          {myWins    && <div className="text-green-400 text-xs font-bold mt-1">← You win</div>}
          {theirWins && <div className="text-red-400 text-xs font-bold mt-1">They win →</div>}
          {tied      && <div className="text-gold-500 text-xs font-bold mt-1">Draw</div>}
          {!myWins && !theirWins && !tied && mine.points === 0 && theirs.points === 0 && (
            <div className="text-slate-600 text-xs mt-1">—</div>
          )}
        </div>

        {/* Their side */}
        <div className={`text-center rounded-lg px-2 py-2.5 border transition-all ${
          theirWins ? 'bg-red-500/10 border-red-500/30' :
          tied      ? 'bg-gold-500/10 border-gold-500/20' :
          myWins    ? 'bg-pitch-800 border-pitch-700 opacity-70' :
          'bg-pitch-800 border-pitch-700'
        }`}>
          {theirPred ? (
            <>
              <div className="text-white font-black text-lg leading-none">
                {theirPred.home}–{theirPred.away}
              </div>
              <div className={`text-xs font-semibold mt-1 ${theirOut.cls}`}>
                {theirOut.label}
              </div>
              <div className={`text-xs font-black mt-0.5 ${theirs.points > 0 ? 'text-gold-400' : 'text-slate-600'}`}>
                {theirs.points > 0 ? `+${theirs.points}` : '0'} pts
              </div>
              {theirPred.scorer && (
                <div className={`text-xs mt-0.5 ${theirs.scorerHit ? 'text-gold-500 font-semibold' : 'text-slate-500'}`}>
                  ⚽ {theirPred.scorer}{theirs.scorerHit ? ' +3' : ''}
                </div>
              )}
            </>
          ) : (
            <span className="text-slate-600 text-xs">No prediction</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary header ────────────────────────────────────────────────────────────
function H2HSummary({ myName, theirName, entries }) {
  let myTotal = 0, theirTotal = 0, myWins = 0, theirWins = 0, draws = 0;

  entries.forEach(({ mine, theirs }) => {
    myTotal    += mine.points;
    theirTotal += theirs.points;
    if (mine.points > theirs.points) myWins++;
    else if (theirs.points > mine.points) theirWins++;
    else if (mine.points > 0) draws++;
  });

  const diff   = Math.abs(myTotal - theirTotal);
  const leading = myTotal > theirTotal ? myName : myTotal < theirTotal ? theirName : null;

  return (
    <div className="card mb-4">
      {/* Points */}
      <div className="grid grid-cols-3 items-center text-center mb-4">
        <div>
          <div className="text-3xl font-black text-gold-400">{myTotal}</div>
          <div className="text-xs text-slate-400 font-semibold mt-0.5">
            {myName} <span className="text-gold-600">(you)</span>
          </div>
        </div>
        <div className="text-slate-500 text-sm font-bold">pts</div>
        <div>
          <div className="text-3xl font-black text-white">{theirTotal}</div>
          <div className="text-xs text-slate-400 font-semibold mt-0.5">{theirName}</div>
        </div>
      </div>

      {/* Status line */}
      {leading ? (
        <p className={`text-center text-sm font-bold mb-3 ${leading === myName ? 'text-green-400' : 'text-red-400'}`}>
          {leading === myName
            ? `🏆 You're ahead by ${diff} pt${diff !== 1 ? 's' : ''}`
            : `${theirName} leads by ${diff} pt${diff !== 1 ? 's' : ''}`}
        </p>
      ) : (
        <p className="text-center text-sm font-bold text-gold-400 mb-3">⚖️ Level on points</p>
      )}

      {/* Win/draw/loss record */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-pitch-700 pt-3">
          {[
            { label: 'You won',  value: myWins,    cls: 'text-green-400' },
            { label: 'Draws',    value: draws,      cls: 'text-gold-400' },
            { label: 'They won', value: theirWins,  cls: 'text-red-400'  },
          ].map(({ label, value, cls }) => (
            <div key={label} className="text-center">
              <div className={`text-xl font-black ${cls}`}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeadToHead({ leagueCode, opponent, myPredictions, myName, onBack }) {
  const [theirPredictions, setTheirPreds] = useState(null);
  const [results, setResults]             = useState({});
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [predsRes, resultsRes] = await Promise.all([
          fetch(`/api/leagues/${leagueCode}/member/${opponent.userId}/predictions`),
          fetch('/api/results'),
        ]);
        const predsData   = await predsRes.json();
        const resultsData = await resultsRes.json();

        if (!predsRes.ok)   throw new Error(predsData.error || 'Could not load predictions');
        if (!resultsRes.ok) throw new Error(resultsData.error || 'Could not load results');

        setTheirPreds(predsData.predictions ?? {});
        setResults(resultsData.results ?? {});
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leagueCode, opponent.userId]);

  // Build scored entries for completed matches only
  const entries = !theirPredictions ? [] : FIXTURES
    .filter(f => results[f.id])
    .map(f => {
      const result = results[f.id];
      const mine   = scoreMatch(myPredictions[f.id],    result);
      const theirs = scoreMatch(theirPredictions[f.id], result);
      return { fixture: f, result, mine, theirs };
    })
    .sort((a, b) =>
      a.fixture.date.localeCompare(b.fixture.date) ||
      a.fixture.kickoff.localeCompare(b.fixture.kickoff)
    );

  // Group by date
  const byDate = entries.reduce((acc, e) => {
    const d = e.fixture.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in mt-6">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white text-sm transition-colors mb-2 block"
        >
          ← Back
        </button>
        <h2 className="text-white font-black text-xl">Head-to-Head</h2>
        <p className="text-slate-400 text-xs mt-0.5">
          You vs {opponent.name} · completed matches only
        </p>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
        <span className="text-gold-500">You</span>
        <span>Match</span>
        <span>{opponent.name}</span>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-pitch-800 border border-pitch-700 rounded-xl h-28" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">⏳</div>
          <p className="font-semibold text-slate-400">No results yet</p>
          <p className="text-sm mt-1">
            Head-to-head comparison will appear once the first match results are confirmed.
          </p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <H2HSummary
            myName={myName}
            theirName={opponent.name}
            entries={entries}
          />

          <div className="space-y-6">
            {Object.entries(byDate).map(([date, dayEntries]) => {
              const label = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long',
              });
              return (
                <section key={date}>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <span className="flex-1 h-px bg-pitch-700" />
                    {label}
                    <span className="flex-1 h-px bg-pitch-700" />
                  </h3>
                  <div className="space-y-2.5">
                    {dayEntries.map(e => (
                      <MatchRow
                        key={e.fixture.id}
                        fixture={e.fixture}
                        myPred={myPredictions[e.fixture.id]}
                        theirPred={theirPredictions[e.fixture.id]}
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
