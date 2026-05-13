import { useState, useEffect, useRef } from 'react';
import { TEAMS } from '../data/wc2026';

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
          <input
            type="number"
            min="0" max="99"
            value={home}
            onChange={e => handleChange('home', e.target.value)}
            placeholder="–"
            className="score-input"
          />
          <span className="text-slate-500 font-bold text-lg">:</span>
          <input
            type="number"
            min="0" max="99"
            value={away}
            onChange={e => handleChange('away', e.target.value)}
            placeholder="–"
            className="score-input"
          />
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
