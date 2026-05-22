import { useState, useEffect, useRef } from 'react';
import { TEAMS } from '../data/wc2026';
import { SQUADS } from '../data/squads';

const POS_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

function ScoreInput({ value, onChange, disabled = false }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showArrows = !disabled && (focused || hovered);

  function increment() {
    const cur = value === '' ? -1 : parseInt(value, 10);
    onChange(String(Math.min(99, cur + 1)));
  }

  function decrement() {
    const cur = value === '' ? 1 : parseInt(value, 10);
    if (cur <= 0) return;
    onChange(String(cur - 1));
  }

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={e => !disabled && onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="–"
        disabled={disabled}
        className={`score-input transition-all duration-150 ${showArrows ? 'pr-5' : ''}`}
      />
      {showArrows && (
        <div className="absolute right-0.5 inset-y-0 flex flex-col justify-center gap-0 pointer-events-auto">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); increment(); }}
            className="flex items-center justify-center w-4 h-[22px] text-slate-400 hover:text-gold-400
                       hover:bg-pitch-600 rounded transition-colors leading-none select-none"
            tabIndex={-1}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
              <path d="M4 0L8 5H0L4 0Z"/>
            </svg>
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); decrement(); }}
            className="flex items-center justify-center w-4 h-[22px] text-slate-400 hover:text-gold-400
                       hover:bg-pitch-600 rounded transition-colors leading-none select-none"
            tabIndex={-1}
          >
            <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
              <path d="M4 5L0 0H8L4 5Z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Returns true if the fixture kickoff time has passed.
// kickoff format: "20:00 BST" — BST is UTC+1, so we compare in UTC.
function isKickoffPassed(date, kickoff) {
  try {
    const [time] = kickoff.split(' ');          // "20:00"
    const [hh, mm] = time.split(':').map(Number);
    // BST = UTC+1, so subtract 1 hour to get UTC
    const kickoffUTC = new Date(`${date}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00Z`);
    kickoffUTC.setUTCHours(kickoffUTC.getUTCHours() - 1);
    return Date.now() >= kickoffUTC.getTime();
  } catch {
    return false;
  }
}

function Flag({ team }) {
  const code = TEAMS[team]?.code;
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={team}
      width={32}
      height={21}
      className="flex-shrink-0 rounded-sm object-cover"
      loading="lazy"
    />
  );
}

