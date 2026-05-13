import { useState, useEffect, useRef } from 'react';
import { TEAMS } from '../data/wc2026';

function ScoreInput({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showArrows = focused || hovered;

  function increment() {
    const cur = value === '' ? -1 : parseInt(value, 10);
    const next = Math.min(99, cur + 1);
    onChange(String(next));
  }

  function decrement() {
    const cur = value === '' ? 1 : parseInt(value, 10);
    if (cur <= 0) return;
    onChange(String(cur - 1));
  }

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="–"
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

  const [home, setHome] = useState(prediction?.home ?? '');
  const [away, setAway] = useState(prediction?.away ?? '');
  const saveTimer = useRef(null);
  const saved = useRef(false);

  // Sync if prediction changes externally (e.g. on load)
  useEffect(() => {
    setHome(prediction?.home ?? '');
    setAway(prediction?.away ?? '');
  }, [prediction?.home, prediction?.away]);

  function handleChange(side, raw) {
    const val = raw === '' ? '' : Math.max(0, Math.min(99, parseInt(raw, 10)));
    if (isNaN(val) && raw !== '') return;
    const v = val === '' ? '' : String(val);
    if (side === 'home') setHome(v);
    else setAway(v);

    // Debounce save
    clearTimeout(saveTimer.current);
    saved.current = false;
    saveTimer.current = setTimeout(() => {
      const h = side === 'home' ? v : home;
      const a = side === 'away' ? v : away;
      if (h !== '' || a !== '') {
        onSavePrediction(id, h, a);
        saved.current = true;
      }
    }, 400);
  }

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
        {hasPrediction && (
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
          <ScoreInput value={home} onChange={v => handleChange('home', v)} />
          <span className="text-slate-500 font-bold text-lg">:</span>
          <ScoreInput value={away} onChange={v => handleChange('away', v)} />
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-white font-bold text-sm sm:text-base truncate text-right">{awayTeam}</span>
          <Flag team={awayTeam} />
        </div>
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
