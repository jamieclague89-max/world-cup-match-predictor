import { useEffect, useState } from 'react';
import { KNOCKOUT_ROUNDS } from '../data/wc2026';

// ── Layout constants ──────────────────────────────────────────────────────────
const SLOTS  = 16;   // R32 match count — the vertical base unit
const CELL   = 84;   // px per base slot
const CARD_H = 66;   // match card height (two 32px rows + 2px divider)
const CARD_W = 176;  // match card width
const GAP    = 44;   // gap between columns (connector lines live here)
const HDR    = 48;   // header height above bracket

const SVG_H   = SLOTS * CELL;          // 1344 px
const TOTAL_H = SVG_H + HDR;           // 1392 px
const COL_W   = CARD_W + GAP;

// ── Bracket structure ─────────────────────────────────────────────────────────
// KNOCKOUT_ROUNDS indices: 0=R32, 1=R16, 2=QF, 3=SF, 4=3rdPlace, 5=Final
const MAIN_IDX  = [0, 1, 2, 3, 5]; // rounds shown in the main bracket
const THIRD_IDX = 4;

function buildBracket() {
  return MAIN_IDX.map((dataIdx, colIdx) => {
    const round = KNOCKOUT_ROUNDS[dataIdx];
    const count = round.matches.length;
    const span  = SLOTS / count; // how many base slots this round's match occupies
    const x     = colIdx * COL_W;

    return {
      label:  round.name,
      dates:  round.dates,
      colIdx,
      x,
      matches: round.matches.map((m, mi) => {
        // Centre the card vertically within its slot range
        const cy = Math.round((mi + 0.5) * span * CELL);
        return { ...m, cy, top: cy - CARD_H / 2 };
      }),
    };
  });
}

