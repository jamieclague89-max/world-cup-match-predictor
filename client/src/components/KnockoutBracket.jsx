import { KNOCKOUT_ROUNDS } from '../data/wc2026';

function KnockoutMatch({ match }) {
  return (
    <div className="bg-pitch-700/50 rounded-lg border border-pitch-600/50 p-2.5 opacity-60 select-none min-w-[180px]">
      <div className="flex items-center gap-2 py-1">
        <span className="text-slate-500 text-base">🏳</span>
        <span className="text-slate-400 text-sm flex-1">TBD</span>
        <span className="score-input !w-8 !h-8 !text-sm opacity-40 pointer-events-none flex items-center justify-center border-2 border-pitch-600 rounded bg-pitch-800 text-slate-600">
          –
        </span>
      </div>
      <div className="h-px bg-pitch-600/50 my-0.5" />
      <div className="flex items-center gap-2 py-1">
        <span className="text-slate-500 text-base">🏳</span>
        <span className="text-slate-400 text-sm flex-1">TBD</span>
        <span className="score-input !w-8 !h-8 !text-sm opacity-40 pointer-events-none flex items-center justify-center border-2 border-pitch-600 rounded bg-pitch-800 text-slate-600">
          –
        </span>
      </div>
    </div>
  );
}

export default function KnockoutBracket() {
  return (
    <div className="animate-fade-in mt-6">
      <div className="card mb-6 flex gap-3 items-start border-amber-700/40 bg-amber-900/10">
        <span className="text-2xl mt-0.5">🔒</span>
        <div>
          <p className="text-amber-300 font-bold text-sm">Knockout rounds are locked</p>
          <p className="text-slate-400 text-xs mt-1">
            Knockout fixtures are determined by group stage results. Predictions for these matches
            will open once the group stage is complete. Shown here as a preview only.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {KNOCKOUT_ROUNDS.map(round => (
          <section key={round.name}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-white font-black text-lg">{round.name}</h2>
              <span className="text-xs text-slate-400 bg-pitch-700 px-2 py-0.5 rounded-full">{round.dates}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {round.matches.map(match => (
                <KnockoutMatch key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 card border-pitch-600/50 opacity-50">
        <p className="text-slate-400 text-sm text-center">
          🏆 Final · 26 July 2026 · MetLife Stadium, East Rutherford NJ
        </p>
      </div>
    </div>
  );
}