export default function FixtureCard({ fixture, prediction, onSavePrediction }) {
  const { id, group, round, homeTeam, awayTeam, date, kickoff, stadium, city, simultaneous } = fixture;

  const locked = isKickoffPassed(date, kickoff);

  const [home, setHome] = useState(prediction?.home ?? '');
  const [away, setAway] = useState(prediction?.away ?? '');
  const [scorer, setScorer] = useState(prediction?.scorer ?? '');
  const saveTimer = useRef(null);
  const saved = useRef(false);

  // Derive which team the saved scorer belongs to (for restoring team selection on load)
  function inferScorerTeam(name, hSquad, aSquad) {
    if (!name) return '';
    if (hSquad.some(p => p.name === name)) return 'home';
    if (aSquad.some(p => p.name === name)) return 'away';
    return '';
  }

  // Build sorted squad lists
  const homeSquad = (SQUADS[homeTeam] || []).slice().sort(
    (a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]
  );
  const awaySquad = (SQUADS[awayTeam] || []).slice().sort(
    (a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]
  );

  const [scorerTeam, setScorerTeam] = useState(
    () => inferScorerTeam(prediction?.scorer ?? '', homeSquad, awaySquad)
  );

  // Sync if prediction changes externally (e.g. on load)
  useEffect(() => {
    setHome(prediction?.home ?? '');
    setAway(prediction?.away ?? '');
    const s = prediction?.scorer ?? '';
    setScorer(s);
    setScorerTeam(inferScorerTeam(s, homeSquad, awaySquad));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.home, prediction?.away, prediction?.scorer]);

  function save(h, a, s) {
    if (h !== '' || a !== '') {
      onSavePrediction(id, h, a, s);
      saved.current = true;
    }
  }

  function handleChange(side, raw) {
    const val = raw === '' ? '' : Math.max(0, Math.min(99, parseInt(raw, 10)));
    if (isNaN(val) && raw !== '') return;
    const v = val === '' ? '' : String(val);
    if (side === 'home') setHome(v);
    else setAway(v);

    clearTimeout(saveTimer.current);
    saved.current = false;
    saveTimer.current = setTimeout(() => {
      const h = side === 'home' ? v : home;
      const a = side === 'away' ? v : away;
      save(h, a, scorer);
    }, 400);
  }

  function handleScorerChange(val) {
    setScorer(val);
    save(home, away, val);
  }

  function handleTeamSelect(side) {
    if (locked) return;
    if (scorerTeam === side) {
      // Clicking the active team deselects and clears scorer
      setScorerTeam('');
      setScorer('');
      save(home, away, '');
    } else {
      setScorerTeam(side);
      // Clear scorer only if it belonged to the other team
      const newSquad = side === 'home' ? homeSquad : awaySquad;
      if (scorer && !newSquad.some(p => p.name === scorer)) {
        setScorer('');
        save(home, away, '');
      }
    }
  }

  const activeSquad = scorerTeam === 'home' ? homeSquad : scorerTeam === 'away' ? awaySquad : [];

  const hasPrediction = home !== '' && away !== '';
  const groupColor = {
    A:'bg-red-600', B:'bg-blue-600', C:'bg-green-600', D:'bg-purple-600',
    E:'bg-orange-600', F:'bg-pink-600', G:'bg-teal-600', H:'bg-indigo-600',
    I:'bg-yellow-600', J:'bg-rose-600', K:'bg-cyan-600', L:'bg-lime-600',
  }[group] || 'bg-slate-600';

  return (
    <div className={`card transition-all duration-200 ${hasPrediction ? 'border-pitch-600 ring-1 ring-gold-500/20' : ''}`}>
      {/* Badges row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <span className={`${groupColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
            Group {group}
          </span>
          <span className="bg-pitch-600 text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
            Round {round}
          </span>
          {simultaneous && (
            <span className="bg-amber-700/60 text-amber-300 text-xs px-2 py-0.5 rounded-full">
              Simultaneous
            </span>
          )}
        </div>
        {locked ? (
          <span className="text-slate-500 text-xs font-semibold flex items-center gap-1">
            🔒 Locked
          </span>
        ) : hasPrediction && (
          <span className="text-gold-400 text-xs font-semibold">✓ Saved</span>
        )}
      </div>

      {/* Teams + score inputs */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Flag team={homeTeam} />
          <span className="text-white font-bold text-sm sm:text-base truncate">{homeTeam}</span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreInput value={home} onChange={v => handleChange('home', v)} disabled={locked} />
          <span className="text-slate-500 font-bold text-lg">:</span>
          <ScoreInput value={away} onChange={v => handleChange('away', v)} disabled={locked} />
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-white font-bold text-sm sm:text-base truncate text-right">{awayTeam}</span>
          <Flag team={awayTeam} />
        </div>
      </div>

      {/* First goalscorer picker */}
      <div className="mt-3 pt-3 border-t border-pitch-700">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
          ⚽ First Goalscorer <span className="normal-case font-normal text-slate-600">(optional · +3 pts)</span>
        </p>

        {/* Step 1 – pick a team */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[{ side: 'home', team: homeTeam }, { side: 'away', team: awayTeam }].map(({ side, team }) => {
            const isActive = scorerTeam === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => handleTeamSelect(side)}
                disabled={locked}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold
                  transition-all duration-150 truncate
                  ${locked ? 'opacity-40 cursor-not-allowed border-pitch-700 text-slate-600' :
                    isActive
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-pitch-600 text-slate-400 hover:border-pitch-500 hover:text-slate-200'
                  }`}
              >
                <Flag team={team} />
                <span className="truncate">{team}</span>
                {isActive && <span className="ml-auto text-gold-500 flex-shrink-0">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Step 2 – pick a player (only shown once a team is selected) */}
        {scorerTeam && (
          <div className="relative">
            <select
              value={scorer}
              onChange={e => !locked && handleScorerChange(e.target.value)}
              disabled={locked}
              autoFocus={!scorer}
              className={`w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm transition-colors
                bg-pitch-900 focus:outline-none
                ${locked
                  ? 'border-pitch-700 text-slate-600 cursor-not-allowed'
                  : scorer
                    ? 'border-gold-500/60 text-gold-300 focus:border-gold-400'
                    : 'border-pitch-600 text-slate-400 hover:border-pitch-500 focus:border-gold-400'
                }`}
            >
              <option value="">— Select a player —</option>
              {activeSquad.map(p => (
                <option key={p.name} value={p.name}>
                  {p.pos} · {p.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▼</span>
          </div>
        )}

        {/* Confirmation */}
        {scorer && (
          <p className="text-xs text-gold-500 mt-1.5 flex items-center gap-1">
            🎯 <span className="font-semibold">{scorer}</span>
            <span className="text-slate-600">({scorerTeam === 'home' ? homeTeam : awayTeam})</span>
            {!locked && (
              <button
                type="button"
                onClick={() => { setScorer(''); setScorerTeam(''); save(home, away, ''); }}
                className="ml-auto text-slate-600 hover:text-slate-400 transition-colors"
                title="Clear"
              >✕</button>
            )}
          </p>
        )}
      </div>

      {/* Match info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-pitch-700 text-slate-400 text-xs">
        <span>📅 {formatDate(date)}</span>
        <span>⏰ {kickoff}</span>
        <span>🏟 {stadium}</span>
        <span className="text-slate-500">{city}</span>
      </div>
    </div>
  );
}