// ── Team row ──────────────────────────────────────────────────────────────────
function TeamRow({ name, score, winner }) {
  const tbd = !name || name === 'TBD';
  return (
    <div className={`flex items-center gap-2 px-2.5 h-8 ${winner ? 'bg-gold-500/10' : ''}`}>
      <span className={`text-xs flex-1 truncate leading-none ${
        tbd    ? 'text-slate-600 italic' :
        winner ? 'text-gold-400 font-bold' :
                 'text-slate-300'
      }`}>
        {tbd ? 'TBD' : name}
      </span>
      {score != null && (
        <span className={`text-xs font-black w-4 text-right leading-none flex-shrink-0 ${
          winner ? 'text-gold-400' : 'text-slate-500'
        }`}>
          {score}
        </span>
      )}
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────
function MatchCard({ match, result, x, top }) {
  const tbd    = match.homeTeam === 'TBD' && match.awayTeam === 'TBD';
  const hasRes = result != null;
  const hScore = hasRes ? parseInt(result.home, 10) : null;
  const aScore = hasRes ? parseInt(result.away, 10) : null;
  const hWin   = hasRes && hScore > aScore;
  const aWin   = hasRes && aScore > hScore;

  return (
    <div
      className={`absolute rounded-lg border overflow-hidden ${
        hasRes ? 'border-gold-500/30 bg-pitch-700' :
        tbd    ? 'border-pitch-700/40 bg-pitch-900/40 opacity-50' :
                 'border-pitch-600/60 bg-pitch-800'
      }`}
      style={{ left: x, top: top + HDR, width: CARD_W, height: CARD_H }}
    >
      <TeamRow
        name={match.homeTeam === 'TBD' ? null : match.homeTeam}
        score={hScore}
        winner={hWin}
      />
      <div className="mx-2.5 h-px bg-pitch-600/60" />
      <TeamRow
        name={match.awayTeam === 'TBD' ? null : match.awayTeam}
        score={aScore}
        winner={aWin}
      />
      <span className="absolute top-0.5 right-1 text-[9px] text-slate-600 font-mono leading-none pointer-events-none">
        {match.id}
      </span>
    </div>
  );
}

// ── SVG connector lines ───────────────────────────────────────────────────────
function Connectors({ rounds }) {
  const lines = [];
  const STROKE = '#1e2d3d';
  const SW     = 1.5;

  for (let ci = 0; ci < rounds.length - 1; ci++) {
    const curr = rounds[ci];
    const next = rounds[ci + 1];
    const x1   = curr.x + CARD_W;
    const x2   = next.x;
    const xm   = Math.round((x1 + x2) / 2);

    next.matches.forEach((nm, ni) => {
      const feeders = curr.matches.slice(ni * 2, ni * 2 + 2);
      if (feeders.length < 2) return;

      const y1 = feeders[0].cy;
      const y2 = feeders[1].cy;
      const yn = nm.cy;

      lines.push(
        // Horizontal stub from top feeder
        <line key={`h1-${ci}-${ni}`} x1={x1} y1={y1} x2={xm} y2={y1} stroke={STROKE} strokeWidth={SW} />,
        // Horizontal stub from bottom feeder
        <line key={`h2-${ci}-${ni}`} x1={x1} y1={y2} x2={xm} y2={y2} stroke={STROKE} strokeWidth={SW} />,
        // Vertical connecting line
        <line key={`v-${ci}-${ni}`}  x1={xm} y1={y1} x2={xm} y2={y2} stroke={STROKE} strokeWidth={SW} />,
        // Horizontal stub into next round card
        <line key={`hn-${ci}-${ni}`} x1={xm} y1={yn} x2={x2} y2={yn} stroke={STROKE} strokeWidth={SW} />,
      );
    });
  }

  const totalW = rounds[rounds.length - 1].x + CARD_W;

  return (
    <svg
      width={totalW}
      height={SVG_H}
      style={{ position: 'absolute', top: HDR, left: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      {lines}
    </svg>
  );
}

// ── Third-place card (standalone) ─────────────────────────────────────────────
function ThirdPlaceCard({ match, result }) {
  const hasRes = result != null;
  const hScore = hasRes ? parseInt(result.home, 10) : null;
  const aScore = hasRes ? parseInt(result.away, 10) : null;

  return (
    <div
      className={`rounded-lg border overflow-hidden mx-auto ${
        hasRes ? 'border-gold-500/30 bg-pitch-700' : 'border-pitch-600/50 bg-pitch-800'
      }`}
      style={{ maxWidth: CARD_W }}
    >
      <TeamRow
        name={match.homeTeam === 'TBD' ? null : match.homeTeam}
        score={hScore}
        winner={hasRes && hScore > aScore}
      />
      <div className="mx-2.5 h-px bg-pitch-600/60" />
      <TeamRow
        name={match.awayTeam === 'TBD' ? null : match.awayTeam}
        score={aScore}
        winner={hasRes && aScore > hScore}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KnockoutBracket() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/results')
      .then(r => r.json())
      .then(d => setResults(d.results || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rounds     = buildBracket();
  const thirdPlace = KNOCKOUT_ROUNDS[THIRD_IDX];
  const totalW     = rounds[rounds.length - 1].x + CARD_W;

  return (
    <div className="animate-fade-in mt-6">

      {/* Info banner */}
      <div className="card mb-5 flex gap-3 items-start border-amber-700/40 bg-amber-900/10">
        <span className="text-xl mt-0.5 flex-shrink-0">🔒</span>
        <div>
          <p className="text-amber-300 font-bold text-sm">Bracket unlocks from 28 June</p>
          <p className="text-slate-400 text-xs mt-0.5 leading-snug">
            Teams qualify after the group stage ends (25–29 Jun). The bracket fills in
            automatically as results are confirmed. Scroll right to see later rounds →
          </p>
        </div>
      </div>

      {/* Horizontally scrollable bracket */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div style={{ width: totalW, height: TOTAL_H, position: 'relative', minWidth: totalW }}>

          {/* SVG connector lines (rendered behind cards) */}
          {!loading && <Connectors rounds={rounds} />}

          {/* Round column headers */}
          {rounds.map(r => (
            <div
              key={r.label}
              className="absolute top-0 text-center"
              style={{ left: r.x, width: CARD_W }}
            >
              <p className="text-white text-[11px] font-black leading-tight">{r.label}</p>
              <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{r.dates}</p>
            </div>
          ))}

          {/* Match cards */}
          {rounds.flatMap(r =>
            r.matches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                result={results[m.id] ?? null}
                x={r.x}
                top={m.top}
              />
            ))
          )}
        </div>
      </div>

      {/* Third-place play-off — shown below the main bracket */}
      <div className="card mt-2 border-pitch-600/50">
        <p className="text-slate-400 text-xs font-semibold mb-2.5 flex items-center gap-2">
          <span>🥉</span>
          <span>Third-Place Play-off · 23 Jul · Hard Rock Stadium, FL</span>
        </p>
        {thirdPlace.matches.map(m => (
          <ThirdPlaceCard key={m.id} match={m} result={results[m.id] ?? null} />
        ))}
      </div>

    </div>
  );
}
