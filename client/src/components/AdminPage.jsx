import { useState, useMemo } from 'react';
import { FIXTURES, TEAMS } from '../data/wc2026';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ADMIN_PASSWORD = 'wc2026admin';
const ALL_TEAMS = Object.keys(TEAMS).sort();
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

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [overrides, setOverrides] = useLocalStorage('wc2026_fixture_overrides', {});
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');

  function login() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError('');
    } else {
      setPwError('Incorrect password');
    }
  }

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

  if (!authed) {
    return (
      <div className="animate-fade-in mt-10 max-w-sm mx-auto">
        <div className="card text-center">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-black text-white mb-1">Admin Access</h2>
          <p className="text-slate-400 text-sm mb-5">Enter the admin password to manage fixtures</p>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Password"
              autoFocus
              className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                         placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors"
            />
            {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
            <button onClick={login} className="btn-primary w-full py-3">Enter</button>
          </div>
        </div>
      </div>
    );
  }

  const overrideCount = Object.keys(overrides).length;

  return (
    <div className="animate-fade-in mt-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-white">Fixture Admin</h2>
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

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by team, group, stadium or city…"
        className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                   placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors mb-4 text-sm"
      />

      {/* Fixture list */}
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
    </div>
  );
}
