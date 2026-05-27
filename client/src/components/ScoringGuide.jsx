import { useState } from 'react';

const SCORE_RULES = [
  { pts: 5, label: 'Exact score',     detail: 'Correct scoreline',            color: 'text-gold-400',  gold: true  },
  { pts: 3, label: 'Correct result',  detail: 'Right outcome, wrong score',   color: 'text-slate-200', gold: false },
  { pts: 1, label: 'Correct score, wrong winner', detail: 'Correct margin, wrong winner', color: 'text-slate-200', gold: false },
  { pts: 0, label: 'No points',       detail: 'None of the above',            color: 'text-slate-500', gold: false },
];

const SCORER_RULE = { pts: 3, label: 'First goalscorer', color: 'text-gold-400', gold: true };

// sidebar=true → 2-column expanded grid + no bottom margin (gap handled by parent)
export default function ScoringGuide({ sidebar = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-xl border border-pitch-700 bg-pitch-800 overflow-hidden ${sidebar ? '' : 'mb-2'}`}>

      {/* Always-visible summary row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-pitch-700/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
            ⭐ Scoring
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            {[...SCORE_RULES.filter(r => r.pts > 0), SCORER_RULE].map(r => (
              <span key={r.label} className="flex items-center gap-1.5 text-xs">
                <span className={`font-black text-sm ${r.color}`}>{r.pts}</span>
                <span className="text-slate-400">pts</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">{r.label}</span>
              </span>
            ))}
          </div>
        </div>
        <span className={`text-slate-500 text-xs ml-3 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-pitch-700 px-4 py-3 space-y-3">

          {/* Score prediction grid — 2 cols in sidebar, 4 cols on full width */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
              Score Prediction
            </p>
            <div className={`grid gap-2 ${sidebar ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {SCORE_RULES.map(r => (
                <div
                  key={r.label}
                  className={`rounded-lg p-3 text-center ${r.gold ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-pitch-700/60'}`}
                >
                  <p className={`text-2xl font-black leading-none mb-1 ${r.color}`}>{r.pts}</p>
                  <p className="text-white text-xs font-semibold">{r.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Goalscorer bonus */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
              ⚽ First Goalscorer Bonus
            </p>
            <div className="rounded-lg p-3 bg-gold-500/10 border border-gold-500/20 flex items-center gap-4">
              <div className="text-center flex-shrink-0 w-8">
                <p className="text-2xl font-black leading-none text-gold-400">3</p>
                <p className="text-slate-500 text-xs">pts</p>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Correct First Goalscorer</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Pick a player on either team — awarded independently of your score prediction.
                  No points if match ends 0–0.
                </p>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            💡 Knockout stage matches score{' '}
            <strong className="text-slate-400">double score points</strong>{' '}
            (scorer bonus stays at 3 pts). Full details in the{' '}
            <strong className="text-slate-400">Rules</strong> tab.
          </p>

        </div>
      )}
    </div>
  );
}
