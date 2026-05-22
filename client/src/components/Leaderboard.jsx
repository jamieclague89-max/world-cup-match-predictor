import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api';

async function apiFetch(path, options) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const MEDALS = ['🥇', '🥈', '🥉'];

function RankBadge({ rank }) {
  if (rank < 3) return <span className="text-xl">{MEDALS[rank]}</span>;
  return <span className="text-slate-400 font-bold text-sm">#{rank + 1}</span>;
}

function LeaderboardTable({ standings, currentUser }) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-3">🌍</p>
        <p className="font-semibold text-slate-400">No entries yet</p>
        <p className="text-sm mt-1">Visit this tab after making predictions to appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-pitch-700">
            <th className="text-left py-2.5 pr-3 w-10">Rank</th>
            <th className="text-left py-2.5 pr-3">Player</th>
            <th className="text-left py-2.5 pr-3 hidden sm:table-cell">Country</th>
            <th className="text-right py-2.5 pr-3 hidden sm:table-cell">
              <span className="text-gold-400">Exact</span>
            </th>
            <th className="text-right py-2.5 pr-3 hidden sm:table-cell">Result</th>
            <th className="text-right py-2.5 font-bold text-gold-400">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pitch-700/50">
          {standings.map((entry, i) => {
            const isMe = currentUser && entry.name.toLowerCase() === currentUser.name.toLowerCase();
            return (
              <tr
                key={entry.name}
                className={`transition-colors ${
                  isMe
                    ? 'bg-gold-500/5 border-l-2 border-gold-500'
                    : 'hover:bg-pitch-700/20'
                }`}
              >
                <td className="py-3 pr-3">
                  <RankBadge rank={i} />
                </td>
                <td className="py-3 pr-3">
                  <span className={`font-semibold ${isMe ? 'text-gold-400' : 'text-white'}`}>
                    {entry.name}
                    {isMe && <span className="text-xs text-gold-600 ml-1.5">(you)</span>}
                  </span>
                </td>
                <td className="py-3 pr-3 text-slate-400 hidden sm:table-cell">{entry.country}</td>
                <td className="py-3 pr-3 text-right text-gold-400 font-bold hidden sm:table-cell">{entry.exact}</td>
                <td className="py-3 pr-3 text-right text-slate-300 hidden sm:table-cell">{entry.correct}</td>
                <td className="py-3 text-right font-black text-gold-400 text-base">{entry.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 border-t border-pitch-700 pt-3">
        <span><span className="text-gold-400 font-bold">Exact</span> — correct scoreline (5 pts)</span>
        <span><span className="text-slate-300 font-bold">Result</span> — right outcome (3 pts)</span>
        <span><span className="text-gold-400 font-bold">⚽ Scorer</span> — first goalscorer (3 pts)</span>
        <span>Goal diff = 1 pt</span>
      </div>
    </div>
  );
}

export default function Leaderboard({ user, predictions }) {
  const [standings, setStandings] = useState([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const hasSynced = useRef(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/leaderboard');
      setStandings(data.standings);
      setResultsCount(data.resultsCount);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Could not load leaderboard. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: silently push this user's predictions, then load standings
  useEffect(() => {
    async function registerAndFetch() {
      if (!hasSynced.current) {
        hasSynced.current = true;
        try {
          await apiFetch('/leaderboard', {
            method: 'POST',
            body: JSON.stringify({ name: user.name, country: user.country, predictions }),
          });
        } catch {
          // silently ignore — still show whatever standings exist
        }
      }
      await fetchStandings();
    }
    registerAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 60 seconds while the tab is open
  useEffect(() => {
    const id = setInterval(fetchStandings, 60_000);
    return () => clearInterval(id);
  }, [fetchStandings]);

  const myEntry = standings.find(
    s => s.name.toLowerCase() === user.name.toLowerCase()
  );
  const myRank = myEntry ? standings.indexOf(myEntry) + 1 : null;

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="animate-fade-in mt-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">🌍 Public Leaderboard</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {standings.length} {standings.length === 1 ? 'player' : 'players'}
            {resultsCount > 0
              ? ` · ${resultsCount} result${resultsCount !== 1 ? 's' : ''} recorded`
              : ' · Awaiting official results'}
            {lastUpdatedLabel && (
              <span className="text-slate-600"> · Updated {lastUpdatedLabel}</span>
            )}
          </p>
        </div>
        <button
          onClick={fetchStandings}
          disabled={loading}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>

      {/* Your position card — only shown once there are results */}
      {myRank && resultsCount > 0 && (
        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`}</span>
            <div>
              <p className="text-white font-semibold text-sm">
                Your position: <span className="text-gold-400 font-black">#{myRank}</span>
                {standings.length > 1 && (
                  <span className="text-slate-400 font-normal"> of {standings.length}</span>
                )}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                <span className="text-gold-400 font-bold">{myEntry.points} pts</span>
                {myEntry.exact > 0 && ` · ${myEntry.exact} exact score${myEntry.exact !== 1 ? 's' : ''}`}
                {myEntry.correct > 0 && ` · ${myEntry.correct} correct result${myEntry.correct !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Leaderboard table */}
      <div className="card">
        {loading && standings.length === 0 ? (
          <div className="text-center py-10 text-slate-500">Loading…</div>
        ) : (
          <LeaderboardTable standings={standings} currentUser={user} />
        )}
      </div>

      {resultsCount === 0 && (
        <p className="text-center text-slate-600 text-xs">
          Points will appear here automatically once the first match results are confirmed.
        </p>
      )}
    </div>
  );
}
