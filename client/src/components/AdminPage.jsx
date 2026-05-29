import { useState, useMemo, useEffect, useRef } from 'react';
import { FIXTURES, TEAMS } from '../data/wc2026';
import { SQUADS } from '../data/squads';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';

const ALL_TEAMS = Object.keys(TEAMS).sort();

// Returns Authorization header using the current Supabase session JWT.
// No password ever leaves the client — the server verifies the token and
// checks is_admin in the profiles table.
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
  };
}
const GROUPS_LIST = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const VENUES = [
  { label: 'BMO Field, Toronto, Canada',                        stadium: 'BMO Field',               city: 'Toronto, ON',         hostCountry: 'Canada'  },
  { label: 'BC Place, Vancouver, Canada',                       stadium: 'BC Place',                city: 'Vancouver, BC',       hostCountry: 'Canada'  },
  { label: 'Hard Rock Stadium, Florida, USA',                   stadium: 'Hard Rock Stadium',       city: 'Miami Gardens, FL',   hostCountry: 'USA'     },
  { label: 'Mercedes-Benz Stadium, Atlanta, USA',               stadium: 'Mercedes-Benz Stadium',  city: 'Atlanta, GA',         hostCountry: 'USA'     },
  { label: 'Gillette Stadium, Boston, USA',                     stadium: 'Gillette Stadium',        city: 'Foxborough, MA',      hostCountry: 'USA'     },
  { label: 'Lincoln Financial Field, Philadelphia, USA',        stadium: 'Lincoln Financial Field', city: 'Philadelphia, PA',    hostCountry: 'USA'     },
  { label: 'MetLife Stadium, New York, USA',                    stadium: 'MetLife Stadium',         city: 'East Rutherford, NJ', hostCountry: 'USA'     },
  { label: 'Lumen Field, Seattle, USA',                         stadium: 'Lumen Field',             city: 'Seattle, WA',         hostCountry: 'USA'     },
  { label: "Levi's Stadium, San Francisco, USA",                stadium: "Levi's Stadium",          city: 'Santa Clara, CA',     hostCountry: 'USA'     },
  { label: 'SoFi Stadium, Los Angeles, USA',                    stadium: 'SoFi Stadium',            city: 'Inglewood, CA',       hostCountry: 'USA'     },
  { label: 'NRG Stadium, Houston, USA',                         stadium: 'NRG Stadium',             city: 'Houston, TX',         hostCountry: 'USA'     },
  { label: 'AT&T Stadium, Dallas, USA',                         stadium: 'AT&T Stadium',            city: 'Arlington, TX',       hostCountry: 'USA'     },
  { label: 'GEHA Field at Arrowhead Stadium, Kansas City, USA', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO',     hostCountry: 'USA'     },
  { label: 'Estadio AKRON, Guadalajara, Mexico',                stadium: 'Estadio AKRON',           city: 'Guadalajara',         hostCountry: 'Mexico'  },
  { label: 'Estadio Azteca, Mexico City, Mexico',               stadium: 'Estadio Azteca',          city: 'Mexico City',         hostCountry: 'Mexico'  },
  { label: 'Estadio BBVA, Monterrey, Mexico',                   stadium: 'Estadio BBVA',            city: 'Monterrey',           hostCountry: 'Mexico'  },
];

const inputClass =
  'bg-pitch-900 border border-pitch-600 rounded px-2 py-1.5 text-white text-sm ' +
  'focus:border-gold-400 focus:outline-none w-full';

function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-slate-400 font-semibold">{label}</span>
      {children}
    </label>
  );
}

