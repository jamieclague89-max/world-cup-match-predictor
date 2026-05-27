import { useState, useEffect, useRef, useMemo } from 'react';
import { TEAMS } from '../data/wc2026';
import { SQUADS } from '../data/squads';
import { isKickoffPassed, kickoffDate } from '../utils/fixtures';
import { useNow } from '../hooks/useNow';

const POS_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

// ── Score input ───────────────────────────────────────────────────────────────
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

// ── Countdown chip helper ─────────────────────────────────────────────────────
function fmtChip(ms) {
  const s   = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${min}m`;
  return `${min}m`;
}

// ── Misc helpers ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
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

// ── Odds helpers ──────────────────────────────────────────────────────────────

// Implied probability from fractional odds (e.g. "4/1" → 20%)
function impliedPct(odds) {
  if (!odds) return null;
  const parts = String(odds).split('/');
  if (parts.length !== 2) return null;
  const num = parseFloat(parts[0]);
  const den = parseFloat(parts[1]);
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return Math.round((den / (num + den)) * 100);
}

// Convert fractional odds to decimal (e.g. "4/1" → "5.00")
function toDecimal(odds) {
  if (!odds) return null;
  const parts = String(odds).split('/');
  if (parts.length !== 2) return null;
  const num = parseFloat(parts[0]);
  const den = parseFloat(parts[1]);
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return ((num / den) + 1).toFixed(2);
}

export default function FixtureCard({ fixture, prediction, onSavePrediction, odds, oddsFormat = 'fractional' }) {
  const { id, group, round, homeTeam, awayTeam, date, kickoff, stadium, city, simultaneous } = fixture;

  const locked = isKickoffPassed(date, kickoff);

  // Countdown chip — updates every 30 s (live per-second precision is in CountdownBanner)
  const now       = useNow(30_000);
  const kickoffMs = kickoffDate(date, kickoff)?.getTime() ?? 0;
  const msLeft    = kickoffMs - now;
  const showChip  = !locked && msLeft > 0 && msLeft < 24 * 3_600_000;

  const [home,       setHome]       = useState(prediction?.home   ?? '');
  const [away,       setAway]       = useState(prediction?.away   ?? '');
  const [scorer,     setScorer]     = useState(prediction?.scorer ?? '');
  const [scorerTeam, setScorerTeam] = useState('');
  const [oddsOpen,   setOddsOpen]   = useState(false);
  const saveTimer = useRef(null);
  const saved     = useRef(false);

  // Build sorted squad lists
  const homeSquad = useMemo(() =>
    (SQUADS[homeTeam] || []).slice().sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]),
    [homeTeam]
  );
  const awaySquad = useMemo(() =>
    (SQUADS[awayTeam] || []).slice().sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]),
    [awayTeam]
  );

  // Work out which team a saved scorer name belongs to (used on load)
  function inferScorerTeam(name, hSquad, aSquad) {
    if (!name) return '';
    if (hSquad.some(p => p.name === name)) return 'home';
    if (aSquad.some(p => p.name === name)) return 'away';
    return '';
  }

  // Sync if prediction changes externally (e.g. on load)
  useEffect(() => {
    setHome(prediction?.home   ?? '');
    setAway(prediction?.away   ?? '');
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

  const activeSquad = scorerTeam === 'home' ? homeSquad
                    : scorerTeam === 'away' ? awaySquad
                    : [];

  const hasPrediction = home !== '' && away !== '';
  const groupColor = {
    A:'bg-red-600', B:'bg-blue-600', C:'bg-green-600', D:'bg-purple-600',
    E:'bg-orange-600', F:'bg-pink-600', G:'bg-teal-600', H:'bg-indigo-600',
    I:'bg-yellow-600', J:'bg-rose-600', K:'bg-cyan-600', L:'bg-lime-600',
  }[group] || 'bg-slate-600';

  return (
    <div className={`card transition-all duration-200 ${hasPrediction ? 'border-pitch-600 ring-1 ring-gold-500/20' : ''}`}>

      {/* ── Badge row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-2">
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
          {showChip && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              msLeft < 3_600_000
                ? 'bg-red-900/50 text-red-400'
                : msLeft < 6 * 3_600_000
                ? 'bg-amber-900/40 text-amber-300'
                : 'bg-pitch-700 text-slate-300'
            }`}>
              ⏱ {fmtChip(msLeft)}
            </span>
          )}
        </div>
        {locked ? (
          <span className="text-slate-500 text-xs font-semibold flex items-center gap-1 flex-shrink-0">
            🔒 Locked
          </span>
        ) : hasPrediction && (
          <span className="text-gold-400 text-xs font-semibold flex-shrink-0">✓ Saved</span>
        )}
      </div>

      {/* ── Teams + score inputs ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Flag team={homeTeam} />
          <span className="text-white font-bold text-sm sm:text-base truncate">{homeTeam}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreInput value={home} onChange={v => handleChange('home', v)} disabled={locked} />
          <span className="text-slate-500 font-bold text-lg">:</span>
          <ScoreInput value={away} onChange={v => handleChange('away', v)} disabled={locked} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-white font-bold text-sm sm:text-base truncate text-right">{awayTeam}</span>
          <Flag team={awayTeam} />
        </div>
      </div>

      {/* ── First goalscorer picker ────────────────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-pitch-700">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
          ⚽ First Goalscorer{' '}
          <span className="normal-case font-normal text-slate-600">(optional · +3 pts)</span>
        </p>

        {/* Step 1 — pick a team */}
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
                  ${locked
                    ? 'opacity-40 cursor-not-allowed border-pitch-700 text-slate-600'
                    : isActive
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

        {/* Step 2 — pick a player (only shown once a team is selected) */}
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

        {/* Confirmed selection */}
        {scorer && (
          <p className="text-xs text-gold-500 mt-1.5 flex items-center gap-1">
            🎯 <span className="font-semibold">{scorer}</span>
            <span className="text-slate-600">
              ({scorerTeam === 'home' ? homeTeam : awayTeam})
            </span>
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

      {/* ── Bookies' Picks ─────────────────────────────────────────────────── */}
      {odds && !locked && (odds.scorelines?.length > 0 || odds.scorers?.length > 0) && (
        <div className="mt-3 pt-3 border-t border-pitch-700">
          <button
            onClick={() => setOddsOpen(o => !o)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <span className="flex items-center gap-1.5">
              <span>🎰</span>
              <span className="uppercase tracking-wide">Bookies' Picks</span>
              <span className="text-slate-600 font-normal normal-case">· for reference only</span>
            </span>
            <span className={`text-slate-600 transition-transform duration-200 ${oddsOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {oddsOpen && (
            <div className="mt-3 space-y-3">

              {/* Scorelines */}
              {odds.scorelines?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-2">
                    Most Likely Scorelines
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {odds.scorelines.map((s, i) => {
                      const pct         = impliedPct(s.odds);
                      const displayOdds = oddsFormat === 'decimal' ? toDecimal(s.odds) : s.odds;
                      return (
                        <div key={i} className="bg-pitch-700/50 rounded-lg p-2.5 text-center border border-pitch-700">
                          <p className="text-white font-black text-base leading-none">
                            {s.home}–{s.away}
                          </p>
                          {pct !== null && (
                            <p className="text-gold-400 font-bold text-sm mt-1">{pct}%</p>
                          )}
                          {displayOdds && (
                            <p className="text-slate-600 text-[10px] mt-0.5">{displayOdds}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* First goalscorer picks */}
              {odds.scorers?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-2">
                    First Goalscorer Picks
                  </p>
                  <div className="space-y-1.5">
                    {odds.scorers.map((s, i) => {
                      const pct         = impliedPct(s.odds);
                      const displayOdds = oddsFormat === 'decimal' ? toDecimal(s.odds) : s.odds;
                      return (
                        <div key={i} className="flex items-center justify-between bg-pitch-700/40 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-600 text-xs w-4 flex-shrink-0">{i + 1}.</span>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold truncate">{s.name}</p>
                              {s.team && (
                                <p className="text-slate-500 text-[10px] truncate">{s.team}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 text-right">
                            {displayOdds && (
                              <span className="text-slate-600 text-[10px]">{displayOdds}</span>
                            )}
                            {pct !== null && (
                              <span className="text-gold-400 font-bold text-sm w-8">{pct}%</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-600 text-center">
                Odds for entertainment only · % = implied probability
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Match info footer ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 pt-3 border-t border-pitch-700 text-slate-400 text-xs">
        <span>📅 {formatDate(date)}</span>
        <span>⏰ {kickoff}</span>
        <span>🏟 {stadium}</span>
        <span className="text-slate-500">{city}</span>
      </div>

    </div>
  );
}
