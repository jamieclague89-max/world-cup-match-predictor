import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

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
        <p className="text-sm mt-1">Be the first to join the leaderboard!</p>
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
        <span className="text-slate-600">Points update as official results are entered</span>
      </div>
    </div>
  );
}

export default function Leaderboard({ user, predictions }) {
  const [joined, setJoined] = useLocalStorage('wc2026_lb_joined', false);
  const [standings, setStandings] = useState([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useLocalStorage('wc2026_lb_synced', null);
  const [error, setError] = useState('');

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/leaderboard');
      setStandings(data.standings);
      setResultsCount(data.resultsCount);
    } catch (e) {
      setError('Could not load leaderboard. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  async function handleJoin() {
    setSyncing(true);
    setError('');
    try {
      await apiFetch('/leaderboard', {
        method: 'POST',
        body: JSON.stringify({ name: user.name, country: user.country, predictions }),
      });
      setJoined(true);
      setLastSynced(new Date().toISOString());
      await fetchStandings();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError('');
    try {
      await apiFetch('/leaderboard', {
        method: 'POST',
        body: JSON.stringify({ name: user.name, country: user.country, predictions }),
      });
      setLastSynced(new Date().toISOString());
      await fetchStandings();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  const myEntry = standings.find(
    s => s.name.toLowerCase() === user.name.toLowerCase()
  );
  const myRank = myEntry ? standings.indexOf(myEntry) : -1;

  const lastSyncedLabel = lastSynced
    ? new Date(lastSynced).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <div className="animate-fade-in mt-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">🌍 Public Leaderboard</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {standings.length} {standings.length === 1 ? 'player' : 'players'} ·{' '}
            {resultsCount === 0
              ? 'Awaiting official results'
              : `${resultsCount} result${resultsCount !== 1 ? 's' : ''} recorded`}
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

      {/* Your status card */}
      {!joined ? (
        <div className="card border-gold-500/30 bg-gold-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold">Join the public leaderboard</p>
              <p className="text-slate-400 text-sm mt-0.5">
                Submit your predictions and compete with everyone. Points are awarded automatically as match results come in.
              </p>
            </div>
            <button
              onClick={handleJoin}
              disabled={syncing}
              className="btn-primary text-sm py-2 px-5 flex-shrink-0 disabled:opacity-50"
            >
              {syncing ? 'Joining…' : 'Join Leaderboard'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {myRank >= 0 ? (
              <p className="text-white font-semibold text-sm">
                You are <span className="text-gold-400 font-black">#{myRank + 1}</span>
                {standings.length > 1 && (
                  <span className="text-slate-400 font-normal"> of {standings.length}</span>
                )}
                {myEntry && resultsCount > 0 && (
                  <span className="text-slate-400 font-normal"> · <span className="text-gold-400 font-bold">{myEntry.points} pts</span></span>
                )}
              </p>
            ) : (
              <p className="text-white font-semibold text-sm">You are on the leaderboard</p>
            )}
            <p className="text-slate-500 text-xs mt-0.5">
              {lastSyncedLabel ? `Last synced ${lastSyncedLabel}` : 'Not yet synced'}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary text-sm py-1.5 px-4 flex-shrink-0"
          >
            {syncing ? 'Syncing…' : '↑ Sync My Predictions'}
          </button>
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
          The leaderboard will show live points once match results start being recorded after kick-off.
        </p>
      )}
    </div>
  );
}