function EditForm({ draft, setDraft, onSave, onCancel, fixtureId }) {
  function set(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
  }

  function setVenue(label) {
    const v = VENUES.find(v => v.label === label);
    if (v) setDraft(d => ({ ...d, stadium: v.stadium, city: v.city, hostCountry: v.hostCountry }));
  }

  const currentVenue = VENUES.find(v => v.stadium === draft.stadium)?.label ?? '';

  return (
    <div className="card border-gold-500/40 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">Editing {fixtureId}</h3>
        <div className="flex gap-2">
          <button onClick={onSave} className="btn-primary text-sm py-1.5 px-4">Save</button>
          <button onClick={onCancel} className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Home Team">
          <select value={draft.homeTeam} onChange={e => set('homeTeam', e.target.value)} className={inputClass}>
            {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Away Team">
          <select value={draft.awayTeam} onChange={e => set('awayTeam', e.target.value)} className={inputClass}>
            {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={draft.date}
            onChange={e => set('date', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Kickoff (BST)">
          <input
            type="text"
            value={draft.kickoff}
            onChange={e => set('kickoff', e.target.value)}
            placeholder="e.g. 8:00 PM BST"
            className={inputClass}
          />
        </Field>

        <Field label="Group">
          <select value={draft.group} onChange={e => set('group', e.target.value)} className={inputClass}>
            {GROUPS_LIST.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>

        <Field label="Round">
          <select value={draft.round} onChange={e => set('round', Number(e.target.value))} className={inputClass}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </Field>

        <Field label="Venue" className="col-span-2 sm:col-span-3">
          <select value={currentVenue} onChange={e => setVenue(e.target.value)} className={inputClass}>
            <option value="">— select venue —</option>
            {VENUES.map(v => <option key={v.label} value={v.label}>{v.label}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function FixtureRow({ fixture, isOverridden, onEdit, onReset }) {
  return (
    <div className={`card py-2.5 px-3 flex items-center gap-3 ${isOverridden ? 'border-gold-500/30 bg-pitch-800' : ''}`}>
      <span className="text-slate-500 text-xs font-mono w-8 flex-shrink-0">{fixture.id}</span>
      <div className="flex gap-1 flex-shrink-0">
        <span className="bg-pitch-700 text-slate-300 text-xs px-1.5 py-0.5 rounded">G{fixture.group}</span>
        <span className="bg-pitch-700 text-slate-400 text-xs px-1.5 py-0.5 rounded">R{fixture.round}</span>
      </div>
      <span className="text-white text-sm flex-1 min-w-0 truncate">
        {fixture.homeTeam} <span className="text-slate-500 mx-1">vs</span> {fixture.awayTeam}
      </span>
      <span className="text-slate-400 text-xs hidden sm:block flex-shrink-0">{fixture.date}</span>
      <span className="text-slate-500 text-xs hidden md:block flex-shrink-0 w-28 truncate">{fixture.kickoff}</span>
      {isOverridden && (
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
          title="Reset to default"
        >
          Reset
        </button>
      )}
      <button onClick={onEdit} className="btn-secondary text-xs py-1 px-3 flex-shrink-0">
        Edit
      </button>
    </div>
  );
}

// ── Auto-sync status panel ────────────────────────────────────────────────────
function SyncStatus() {
  const [syncData, setSyncData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/sync-status', { headers: await getAuthHeaders() });
      const data = await res.json();
      setSyncData(data);
    } catch {
      setSyncData({ error: 'Could not reach server' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  function fmt(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  if (!syncData) {
    return (
      <div className="card mb-4 text-slate-500 text-sm py-3 text-center">
        {loading ? 'Loading sync status…' : 'Unable to load sync status'}
      </div>
    );
  }

  const statusColor = syncData.error
    ? 'text-red-400'
    : syncData.enabled
    ? 'text-green-400'
    : 'text-amber-400';

  return (
    <div className="card mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-white font-bold text-sm flex items-center gap-2">
            ⚡ Auto Results Sync
            <span className={`text-xs font-normal ${statusColor}`}>
              {syncData.error ? '⚠ error' : syncData.enabled ? '● live' : '○ no API key'}
            </span>
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {syncData.enabled
              ? 'Syncing football-data.org via cron every 5 minutes'
              : 'Add FOOTBALL_DATA_API_KEY to Vercel environment variables to enable'}
          </p>
        </div>
        <button onClick={fetchStatus} disabled={loading} className="btn-secondary text-xs py-1 px-3 flex-shrink-0">
          {loading ? '…' : '↻'}
        </button>
      </div>

      {syncData.enabled && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-pitch-700/60 rounded-lg p-2">
            <p className="text-slate-500">Results stored</p>
            <p className="text-gold-400 font-black text-lg leading-none mt-0.5">{syncData.totalResults ?? 0}</p>
          </div>
          <div className="bg-pitch-700/60 rounded-lg p-2">
            <p className="text-slate-500">Last sync</p>
            <p className="text-slate-300 font-semibold mt-0.5">{fmt(syncData.lastRun)}</p>
          </div>
          <div className="bg-pitch-700/60 rounded-lg p-2">
            <p className="text-slate-500">Last success</p>
            <p className="text-green-400 font-semibold mt-0.5">{fmt(syncData.lastSuccess)}</p>
          </div>
          <div className="bg-pitch-700/60 rounded-lg p-2">
            <p className="text-slate-500">API key</p>
            <p className="text-slate-300 font-semibold mt-0.5 truncate">{syncData.apiKey || '—'}</p>
          </div>
        </div>
      )}

      {!syncData.enabled && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-300">
          <p className="font-semibold mb-0.5">How to set up</p>
          <ol className="text-amber-400/80 space-y-0.5 list-decimal list-inside">
            <li>Sign up free at <span className="text-amber-300 font-mono">football-data.org</span></li>
            <li>Copy your API token from your account dashboard</li>
            <li>Add <span className="font-mono">FOOTBALL_DATA_API_KEY</span> to your Vercel project environment variables</li>
            <li>Redeploy — results will sync automatically via the cron job every 5 minutes</li>
          </ol>
        </div>
      )}

      {syncData.lastError && (
        <p className="mt-2 text-xs text-red-400 bg-red-400/10 rounded px-2 py-1.5">
          Last error: {syncData.lastError}
        </p>
      )}
    </div>
  );
}

// ── Manual results entry panel ────────────────────────────────────────────────
function ResultsManager() {
  const [results, setResults] = useState({});       // { fixtureId: { home, away, scorer } }
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [saving, setSaving] = useState(null);       // fixtureId currently being saved
  const [saved, setSaved] = useState({});           // { fixtureId: true } flash
  const [error, setError] = useState('');
  const [editValues,  setEditValues]  = useState({}); // { fixtureId: { home, away, scorer } } local edits
  const [scorerTeams, setScorerTeams] = useState({}); // { fixtureId: 'home' | 'away' | '' }
  const [filterGroup, setFilterGroup] = useState('all');

  // Fetch current stored results from server
  async function fetchResults() {
    setLoadingFetch(true);
    setError('');
    try {
      const r2 = await fetch('/api/leaderboard/results', { headers: await getAuthHeaders() });
      if (r2.ok) {
        const d2 = await r2.json();
        const fetchedResults = d2.results || {};
        setResults(fetchedResults);
        setEditValues(prev => {
          const next = { ...prev };
          Object.entries(fetchedResults).forEach(([id, r]) => {
            if (!next[id]) next[id] = { home: r.home, away: r.away, scorer: r.scorer ?? '' };
          });
          return next;
        });
        // Infer which team each stored scorer belongs to
        setScorerTeams(prev => {
          const next = { ...prev };
          Object.entries(fetchedResults).forEach(([id, r]) => {
            if (!r.scorer || next[id]) return;
            const fixture = FIXTURES.find(f => f.id === id);
            if (!fixture) return;
            const inHome = (SQUADS[fixture.homeTeam] || []).some(p => p.name === r.scorer);
            next[id] = inHome ? 'home' : 'away';
          });
          return next;
        });
      }
    } catch (e) {
      setError('Could not load results from server.');
    } finally {
      setLoadingFetch(false);
    }
  }

  useEffect(() => { fetchResults(); }, []);

  function getEdit(id) {
    return editValues[id] || {
      home:   results[id]?.home   ?? '',
      away:   results[id]?.away   ?? '',
      scorer: results[id]?.scorer ?? '',
    };
  }

  function setEdit(id, key, val) {
    if ((key === 'home' || key === 'away') && val !== '' && !/^\d{0,2}$/.test(val)) return;
    setEditValues(prev => ({ ...prev, [id]: { ...getEdit(id), [key]: val } }));
  }

  async function saveResult(fixture) {
    const { home, away, scorer } = getEdit(fixture.id);
    if (home === '' || away === '') {
      setError(`Enter both scores for ${fixture.homeTeam} vs ${fixture.awayTeam}`);
      return;
    }
    setSaving(fixture.id);
    setError('');
    try {
      const res = await fetch('/api/leaderboard/results', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          results: { [fixture.id]: { home, away, scorer: scorer || '' } },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResults(prev => ({ ...prev, [fixture.id]: { home, away, scorer: scorer || '' } }));
      setSaved(prev => ({ ...prev, [fixture.id]: true }));
      setTimeout(() => setSaved(prev => { const n = { ...prev }; delete n[fixture.id]; return n; }), 2000);
    } catch (e) {
      setError(`Error saving ${fixture.id}: ${e.message}`);
    } finally {
      setSaving(null);
    }
  }

  async function clearResult(fixtureId) {
    if (!confirm(`Clear result for ${fixtureId}?`)) return;
    setSaving(fixtureId);
    setError('');
    try {
      const res = await fetch('/api/leaderboard/results', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          results: { [fixtureId]: null },
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setResults(prev => { const n = { ...prev }; delete n[fixtureId]; return n; });
      setEditValues(prev => { const n = { ...prev }; delete n[fixtureId]; return n; });
    } catch (e) {
      setError(`Error clearing ${fixtureId}: ${e.message}`);
    } finally {
      setSaving(null);
    }
  }

  const groups = ['all', ...GROUPS_LIST];
  const filtered = FIXTURES.filter(f => filterGroup === 'all' || f.group === filterGroup);
  const resultCount = Object.keys(results).length;

  return (
    <div className="card mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-sm">📋 Manual Results Entry</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {resultCount > 0 ? `${resultCount} result${resultCount !== 1 ? 's' : ''} stored` : 'No results stored yet'}
            {' · '}Enter the score and first goalscorer for each match
          </p>
        </div>
        <button onClick={fetchResults} disabled={loadingFetch} className="btn-secondary text-xs py-1 px-3">
          {loadingFetch ? '…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {/* Group filter — dropdown on mobile, pills on desktop */}
      <div className="mb-3">
        {/* Mobile: select dropdown */}
        <select
          className="sm:hidden w-full bg-pitch-900 border border-pitch-600 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-400 focus:outline-none"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
        >
          {groups.map(g => (
            <option key={g} value={g}>{g === 'all' ? 'All Groups' : `Group ${g}`}</option>
          ))}
        </select>

        {/* Desktop: pill buttons */}
        <div className="hidden sm:flex gap-1 flex-wrap">
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterGroup === g
                  ? 'bg-gold-500 border-gold-500 text-pitch-900 font-bold'
                  : 'border-pitch-600 text-slate-400 hover:border-slate-400'
              }`}
            >
              {g === 'all' ? 'All' : `Group ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Fixture rows */}
      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {filtered.map(f => {
          const stored   = results[f.id];
          const edit     = getEdit(f.id);
          const hasScore = edit.home !== '' && edit.away !== '';
          const isNilNil = edit.home === '0' && edit.away === '0';
          const isDirty  = stored
            ? (edit.home !== stored.home || edit.away !== stored.away || (edit.scorer || '') !== (stored.scorer || ''))
            : (edit.home !== '' || edit.away !== '');
          const isSaving = saving === f.id;
          const wasSaved = saved[f.id];

          const homeSquad    = (SQUADS[f.homeTeam] || []).slice().sort((a, b) => a.name.localeCompare(b.name));
          const awaySquad    = (SQUADS[f.awayTeam] || []).slice().sort((a, b) => a.name.localeCompare(b.name));
          const scorerTeam   = scorerTeams[f.id] || '';
          const activeSquad  = scorerTeam === 'home' ? homeSquad : scorerTeam === 'away' ? awaySquad : [];

          function handleTeamSelect(side) {
            if (scorerTeam === side) {
              // Deselect — clear team and scorer
              setScorerTeams(prev => ({ ...prev, [f.id]: '' }));
              setEdit(f.id, 'scorer', '');
            } else {
              setScorerTeams(prev => ({ ...prev, [f.id]: side }));
              // Clear scorer if it belonged to the other team
              const newSquad = side === 'home' ? homeSquad : awaySquad;
              if (edit.scorer && !newSquad.some(p => p.name === edit.scorer)) {
                setEdit(f.id, 'scorer', '');
              }
            }
          }

          return (
            <div
              key={f.id}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                stored ? 'bg-green-500/5 border border-green-500/20' : 'bg-pitch-700/40 border border-pitch-700/40'
              }`}
            >
              {/* ── Score row ── */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">

                {/* ID + Teams */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-slate-500 text-xs font-mono w-7 flex-shrink-0">{f.id}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-xs truncate block">
                      {f.homeTeam} <span className="text-slate-500">vs</span> {f.awayTeam}
                    </span>
                    <span className="text-slate-600 text-xs">{f.date}</span>
                  </div>
                </div>

                {/* Score inputs + actions — indented on mobile to sit under the team name */}
                <div className="flex items-center gap-1.5 pl-9 sm:pl-0">
                  <input
                    type="text" inputMode="numeric"
                    value={edit.home} onChange={e => setEdit(f.id, 'home', e.target.value)}
                    placeholder="—"
                    className="w-9 text-center bg-pitch-900 border border-pitch-600 rounded px-1 py-1 text-white text-sm focus:border-gold-400 focus:outline-none"
                  />
                  <span className="text-slate-500 text-xs">–</span>
                  <input
                    type="text" inputMode="numeric"
                    value={edit.away} onChange={e => setEdit(f.id, 'away', e.target.value)}
                    placeholder="—"
                    className="w-9 text-center bg-pitch-900 border border-pitch-600 rounded px-1 py-1 text-white text-sm focus:border-gold-400 focus:outline-none"
                  />

                  {/* Save button */}
                  <button
                    onClick={() => saveResult(f)}
                    disabled={isSaving || (!isDirty && !stored)}
                    className={`text-xs px-2.5 py-1 rounded-lg flex-shrink-0 font-semibold transition-colors ${
                      wasSaved
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : isDirty
                        ? 'btn-primary'
                        : 'text-slate-600 border border-pitch-700 cursor-default'
                    }`}
                  >
                    {isSaving ? '…' : wasSaved ? '✓' : isDirty ? 'Save' : stored ? 'Saved' : 'Save'}
                  </button>

                  {/* Clear button */}
                  {stored && (
                    <button
                      onClick={() => clearResult(f.id)}
                      disabled={isSaving}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Clear result"
                    >✕</button>
                  )}
                </div>
              </div>

              {/* ── First goalscorer — step 1: pick team, step 2: pick player ── */}
              <div className="mt-2 pl-7 space-y-1.5">
                <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide">
                  ⚽ First Goalscorer
                </span>

                {/* Team buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[{ side: 'home', team: f.homeTeam }, { side: 'away', team: f.awayTeam }].map(({ side, team }) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => handleTeamSelect(side)}
                      disabled={isNilNil}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all truncate
                        ${isNilNil
                          ? 'opacity-30 cursor-not-allowed border-pitch-700 text-slate-600'
                          : scorerTeam === side
                          ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                          : 'border-pitch-600 text-slate-400 hover:border-pitch-500 hover:text-slate-200'
                        }`}
                    >
                      <span className="truncate">{team}</span>
                      {scorerTeam === side && <span className="ml-auto text-gold-500 flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>

                {/* Player dropdown — only shown once a team is selected */}
                {scorerTeam && !isNilNil && (
                  <div className="relative">
                    <select
                      value={edit.scorer || ''}
                      onChange={e => setEdit(f.id, 'scorer', e.target.value)}
                      autoFocus={!edit.scorer}
                      className={`w-full appearance-none bg-pitch-900 border rounded px-2 py-1.5 text-sm focus:outline-none pr-6 transition-colors
                        ${edit.scorer
                          ? 'border-gold-500/60 text-gold-300 focus:border-gold-400'
                          : 'border-pitch-600 text-slate-400 focus:border-gold-400'
                        }`}
                    >
                      <option value="">— Select a player —</option>
                      {activeSquad.map(p => (
                        <option key={p.name} value={p.name}>{p.pos} · {p.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▼</span>
                  </div>
                )}

                {/* Confirmed selection */}
                {edit.scorer && !isNilNil && (
                  <p className="text-xs text-gold-500 flex items-center gap-1">
                    🎯 <span className="font-semibold">{edit.scorer}</span>
                    <span className="text-slate-600">({scorerTeam === 'home' ? f.homeTeam : f.awayTeam})</span>
                    <button
                      type="button"
                      onClick={() => { setEdit(f.id, 'scorer', ''); setScorerTeams(prev => ({ ...prev, [f.id]: '' })); }}
                      className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
                      title="Clear"
                    >✕</button>
                  </p>
                )}

                {isNilNil && (
                  <p className="text-slate-600 text-xs">No goalscorer — 0–0</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── In-app notifications panel ────────────────────────────────────────────────
function NotificationsPanel() {
  const [sending, setSending]   = useState({});
  const [results, setResults]   = useState({});
  const [digestDate, setDigestDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalCount, setTotalCount] = useState(null);

  // Load total notification count on mount
  useEffect(() => {
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalCount(count ?? 0));
  }, []);

  async function trigger(type, extraBody = {}) {
    setSending(s => ({ ...s, [type]: true }));
    setResults(s => ({ ...s, [type]: null }));
    try {
      const res = await fetch(`/api/admin/notifications/${type}`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ...extraBody }),
      });
      const data = await res.json();
      setResults(s => ({ ...s, [type]: res.ok ? '✅ ' + data.message : '❌ ' + data.error }));
      // Refresh total count
      if (res.ok) {
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .then(({ count }) => setTotalCount(count ?? 0));
      }
    } catch (e) {
      setResults(s => ({ ...s, [type]: '❌ ' + e.message }));
    } finally {
      setSending(s => ({ ...s, [type]: false }));
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-sm font-bold text-white">🔔 In-App Notifications</h3>
        {totalCount !== null && (
          <span className="text-xs text-slate-500 flex-shrink-0">
            {totalCount.toLocaleString()} sent total
          </span>
        )}
      </div>
      <p className="text-slate-500 text-xs mb-5">
        These send in-app notifications to users directly — visible in the bell icon in the header.
        Deadline reminders and the daily digest also fire automatically; use these buttons to
        trigger them manually at any time.
      </p>

      <div className="space-y-5">

        {/* ── Deadline reminders ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-300">
              ⏰ Deadline Reminders
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Notifies all users who haven't yet predicted today's fixtures.
              Auto-fires hourly on match days.
            </p>
            {results['deadline'] && (
              <p className="text-xs mt-1.5 font-semibold text-slate-400">{results['deadline']}</p>
            )}
          </div>
          <button
            onClick={() => trigger('deadline')}
            disabled={sending['deadline']}
            className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-50"
          >
            {sending['deadline'] ? 'Sending…' : 'Send now'}
          </button>
        </div>

        {/* ── Daily digest ── */}
        <div className="border-t border-pitch-700 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-300">
                📊 End-of-Day Results Digest
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tells users today's results are in and to check the leaderboard.
                Auto-fires at 23:00 BST on match days (skipped on rest days).
              </p>
              {results['daily-digest'] && (
                <p className="text-xs mt-1.5 font-semibold text-slate-400">{results['daily-digest']}</p>
              )}
            </div>
            <button
              onClick={() => trigger('daily-digest', { date: digestDate })}
              disabled={sending['daily-digest']}
              className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-50"
            >
              {sending['daily-digest'] ? 'Sending…' : 'Send now'}
            </button>
          </div>
          {/* Date picker for manual overrides */}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-slate-500 flex-shrink-0">For date:</label>
            <input
              type="date"
              value={digestDate}
              onChange={e => setDigestDate(e.target.value)}
              className="bg-pitch-900 border border-pitch-600 rounded px-2 py-1 text-white text-xs
                         focus:border-gold-400 focus:outline-none"
            />
            <span className="text-xs text-slate-600">
              (defaults to today — change to test a specific date)
            </span>
          </div>
        </div>

      </div>

      <p className="text-slate-600 text-xs mt-5 border-t border-pitch-700 pt-3">
        📌 Users control which notification types they receive via their Preferences page.
        Notifications respect each user's <span className="text-slate-500">notifyResults</span> and{' '}
        <span className="text-slate-500">notifyDeadlines</span> settings.
      </p>
    </div>
  );
}

// ── Email notification panel ──────────────────────────────────────────────────
function EmailPanel() {
  const [sending, setSending]         = useState({});
  const [results, setResults]         = useState({});
  const [reminderDate, setReminderDate] = useState('2026-06-11'); // first match day as default test date

  // Jules Rimet invite state — league selected from existing leagues in the DB
  const [jrEmails,        setJrEmails]        = useState('');
  const [jrLeagueCode,    setJrLeagueCode]    = useState('');
  const [jrLeagues,       setJrLeagues]       = useState([]);   // all leagues from DB
  const [jrLeaguesLoading, setJrLeaguesLoading] = useState(true);
  const [jrSending,       setJrSending]       = useState(false);
  const [jrResult,        setJrResult]        = useState('');

  // Load all leagues from Supabase so admin can pick the Jules Rimet one
  useEffect(() => {
    supabase
      .from('leagues')
      .select('code, name')
      .order('name')
      .then(({ data }) => {
        setJrLeagues(data || []);
        // Auto-select if there's only one league, or one with "Jules" in the name
        if (data?.length === 1) {
          setJrLeagueCode(data[0].code);
        } else {
          const jr = data?.find(l => l.name.toLowerCase().includes('jules'));
          if (jr) setJrLeagueCode(jr.code);
        }
      })
      .finally(() => setJrLeaguesLoading(false));
  }, []);

  async function sendJulesRimetInvite() {
    setJrSending(true);
    setJrResult('');
    const emails = jrEmails
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emails.length === 0) {
      setJrResult('❌ Please enter at least one valid email address');
      setJrSending(false);
      return;
    }
    if (!jrLeagueCode.trim()) {
      setJrResult('❌ Please enter a league code');
      setJrSending(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/email/jules-rimet-invite', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ emails, leagueCode: jrLeagueCode.trim() }),
      });
      const data = await res.json();
      setJrResult(res.ok ? '✅ ' + data.message : '❌ ' + (data.error || 'Unknown error'));
      if (res.ok) {
        setJrEmails('');
      }
    } catch (e) {
      setJrResult('❌ ' + e.message);
    } finally {
      setJrSending(false);
    }
  }

  async function trigger(type, body = {}) {
    setSending(s => ({ ...s, [type]: true }));
    setResults(s => ({ ...s, [type]: null }));
    try {
      const res = await fetch(`/api/admin/email/${type}`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResults(s => ({ ...s, [type]: res.ok ? '✅ ' + data.message : '❌ ' + (data.error || 'Unknown error') }));
    } catch (e) {
      setResults(s => ({ ...s, [type]: '❌ ' + e.message }));
    } finally {
      setSending(s => ({ ...s, [type]: false }));
    }
  }

  const simpleActions = [
    {
      id: 'daily-results',
      label: '⚽ Send Today\'s Results Email',
      desc: 'Sends today\'s result digest to all users (auto-fires at 23:00 BST)',
    },
    {
      id: 'reminder',
      label: '📋 Send Pre-Tournament Reminder',
      desc: 'Emails all users who still have unfilled predictions across the whole tournament',
    },
    {
      id: 'digest',
      label: '📊 Send Weekly Digest',
      desc: 'Sends current standings to all users',
    },
  ];

  return (
    <div className="card mb-6">
      <h3 className="text-sm font-bold text-white mb-1">✉️ Email Notifications</h3>
      <p className="text-slate-500 text-xs mb-4">
        Prediction reminders auto-fire at 00:01 BST and 09:00 BST, results emails at 23:00 BST on match days.
        Use these buttons to trigger any email manually at any time.
      </p>

      <div className="space-y-4">

        {/* ── Daily prediction reminder — has its own date picker ── */}
        <div className="bg-pitch-700/30 border border-pitch-700 rounded-xl p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-300">⏰ Send Daily Prediction Reminder</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Emails users who haven't predicted the chosen date's fixtures.
                Auto-fires at 00:01 BST and 09:00 BST on match days.
              </p>
              {results['daily-prediction-reminder'] && (
                <p className="text-xs mt-1.5 font-semibold text-slate-400">{results['daily-prediction-reminder']}</p>
              )}
            </div>
            <button
              onClick={() => trigger('daily-prediction-reminder', { date: reminderDate })}
              disabled={sending['daily-prediction-reminder']}
              className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-50"
            >
              {sending['daily-prediction-reminder'] ? 'Sending…' : 'Send now'}
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <label className="text-xs text-slate-500 flex-shrink-0">For date:</label>
            <input
              type="date"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              className="bg-pitch-900 border border-pitch-600 rounded px-2 py-1 text-white text-xs
                         focus:border-gold-400 focus:outline-none"
            />
            <span className="text-xs text-slate-600">
              Set to a match day (e.g. 2026-06-11) to preview the email
            </span>
          </div>
        </div>

        {/* ── Simple one-click email actions ── */}
        {simpleActions.map(({ id, label, desc }) => (
          <div key={id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
              {results[id] && (
                <p className="text-xs mt-1 font-semibold text-slate-400">{results[id]}</p>
              )}
            </div>
            <button
              onClick={() => trigger(id)}
              disabled={sending[id]}
              className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-50"
            >
              {sending[id] ? 'Sending…' : 'Send now'}
            </button>
          </div>
        ))}

        {/* ── Jules Rimet invite code ── */}
        <div className="border-t border-pitch-700 pt-4">
          <p className="text-sm font-semibold text-slate-300 mb-0.5">🏆 Send Jules Rimet Invite Code</p>
          <p className="text-xs text-slate-500 mb-3">
            Manually send the private league invite code to one or more users who have paid their entry fee.
            Separate multiple addresses with commas, semicolons, or new lines.
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">League</label>
              {jrLeaguesLoading ? (
                <p className="text-slate-600 text-xs py-2">Loading leagues…</p>
              ) : jrLeagues.length === 0 ? (
                <p className="text-amber-400 text-xs py-2">
                  No leagues found — create the Jules Rimet Jackpot league in the app first.
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={jrLeagueCode}
                    onChange={e => setJrLeagueCode(e.target.value)}
                    className="w-full appearance-none bg-pitch-900 border border-pitch-600 rounded px-3 py-2
                               text-white text-sm focus:border-gold-400 focus:outline-none pr-8"
                  >
                    <option value="">— Select a league —</option>
                    {jrLeagues.map(l => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▼</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Recipient Email(s)</label>
              <textarea
                value={jrEmails}
                onChange={e => setJrEmails(e.target.value)}
                placeholder="user@example.com&#10;another@example.com"
                rows={3}
                className="w-full bg-pitch-900 border border-pitch-600 rounded px-3 py-2 text-white text-sm
                           placeholder-slate-600 focus:border-gold-400 focus:outline-none resize-none"
              />
            </div>

            {jrResult && (
              <p className="text-xs font-semibold text-slate-400">{jrResult}</p>
            )}

            <button
              onClick={sendJulesRimetInvite}
              disabled={jrSending || !jrLeagueCode.trim() || !jrEmails.trim()}
              className="btn-primary text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {jrSending ? 'Sending…' : '🎉 Send Invite Code'}
            </button>
          </div>
        </div>

      </div>
      <p className="text-slate-600 text-xs mt-4 border-t border-pitch-700 pt-3">
        📌 While using <code className="text-slate-500">onboarding@resend.dev</code>, emails only
        deliver to the Resend account owner's address. Add a verified domain in your Resend
        dashboard and update <code className="text-slate-500">NOTIFY_FROM</code> in{' '}
        <code className="text-slate-500">server/.env</code> to send to all users.
      </p>
    </div>
  );
}

// ── Bookies Odds manager ──────────────────────────────────────────────────────
// Implied probability from fractional odds string e.g. "4/1" → 20%
function pct(odds) {
  if (!odds) return null;
  const parts = String(odds).split('/');
  if (parts.length !== 2) return null;
  const num = parseFloat(parts[0]);
  const den = parseFloat(parts[1]);
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return Math.round((den / (num + den)) * 100);
}

const EMPTY_SCORELINES = () => [
  { home: '', away: '', odds: '' },
  { home: '', away: '', odds: '' },
  { home: '', away: '', odds: '' },
];
const EMPTY_SCORERS = () => [
  { name: '', odds: '' },
  { name: '', odds: '' },
  { name: '', odds: '' },
  { name: '', odds: '' },
];

function OddsManager() {
  const [expandedId,  setExpandedId]  = useState('');
  const [scorelines,  setScorelines]  = useState(EMPTY_SCORELINES());
  const [scorers,     setScorers]     = useState(EMPTY_SCORERS());
  const [saving,      setSaving]      = useState(false);
  const [savedFlash,  setSavedFlash]  = useState(false);
  const [clearing,    setClearing]    = useState(false);
  const [error,       setError]       = useState('');
  const [existingIds, setExistingIds] = useState(new Set());
  const [filterGroup, setFilterGroup] = useState('all');
  const [missingOnly, setMissingOnly] = useState(false);

  // Load which fixtures already have odds on mount
  useEffect(() => {
    supabase.from('fixture_odds').select('fixture_id').then(({ data }) => {
      if (data) setExistingIds(new Set(data.map(r => r.fixture_id)));
    });
  }, []);

  // Load existing odds when a fixture is expanded
  useEffect(() => {
    if (!expandedId) return;
    setScorelines(EMPTY_SCORELINES());
    setScorers(EMPTY_SCORERS());
    setError('');
    supabase
      .from('fixture_odds')
      .select('*')
      .eq('fixture_id', expandedId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const sl = data.scorelines || [];
        setScorelines([
          sl[0] ? { home: String(sl[0].home), away: String(sl[0].away), odds: String(sl[0].odds) } : { home: '', away: '', odds: '' },
          sl[1] ? { home: String(sl[1].home), away: String(sl[1].away), odds: String(sl[1].odds) } : { home: '', away: '', odds: '' },
          sl[2] ? { home: String(sl[2].home), away: String(sl[2].away), odds: String(sl[2].odds) } : { home: '', away: '', odds: '' },
        ]);
        const sc = data.scorers || [];
        setScorers([
          sc[0] ? { name: sc[0].name, odds: String(sc[0].odds) } : { name: '', odds: '' },
          sc[1] ? { name: sc[1].name, odds: String(sc[1].odds) } : { name: '', odds: '' },
          sc[2] ? { name: sc[2].name, odds: String(sc[2].odds) } : { name: '', odds: '' },
          sc[3] ? { name: sc[3].name, odds: String(sc[3].odds) } : { name: '', odds: '' },
        ]);
      });
  }, [expandedId]);

  function toggle(id) {
    setExpandedId(prev => prev === id ? '' : id);
  }

  const fixture = FIXTURES.find(f => f.id === expandedId);

  function setSL(i, key, val) {
    setScorelines(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  }
  function setSC(i, key, val) {
    setScorers(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  }

  async function save() {
    if (!expandedId || !fixture) return;
    setSaving(true);
    setError('');
    try {
      const validSL = scorelines
        .filter(s => s.home !== '' && s.away !== '' && s.odds !== '')
        .map(s => ({ home: Number(s.home), away: Number(s.away), odds: s.odds.trim() }));

      const validSC = scorers
        .filter(s => s.name && s.odds !== '')
        .map(s => {
          const team = (SQUADS[fixture.homeTeam] || []).some(p => p.name === s.name)
            ? fixture.homeTeam : fixture.awayTeam;
          return { name: s.name, team, odds: s.odds.trim() };
        });

      const { error: err } = await supabase
        .from('fixture_odds')
        .upsert(
          { fixture_id: expandedId, scorelines: validSL, scorers: validSC, updated_at: new Date().toISOString() },
          { onConflict: 'fixture_id' }
        );

      if (err) throw err;
      setExistingIds(prev => new Set([...prev, expandedId]));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!expandedId || !window.confirm('Remove bookies odds for this fixture?')) return;
    setClearing(true);
    try {
      await supabase.from('fixture_odds').delete().eq('fixture_id', expandedId);
      setExistingIds(prev => { const n = new Set(prev); n.delete(expandedId); return n; });
      setScorelines(EMPTY_SCORELINES());
      setScorers(EMPTY_SCORERS());
    } catch (e) {
      setError(e.message);
    } finally {
      setClearing(false);
    }
  }

  const oddsInputCls  = 'w-20 bg-pitch-900 border border-pitch-600 rounded px-2 py-1.5 text-white text-sm focus:border-gold-400 focus:outline-none';
  const scoreInputCls = 'w-12 text-center bg-pitch-900 border border-pitch-600 rounded px-1 py-1.5 text-white text-sm focus:border-gold-400 focus:outline-none';

  // Filtered + sorted fixture list
  const sortedFixtures = [...FIXTURES].sort((a, b) =>
    a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff)
  );
  const filteredFixtures = sortedFixtures.filter(f => {
    if (filterGroup !== 'all' && f.group !== filterGroup) return false;
    if (missingOnly && existingIds.has(f.id)) return false;
    return true;
  });

  return (
    <div className="mb-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-sm">🎰 Bookies' Odds</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {existingIds.size > 0
              ? `${existingIds.size} of ${FIXTURES.length} fixtures with odds saved`
              : 'No odds saved yet — expand a fixture below to add odds'}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['all', ...GROUPS_LIST].map(g => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterGroup === g
                ? 'bg-gold-500 border-gold-500 text-pitch-900 font-bold'
                : 'border-pitch-600 text-slate-400 hover:border-slate-400'
            }`}
          >
            {g === 'all' ? 'All' : `Group ${g}`}
          </button>
        ))}
        <button
          onClick={() => setMissingOnly(v => !v)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ml-auto ${
            missingOnly
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-semibold'
              : 'border-pitch-600 text-slate-400 hover:border-slate-400'
          }`}
        >
          {missingOnly ? '✕ Missing only' : '⚡ Missing only'}
        </button>
      </div>

      {/* ── Fixture list ── */}
      <div className="space-y-1.5">
        {filteredFixtures.map(f => {
          const hasOdds    = existingIds.has(f.id);
          const isExpanded = expandedId === f.id;

          return (
            <div
              key={f.id}
              className={`rounded-xl border overflow-hidden transition-colors ${
                hasOdds
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-pitch-700 bg-pitch-800'
              }`}
            >
              {/* ── Row header (always visible, clickable) ── */}
              <button
                onClick={() => toggle(f.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-pitch-700/40 transition-colors text-left"
              >
                <span className="text-slate-600 text-xs font-mono w-7 flex-shrink-0">{f.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">
                    {f.homeTeam} <span className="text-slate-500 font-normal">vs</span> {f.awayTeam}
                  </p>
                  <p className="text-slate-600 text-xs">{f.date} · {f.kickoff}</p>
                </div>
                {hasOdds ? (
                  <span className="text-green-400 text-xs font-semibold flex-shrink-0">✓ Odds saved</span>
                ) : (
                  <span className="text-slate-600 text-xs flex-shrink-0">No odds</span>
                )}
                <span className={`text-slate-500 text-xs flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* ── Inline edit form ── */}
              {isExpanded && (
                <div className="border-t border-pitch-700 px-4 py-4 space-y-5">

                  {/* Scorelines */}
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                      Top 3 Most Likely Scorelines
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      Enter fractional odds (e.g. 4/1) — implied % calculated automatically.
                    </p>
                    <div className="space-y-2">
                      {scorelines.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-600 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
                          <span className="text-slate-500 text-xs flex-shrink-0">{f.homeTeam.split(' ')[0]}</span>
                          <input type="number" min="0" max="99" placeholder="0"
                            value={s.home} onChange={e => setSL(i, 'home', e.target.value)}
                            className={scoreInputCls} />
                          <span className="text-slate-500 text-sm font-bold flex-shrink-0">–</span>
                          <input type="number" min="0" max="99" placeholder="0"
                            value={s.away} onChange={e => setSL(i, 'away', e.target.value)}
                            className={scoreInputCls} />
                          <span className="text-slate-500 text-xs flex-shrink-0">{f.awayTeam.split(' ')[0]}</span>
                          <span className="text-slate-600 text-xs flex-shrink-0 ml-2">Odds:</span>
                          <input type="text" placeholder="e.g. 4/1"
                            value={s.odds} onChange={e => setSL(i, 'odds', e.target.value)}
                            className={oddsInputCls} />
                          <span className={`text-sm font-bold w-10 flex-shrink-0 ${pct(s.odds) !== null ? 'text-gold-400' : 'text-slate-700'}`}>
                            {pct(s.odds) !== null ? `${pct(s.odds)}%` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scorers */}
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                      Top 4 First Goalscorer Picks
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      Select a player from either squad, then enter their fractional odds.
                    </p>
                    <div className="space-y-2">
                      {scorers.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-600 text-xs w-4 text-right flex-shrink-0">{i + 1}.</span>
                          <div className="relative flex-1 min-w-[160px]">
                            <select value={s.name} onChange={e => setSC(i, 'name', e.target.value)}
                              className="w-full appearance-none bg-pitch-900 border border-pitch-600 rounded px-2 py-1.5 text-white text-sm focus:border-gold-400 focus:outline-none pr-6"
                            >
                              <option value="">— select player —</option>
                              <optgroup label={f.homeTeam}>
                                {(SQUADS[f.homeTeam] || []).slice().sort((a, b) => a.name.localeCompare(b.name))
                                  .map(p => <option key={p.name} value={p.name}>{p.pos} · {p.name}</option>)}
                              </optgroup>
                              <optgroup label={f.awayTeam}>
                                {(SQUADS[f.awayTeam] || []).slice().sort((a, b) => a.name.localeCompare(b.name))
                                  .map(p => <option key={p.name} value={p.name}>{p.pos} · {p.name}</option>)}
                              </optgroup>
                            </select>
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▼</span>
                          </div>
                          <span className="text-slate-600 text-xs flex-shrink-0">Odds:</span>
                          <input type="text" placeholder="e.g. 4/1"
                            value={s.odds} onChange={e => setSC(i, 'odds', e.target.value)}
                            className={oddsInputCls} />
                          <span className={`text-sm font-bold w-10 flex-shrink-0 ${pct(s.odds) !== null ? 'text-gold-400' : 'text-slate-700'}`}>
                            {pct(s.odds) !== null ? `${pct(s.odds)}%` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-pitch-700">
                    <button onClick={save} disabled={saving}
                      className={`btn-primary text-sm py-1.5 px-5 mt-3 ${savedFlash ? '!bg-green-500 hover:!bg-green-400' : ''}`}
                    >
                      {saving ? 'Saving…' : savedFlash ? '✓ Saved!' : 'Save Odds'}
                    </button>
                    {hasOdds && (
                      <button onClick={clear} disabled={clearing}
                        className="btn-secondary text-sm py-1.5 px-4 mt-3 hover:text-red-400 transition-colors"
                      >
                        {clearing ? '…' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredFixtures.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-8">No fixtures match this filter</p>
        )}
      </div>
    </div>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/analytics', { headers: await getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load analytics');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="card text-center text-slate-500 py-12">
        Loading analytics…
      </div>
    );
  }
  if (error) {
    return (
      <div className="card text-red-400 text-sm py-4 text-center">{error}</div>
    );
  }
  if (!data) return null;

  const { app, traffic } = data;
  const timeseries  = traffic?.timeseries?.data || [];
  const maxViews    = Math.max(...timeseries.map(d => d.total ?? 0), 1);
  const totalViews  = timeseries.reduce((s, d) => s + (d.total    ?? 0), 0);
  const totalVisits = timeseries.reduce((s, d) => s + (d.devices  ?? 0), 0);
  const topPages    = traffic?.pages?.data || [];

  const statCard = (label, value, color) => (
    <div key={label} className="bg-pitch-800 border border-pitch-700 rounded-xl p-3">
      <p className="text-slate-500 text-xs">{label}</p>
      <p className={`${color} font-black text-2xl leading-none mt-1`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── App Overview ── */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">📊 App Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {statCard('Total Users',            app.totalUsers,            'text-gold-400'  )}
          {statCard('Total Predictions',      app.totalPredictions,      'text-green-400' )}
          {statCard('Avg Predictions / User', app.avgPredictionsPerUser, 'text-blue-400'  )}
          {statCard('New Users This Week',    app.newUsersThisWeek,      'text-gold-400'  )}
          {statCard('Predictions This Week',  app.predictionsThisWeek,   'text-green-400' )}
        </div>
      </div>

      {/* ── Top Predictors ── */}
      {app.topPredictors.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3">🏆 Most Active Predictors</h3>
          <div className="bg-pitch-800 border border-pitch-700 rounded-xl overflow-hidden">
            {app.topPredictors.map((u, i) => {
              const pct = Math.round((u.count / (app.topPredictors[0]?.count || 1)) * 100);
              return (
                <div
                  key={u.name}
                  className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-pitch-700' : ''}`}
                >
                  <span className="text-slate-600 text-xs font-mono w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-white text-sm font-semibold flex-1 truncate">{u.name}</span>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0 w-32">
                    <div className="flex-1 h-1.5 bg-pitch-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gold-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-gold-400 text-sm font-black flex-shrink-0">{u.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vercel Traffic ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">🌐 Website Traffic — Last 30 Days</h3>
          <a
            href="https://vercel.com/jamies-projects-e9bcb763/world-cup-match-predictor/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
          >
            View in Vercel →
          </a>
        </div>

        {!traffic.hasToken ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-4 text-xs text-amber-300">
            <p className="font-semibold mb-2">⚙️ Setup required to show traffic data</p>
            <ol className="text-amber-400/80 space-y-1 list-decimal list-inside">
              <li>Go to Vercel → Account Settings → Tokens → Create Token</li>
              <li>Add <span className="font-mono bg-amber-900/30 px-1 rounded">VERCEL_TOKEN=your_token</span> to <span className="font-mono">server/.env</span></li>
              <li>Add <span className="font-mono bg-amber-900/30 px-1 rounded">VERCEL_TOKEN</span> to Vercel Environment Variables and redeploy</li>
            </ol>
          </div>
        ) : traffic.error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400">
            <p className="font-semibold mb-1">Could not fetch Vercel analytics</p>
            <p className="text-red-400/70">{traffic.error}</p>
            <a
              href="https://vercel.com/jamies-projects-e9bcb763/world-cup-match-predictor/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="underline mt-1 block"
            >
              View analytics directly in Vercel →
            </a>
          </div>
        ) : timeseries.length === 0 ? (
          <div className="bg-pitch-800 border border-pitch-700 rounded-xl px-4 py-8 text-center text-slate-500 text-sm">
            No traffic data yet — analytics will appear once users visit the site.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {statCard('Page Views (30d)',      totalViews.toLocaleString(),  'text-blue-400'   )}
              {statCard('Unique Visitors (30d)', totalVisits.toLocaleString(), 'text-purple-400' )}
            </div>

            {/* Daily bar chart */}
            <div className="bg-pitch-800 border border-pitch-700 rounded-xl p-4 mb-3">
              <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Daily Page Views</p>
              <div className="flex items-end gap-0.5 h-20">
                {timeseries.map(day => (
                  <div
                    key={day.key}
                    title={`${day.key}: ${(day.total ?? 0).toLocaleString()} views`}
                    className="flex-1 bg-gold-500/60 hover:bg-gold-400 transition-colors rounded-sm"
                    style={{ height: `${Math.max(((day.total ?? 0) / maxViews) * 100, 2)}%`, minHeight: '2px' }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-slate-600">
                <span>{timeseries[0]?.key?.slice(5)}</span>
                <span>{timeseries[timeseries.length - 1]?.key?.slice(5)}</span>
              </div>
            </div>

            {/* Top pages */}
            {topPages.length > 0 && (
              <div className="bg-pitch-800 border border-pitch-700 rounded-xl overflow-hidden">
                <p className="text-xs text-slate-500 px-4 pt-3 pb-2 font-semibold uppercase tracking-wide">Top Pages</p>
                {topPages.map((page, i) => {
                  const pct = Math.round(((page.total ?? 0) / (topPages[0]?.total || 1)) * 100);
                  return (
                    <div key={page.key ?? i} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-pitch-700' : ''}`}>
                      <span className="text-slate-300 text-xs font-mono flex-1 truncate">{page.key || '/'}</span>
                      <div className="hidden sm:flex items-center gap-2 w-24 flex-shrink-0">
                        <div className="flex-1 h-1.5 bg-pitch-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-blue-400 text-xs font-bold flex-shrink-0">{(page.total ?? 0).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Refresh */}
      <div className="flex justify-end pt-2 border-t border-pitch-700">
        <button onClick={load} disabled={loading} className="btn-secondary text-xs py-1.5 px-4">
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}

const ADMIN_TABS = [
  { id: 'results',       label: '📋 Results'       },
  { id: 'odds',          label: '🎰 Bookies Odds'   },
  { id: 'notifications', label: '🔔 Notifications'  },
  { id: 'emails',        label: '✉️ Emails'         },
  { id: 'fixtures',      label: '⚙️ Fixtures'       },
  { id: 'analytics',     label: '📊 Analytics'      },
];

export default function AdminPage() {
  const [adminTab, setAdminTab] = useState('results');
  const [showTabFade, setShowTabFade] = useState(true);
  const tabScrollRef = useRef(null);
  const [overrides, setOverrides] = useLocalStorage('wc2026_fixture_overrides', {});
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');

  const mergedFixtures = useMemo(
    () => FIXTURES.map(f => ({ ...f, ...(overrides[f.id] || {}) })),
    [overrides]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mergedFixtures;
    return mergedFixtures.filter(f =>
      f.homeTeam.toLowerCase().includes(q) ||
      f.awayTeam.toLowerCase().includes(q) ||
      f.group.toLowerCase().includes(q) ||
      (f.city || '').toLowerCase().includes(q) ||
      (f.stadium || '').toLowerCase().includes(q)
    );
  }, [mergedFixtures, search]);

  function startEdit(fixture) {
    setEditingId(fixture.id);
    setDraft({ ...fixture });
  }

  function saveEdit() {
    setOverrides(prev => ({ ...prev, [editingId]: { ...draft } }));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function resetFixture(id) {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function resetAll() {
    if (confirm('Reset ALL fixtures back to the default data?')) {
      setOverrides({});
    }
  }

  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="animate-fade-in mt-6">

      {/* ── Admin tab bar ─────────────────────────────────────────────────── */}
      <div className="relative mb-6">
        <div
          ref={tabScrollRef}
          className="bg-pitch-800 border border-pitch-700 rounded-xl p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onScroll={e => {
            const el = e.currentTarget;
            setShowTabFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
          }}
        >
          <div className="flex gap-1 w-max sm:w-full">
            {ADMIN_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`whitespace-nowrap sm:flex-1 py-2 px-3 sm:px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  adminTab === tab.id
                    ? 'bg-pitch-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right-fade — mobile only, disappears once scrolled to the last tab */}
        {showTabFade && (
          <div
            className="sm:hidden absolute top-0 right-0 bottom-0 w-10 rounded-r-xl pointer-events-none"
            style={{ background: 'linear-gradient(to right, transparent, rgb(var(--pitch-800)))' }}
          />
        )}
      </div>

      {/* ── Results tab ───────────────────────────────────────────────────── */}
      {adminTab === 'results' && (
        <>
          <SyncStatus />
          <ResultsManager />
        </>
      )}

      {/* ── Bookies Odds tab ──────────────────────────────────────────────── */}
      {adminTab === 'odds' && <OddsManager />}

      {/* ── Notifications tab ─────────────────────────────────────────────── */}
      {adminTab === 'notifications' && <NotificationsPanel />}

      {/* ── Emails tab ────────────────────────────────────────────────────── */}
      {adminTab === 'emails' && <EmailPanel />}

      {/* ── Analytics tab ─────────────────────────────────────────────────── */}
      {adminTab === 'analytics' && <AnalyticsPanel />}

      {/* ── Fixtures tab ──────────────────────────────────────────────────── */}
      {adminTab === 'fixtures' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-white">Fixture Editor</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {overrideCount === 0
                  ? 'No overrides — showing default fixture data'
                  : `${overrideCount} fixture${overrideCount > 1 ? 's' : ''} overridden`}
              </p>
            </div>
            {overrideCount > 0 && (
              <button
                onClick={resetAll}
                className="btn-secondary text-xs py-1.5 px-3 hover:text-red-400 transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by team, group, stadium or city…"
            className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                       placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors mb-4 text-sm"
          />

          <div className="space-y-2">
            {filtered.map(fixture =>
              editingId === fixture.id ? (
                <EditForm
                  key={fixture.id}
                  draft={draft}
                  setDraft={setDraft}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  fixtureId={fixture.id}
                />
              ) : (
                <FixtureRow
                  key={fixture.id}
                  fixture={fixture}
                  isOverridden={!!overrides[fixture.id]}
                  onEdit={() => startEdit(fixture)}
                  onReset={() => resetFixture(fixture.id)}
                />
              )
            )}
          </div>
        </>
      )}

    </div>
  );
}
