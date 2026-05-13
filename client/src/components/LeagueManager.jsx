import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

function StandingsTable({ standings }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-pitch-600">
            <th className="text-left py-2 pr-3">Rank</th>
            <th className="text-left py-2 pr-3">Player</th>
            <th className="text-left py-2 pr-3">Country</th>
            <th className="text-right py-2 pr-3">Exact</th>
            <th className="text-right py-2 pr-3">Correct</th>
            <th className="text-right py-2 font-bold text-gold-400">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.name} className="border-b border-pitch-700/50 hover:bg-pitch-700/20 transition-colors">
              <td className="py-2.5 pr-3 font-bold text-slate-300">
                {medals[i] ?? `#${i + 1}`}
              </td>
              <td className="py-2.5 pr-3 text-white font-semibold">{s.name}</td>
              <td className="py-2.5 pr-3 text-slate-400">{s.country}</td>
              <td className="py-2.5 pr-3 text-right text-green-400">{s.exact}</td>
              <td className="py-2.5 pr-3 text-right text-blue-400">{s.correct}</td>
              <td className="py-2.5 text-right font-black text-gold-400 text-base">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span><span className="text-green-400 font-bold">Exact</span> = correct scoreline (+3 pts)</span>
        <span><span className="text-blue-400 font-bold">Correct</span> = right result (+1 pt)</span>
      </div>
    </div>
  );
}

export default function LeagueManager({ user, predictions }) {
  const [league, setLeague] = useLocalStorage('wc2026_league', null);
  const [view, setView] = useState('home'); // home | create | join | standings
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createLeague() {
    if (!leagueName.trim()) { toast.error('Enter a league name'); return; }
    setLoading(true);
    try {
      const data = await apiFetch('/leagues', {
        method: 'POST',
        body: JSON.stringify({ name: leagueName.trim(), creatorName: user.name, creatorCountry: user.country }),
      });
      setLeague({ code: data.code, name: data.league.name });
      toast.success(`League "${data.league.name}" created!`);
      setView('home');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinLeague() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error('Enter a valid 6-character code'); return; }
    setLoading(true);
    try {
      const data = await apiFetch(`/leagues/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name: user.name, country: user.country }),
      });
      setLeague({ code, name: data.league.name });
      toast.success(`Joined "${data.league.name}"!`);
      setView('home');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function syncPredictions() {
    if (!league) return;
    try {
      await apiFetch(`/leagues/${league.code}/predictions`, {
        method: 'POST',
        body: JSON.stringify({ memberName: user.name, predictions }),
      });
      toast.success('Predictions synced to league');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function loadStandings() {
    if (!league) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/leagues/${league.code}/standings`);
      setStandings(data.standings);
      setView('standings');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(league.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function leaveLeague() {
    if (confirm('Leave this league? Your local predictions are kept.')) {
      setLeague(null);
      setStandings(null);
      setView('home');
    }
  }

  // Home view — already in a league
  if (league && view === 'home') {
    return (
      <div className="animate-fade-in mt-6 space-y-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-1">Your League</p>
              <h2 className="text-2xl font-black text-white">{league.name}</h2>
            </div>
            <button onClick={leaveLeague} className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1">
              Leave
            </button>
          </div>

          {/* Invite code */}
          <div className="mt-4 bg-pitch-900 rounded-lg p-4 border border-pitch-600">
            <p className="text-slate-400 text-xs font-semibold mb-2">Invite friends with this code</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-black text-gold-400 tracking-[0.2em]">
                {league.code}
              </span>
              <button onClick={copyCode} className="btn-secondary text-xs py-1.5 px-3">
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Share this code with friends. They enter it under "My League → Join League".
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={syncPredictions} className="btn-primary flex-1 py-2.5 text-sm">
            Sync My Predictions
          </button>
          <button onClick={loadStandings} disabled={loading} className="btn-secondary flex-1 py-2.5 text-sm">
            {loading ? 'Loading…' : 'View Standings'}
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center">
          Sync your predictions so they count toward the league standings.
          Points are awarded when official match results are entered.
        </p>
      </div>
    );
  }

  // Standings view
  if (view === 'standings' && standings) {
    return (
      <div className="animate-fade-in mt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setView('home')} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <h2 className="text-white font-black text-xl">{league.name} — Standings</h2>
        </div>
        <div className="card">
          {standings.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No members yet</p>
          ) : (
            <StandingsTable standings={standings} />
          )}
        </div>
        <p className="text-slate-500 text-xs text-center mt-4">
          Standings update when official results are recorded. Check back after each match day!
        </p>
      </div>
    );
  }

  // No league yet — home
  if (!league && view === 'home') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏅</div>
          <h2 className="text-2xl font-black text-white">Mini League</h2>
          <p className="text-slate-400 text-sm mt-2">
            Create a private league and challenge your friends to beat your predictions
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setView('create')}
            className="card hover:border-gold-500/50 hover:bg-pitch-700 transition-all cursor-pointer text-center py-6 group"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="text-white font-bold">Create League</p>
            <p className="text-slate-400 text-xs mt-1">Start a new private league</p>
          </button>

          <button
            onClick={() => setView('join')}
            className="card hover:border-gold-500/50 hover:bg-pitch-700 transition-all cursor-pointer text-center py-6 group"
          >
            <div className="text-3xl mb-2">🔗</div>
            <p className="text-white font-bold">Join League</p>
            <p className="text-slate-400 text-xs mt-1">Enter an invite code</p>
          </button>
        </div>

        <div className="mt-6 card border-pitch-600/50">
          <h3 className="text-sm font-bold text-slate-300 mb-2">How it works</h3>
          <ul className="text-slate-400 text-xs space-y-1.5">
            <li>🎯 <strong className="text-slate-300">Exact scoreline</strong> — 3 points</li>
            <li>✅ <strong className="text-slate-300">Correct result</strong> (win/draw/loss) — 1 point</li>
            <li>❌ <strong className="text-slate-300">Wrong result</strong> — 0 points</li>
          </ul>
        </div>
      </div>
    );
  }

  // Create league form
  if (view === 'create') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button onClick={() => setView('home')} className="text-slate-400 hover:text-white text-sm mb-4 block">← Back</button>
        <div className="card">
          <h2 className="text-xl font-black text-white mb-1">Create a League</h2>
          <p className="text-slate-400 text-sm mb-5">Give your league a name — you'll get a shareable invite code</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">League Name</label>
              <input
                type="text"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createLeague()}
                placeholder="e.g. Work Mates 2026"
                maxLength={40}
                className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                           placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors"
              />
            </div>
            <button onClick={createLeague} disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating…' : 'Create League'}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center mt-3">
          The league server must be running for this to work. See README for setup.
        </p>
      </div>
    );
  }

  // Join league form
  if (view === 'join') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button onClick={() => setView('home')} className="text-slate-400 hover:text-white text-sm mb-4 block">← Back</button>
        <div className="card">
          <h2 className="text-xl font-black text-white mb-1">Join a League</h2>
          <p className="text-slate-400 text-sm mb-5">Enter the 6-character invite code from your friend</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Invite Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && joinLeague()}
                placeholder="e.g. AB3X7K"
                className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                           placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors
                           font-mono text-xl tracking-[0.2em] uppercase text-center"
                maxLength={6}
              />
            </div>
            <button onClick={joinLeague} disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Joining…' : 'Join League'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
