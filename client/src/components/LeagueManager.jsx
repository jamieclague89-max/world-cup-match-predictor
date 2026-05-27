import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HeadToHead from './HeadToHead';

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

function StandingsTable({ standings, currentUser, onSelectOpponent }) {
  if (standings.length === 0) {
    return (
      <p className="text-slate-400 text-center py-8 text-sm">
        No results yet — standings will appear once match results are recorded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-pitch-600">
            <th className="text-left py-2 pr-3 w-10">Rank</th>
            <th className="text-left py-2 pr-3">Player</th>
            <th className="text-right py-2 pr-3 hidden sm:table-cell">
              <span className="text-gold-400">Exact</span>
            </th>
            <th className="text-right py-2 pr-3 hidden sm:table-cell">Result</th>
            <th className="text-right py-2 font-bold text-gold-400">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pitch-700/50">
          {standings.map((s, i) => {
            const isMe = currentUser && s.name.toLowerCase() === currentUser.name.toLowerCase();
            return (
              <tr
                key={s.name}
                onClick={() => !isMe && onSelectOpponent(s)}
                className={`transition-colors ${
                  isMe
                    ? 'bg-gold-500/5 border-l-2 border-gold-500'
                    : 'hover:bg-pitch-700/30 cursor-pointer'
                }`}
              >
                <td className="py-3 pr-3">
                  {i < 3
                    ? <span className="text-xl">{MEDALS[i]}</span>
                    : <span className="text-slate-400 font-bold text-sm">#{i + 1}</span>
                  }
                </td>
                <td className="py-3 pr-3">
                  <span className={`font-semibold ${isMe ? 'text-gold-400' : 'text-white'}`}>
                    {s.name}
                    {isMe && <span className="text-xs text-gold-600 ml-1.5">(you)</span>}
                  </span>
                  {!isMe && (
                    <span className="text-slate-600 text-xs ml-2 hidden sm:inline">
                      vs you →
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right text-gold-400 font-bold hidden sm:table-cell">{s.exact}</td>
                <td className="py-3 pr-3 text-right text-slate-300 hidden sm:table-cell">{s.correct}</td>
                <td className="py-3 text-right font-black text-gold-400 text-base">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-slate-600 text-xs text-center mt-3 pb-1">
        Tap any player to see a head-to-head comparison
      </p>
    </div>
  );
}

export default function LeagueManager({ user, predictions }) {
  // Persist which league the user has joined across sessions
  const [savedLeague, setSavedLeague] = useLocalStorage('wc2026_league', null);
  const [view, setView] = useState('home'); // 'home' | 'create' | 'join' | 'standings' | 'h2h'
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [opponent, setOpponent] = useState(null); // { name, userId }

  // ── Create league ───────────────────────────────────────────────────────────
  async function createLeague() {
    if (!leagueName.trim()) { toast.error('Enter a league name'); return; }
    setLoading(true);
    try {
      const data = await apiFetch('/leagues', {
        method: 'POST',
        body: JSON.stringify({ name: leagueName.trim(), userId: user.id }),
      });
      setSavedLeague({ code: data.code, name: data.league.name });
      toast.success(`League "${data.league.name}" created!`);
      setLeagueName('');
      setView('home');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Join league ─────────────────────────────────────────────────────────────
  async function joinLeague() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error('Enter a valid 6-character code'); return; }
    setLoading(true);
    try {
      const data = await apiFetch(`/leagues/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      setSavedLeague({ code, name: data.league.name });
      toast.success(`Joined "${data.league.name}"!`);
      setJoinCode('');
      setView('home');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Load standings ──────────────────────────────────────────────────────────
  const loadStandings = useCallback(async () => {
    if (!savedLeague) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/leagues/${savedLeague.code}/standings`);
      setStandings(data.standings);
      setView('standings');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [savedLeague]);

  // ── Copy invite code ────────────────────────────────────────────────────────
  function copyCode() {
    navigator.clipboard.writeText(savedLeague.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Leave league ────────────────────────────────────────────────────────────
  function leaveLeague() {
    if (confirm('Leave this league? You can always rejoin with the code.')) {
      setSavedLeague(null);
      setStandings(null);
      setView('home');
    }
  }

  // ── Views ───────────────────────────────────────────────────────────────────

  // Already in a league — home
  if (savedLeague && view === 'home') {
    return (
      <div className="animate-fade-in mt-6 space-y-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-1">Your League</p>
              <h2 className="text-2xl font-black text-white">{savedLeague.name}</h2>
            </div>
            <button
              onClick={leaveLeague}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1"
            >
              Leave
            </button>
          </div>

          {/* Invite code */}
          <div className="mt-4 bg-pitch-900 rounded-lg p-4 border border-pitch-600">
            <p className="text-slate-400 text-xs font-semibold mb-2">Invite friends with this code</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-black text-gold-400 tracking-[0.2em]">
                {savedLeague.code}
              </span>
              <button onClick={copyCode} className="btn-secondary text-xs py-1.5 px-3">
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Share this code with friends — they enter it under My League → Join League.
            </p>
          </div>
        </div>

        <button
          onClick={loadStandings}
          disabled={loading}
          className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50"
        >
          {loading ? 'Loading…' : '🏆 View League Standings'}
        </button>

        <p className="text-slate-600 text-xs text-center">
          Your predictions update automatically — no manual sync needed.
          Standings update as official results come in.
        </p>
      </div>
    );
  }

  // Head-to-head view
  if (view === 'h2h' && opponent && savedLeague) {
    return (
      <HeadToHead
        leagueCode={savedLeague.code}
        opponent={opponent}
        myPredictions={predictions ?? {}}
        myName={user.name}
        onBack={() => setView('standings')}
      />
    );
  }

  // Standings view
  if (view === 'standings' && standings) {
    return (
      <div className="animate-fade-in mt-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setView('home')}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-white font-black text-xl">{savedLeague.name}</h2>
        </div>

        <div className="card">
          <StandingsTable
            standings={standings}
            currentUser={user}
            onSelectOpponent={s => {
              setOpponent({ name: s.name, userId: s.userId });
              setView('h2h');
            }}
          />
        </div>

        <div className="flex gap-3 mt-3">
          <button
            onClick={loadStandings}
            disabled={loading}
            className="btn-secondary flex-1 py-2 text-sm"
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-3">
          Standings update automatically as official match results are confirmed.
        </p>
      </div>
    );
  }

  // No league — home
  if (!savedLeague && view === 'home') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏅</div>
          <h2 className="text-2xl font-black text-white">Mini League</h2>
          <p className="text-slate-400 text-sm mt-2">
            Create a private league and challenge your friends to beat your predictions
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setView('create')}
            className="card hover:border-gold-500/50 hover:bg-pitch-700/50 transition-all cursor-pointer text-center py-6"
          >
            <div className="text-3xl mb-2">➕</div>
            <p className="text-white font-bold">Create League</p>
            <p className="text-slate-400 text-xs mt-1">Start a new private league</p>
          </button>

          <button
            onClick={() => setView('join')}
            className="card hover:border-gold-500/50 hover:bg-pitch-700/50 transition-all cursor-pointer text-center py-6"
          >
            <div className="text-3xl mb-2">🔗</div>
            <p className="text-white font-bold">Join League</p>
            <p className="text-slate-400 text-xs mt-1">Enter an invite code</p>
          </button>
        </div>

        <div className="card border-pitch-600/50">
          <h3 className="text-sm font-bold text-slate-300 mb-3">How it works</h3>
          <ul className="text-slate-400 text-xs space-y-2">
            <li>🎯 <strong className="text-slate-300">Exact scoreline</strong> — 5 pts</li>
            <li>✅ <strong className="text-slate-300">Correct result</strong> — 3 pts</li>
            <li>⚽ <strong className="text-slate-300">First goalscorer</strong> — 3 pts bonus</li>
            <li>📏 <strong className="text-slate-300">Correct score, wrong winner</strong> — 1 pt</li>
          </ul>
        </div>
      </div>
    );
  }

  // Create league form
  if (view === 'create') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button
          onClick={() => setView('home')}
          className="text-slate-400 hover:text-white text-sm mb-4 block transition-colors"
        >
          ← Back
        </button>
        <div className="card">
          <h2 className="text-xl font-black text-white mb-1">Create a League</h2>
          <p className="text-slate-400 text-sm mb-5">
            Give your league a name — you'll get a 6-character invite code to share
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                League Name
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createLeague()}
                placeholder="e.g. Work Mates 2026"
                maxLength={40}
                autoFocus
                className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                           placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={createLeague}
              disabled={loading}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create League →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join league form
  if (view === 'join') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button
          onClick={() => setView('home')}
          className="text-slate-400 hover:text-white text-sm mb-4 block transition-colors"
        >
          ← Back
        </button>
        <div className="card">
          <h2 className="text-xl font-black text-white mb-1">Join a League</h2>
          <p className="text-slate-400 text-sm mb-5">
            Enter the 6-character invite code from your friend
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Invite Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && joinLeague()}
                placeholder="AB3X7K"
                autoFocus
                className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                           placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors
                           font-mono text-xl tracking-[0.2em] uppercase text-center"
                maxLength={6}
              />
            </div>
            <button
              onClick={joinLeague}
              disabled={loading}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join League →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
