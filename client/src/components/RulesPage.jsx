import { useState } from 'react';

const SECTIONS = [
  { id: 'how-to-play', label: '🎮 How to Play' },
  { id: 'scoring',     label: '⭐ Points & Scoring' },
  { id: 'prizes',      label: '🥇 Prizes' },
];

export default function RulesPage() {
  const [activeSection, setActiveSection] = useState('how-to-play');

  return (
    <div className="animate-fade-in pt-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1">Rules & Guide</h2>
        <p className="text-slate-400 text-sm">Everything you need to know to play and win.</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeSection === s.id
                ? 'bg-gold-500 text-pitch-900'
                : 'bg-pitch-700 text-slate-300 hover:bg-pitch-600 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'how-to-play' && <HowToPlay />}
      {activeSection === 'scoring'     && <Scoring />}
      {activeSection === 'prizes'      && <Prizes />}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Getting Started</h3>
        <ol className="space-y-3 text-slate-300 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-pitch-900 font-black text-xs flex items-center justify-center">1</span>
            <span>Enter your name and country when you first open the app to create your profile.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-pitch-900 font-black text-xs flex items-center justify-center">2</span>
            <span>Head to the <strong className="text-white">Group Stage</strong> tab and browse all 72 upcoming World Cup group matches.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-pitch-900 font-black text-xs flex items-center justify-center">3</span>
            <span>Enter your predicted scoreline for each match using the score boxes. Use the <strong className="text-white">▲ ▼ arrows</strong> or type directly.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-pitch-900 font-black text-xs flex items-center justify-center">4</span>
            <span>Optionally, pick a <strong className="text-white">First Goalscorer</strong> for each match — select a team, then choose from their 26-man squad for a bonus +3 pts.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-pitch-900 font-black text-xs flex items-center justify-center">5</span>
            <span>Your predictions are saved automatically — no need to submit anything.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-pitch-900 font-black text-xs flex items-center justify-center">6</span>
            <span>Join or create a <strong className="text-white">Mini League</strong> to compete against friends, or join the <strong className="text-white">Public Leaderboard</strong> to compete with everyone.</span>
          </li>
        </ol>
      </div>

      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Tips</h3>
        <ul className="space-y-2 text-slate-300 text-sm list-disc list-inside">
          <li>You can update your predictions any time before a match kicks off.</li>
          <li>Use the group and round filters on the Group Stage page to find specific matches quickly.</li>
          <li>The first goalscorer pick is optional but worth +3 pts — it can make a big difference over 72 games.</li>
          <li>Check the Knockout tab to see the bracket as the tournament progresses.</li>
          <li>Predictions lock automatically the moment a match kicks off — don't leave it too late!</li>
          <li>Sync your predictions to the Public Leaderboard after each round to keep your score up to date.</li>
        </ul>
      </div>
    </div>
  );
}

function Scoring() {
  return (
    <div className="space-y-4">

      {/* Score prediction points */}
      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-1">Score Prediction</h3>
        <p className="text-slate-500 text-xs mb-4">Points awarded per match based on your predicted scoreline.</p>
        <div className="space-y-3">
          <ScoreRow points={5} label="Exact Score" description="You predicted the exact scoreline — e.g. you said 2–1 and it finished 2–1" highlight />
          <ScoreRow points={3} label="Correct Result" description="You got the right outcome (win, loss or draw) but not the exact score" />
          <ScoreRow points={1} label="Correct Goal Difference" description="The goal difference in your prediction matches the actual result, even if the overall result is wrong" />
          <ScoreRow points={0} label="No Points" description="None of the above criteria are met" />
        </div>
      </div>

      {/* First goalscorer points */}
      <div className="card border border-gold-500/20 bg-gold-500/5">
        <h3 className="text-gold-400 font-bold text-lg mb-1">⚽ First Goalscorer Bonus</h3>
        <p className="text-slate-400 text-xs mb-4">An optional prediction available on every group stage fixture.</p>
        <div className="space-y-3">
          <ScoreRow points={3} label="Correct First Goalscorer" description="The player you picked scores the first goal of the match — regardless of your score prediction" highlight={false} accent />
          <ScoreRow points={0} label="No Points" description="Your player doesn't score first, scores later in the match, or you didn't make a pick" />
        </div>
        <div className="mt-4 bg-pitch-700/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
          <p>💡 <strong className="text-slate-300">How to pick:</strong> On each fixture card, click a team button to filter the squad, then choose your player from their 26-man list.</p>
          <p>💡 The goalscorer bonus is <strong className="text-slate-300">independent</strong> of your score prediction — you can earn both in the same match.</p>
          <p>💡 If a match ends <strong className="text-slate-300">0–0</strong>, no goalscorer points are awarded to anyone.</p>
        </div>
      </div>

      {/* Examples */}
      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Scoring Examples</h3>
        <div className="space-y-3 text-sm">
          <Example actual="2 – 1" predicted="2 – 1" points={5} outcome="Exact score" />
          <Example actual="2 – 0" predicted="3 – 1" points={3} outcome="Correct result (home win) — goal diff doesn't match" />
          <Example actual="1 – 1" predicted="0 – 0" points={3} outcome="Correct result (draw)" />
          <Example actual="3 – 1" predicted="1 – 0" points={1} outcome="Correct goal diff (+2) but wrong result" />
          <Example actual="2 – 1" predicted="0 – 2" points={0} outcome="Wrong result" />
        </div>
        <div className="mt-4 border-t border-pitch-700 pt-4">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">First Goalscorer Examples</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3 bg-gold-500/5 border border-gold-500/20 rounded-lg p-2.5">
              <span className="text-gold-400 font-black text-base w-8 text-center flex-shrink-0">+3</span>
              <span className="text-slate-300">You picked <strong className="text-white">Harry Kane</strong> — he opens the scoring in the 12th minute ✅</span>
            </div>
            <div className="flex items-center gap-3 bg-pitch-700/40 rounded-lg p-2.5">
              <span className="text-slate-600 font-black text-base w-8 text-center flex-shrink-0">0</span>
              <span className="text-slate-400">You picked <strong className="text-slate-300">Harry Kane</strong> — he scores 2nd after Bellingham's opener ✗</span>
            </div>
            <div className="flex items-center gap-3 bg-pitch-700/40 rounded-lg p-2.5">
              <span className="text-slate-600 font-black text-base w-8 text-center flex-shrink-0">0</span>
              <span className="text-slate-400">You picked <strong className="text-slate-300">Erling Haaland</strong> — he scores but England win 2–0 (no own team goals) ✗</span>
            </div>
          </div>
        </div>
      </div>

      {/* Knockout rounds */}
      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Knockout Rounds</h3>
        <p className="text-slate-300 text-sm mb-3">
          Points for knockout stage matches (Round of 32 onward) are <strong className="text-white">doubled</strong>. Predict these carefully — they're worth twice as much!
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="bg-pitch-700 rounded-lg p-3 text-center">
            <p className="text-gold-400 font-black text-xl">10</p>
            <p className="text-slate-400 text-xs mt-0.5">Exact score</p>
          </div>
          <div className="bg-pitch-700 rounded-lg p-3 text-center">
            <p className="text-gold-400 font-black text-xl">6</p>
            <p className="text-slate-400 text-xs mt-0.5">Correct result</p>
          </div>
          <div className="bg-pitch-700 rounded-lg p-3 text-center">
            <p className="text-gold-400 font-black text-xl">2</p>
            <p className="text-slate-400 text-xs mt-0.5">Goal diff</p>
          </div>
          <div className="bg-pitch-700 rounded-lg p-3 text-center">
            <p className="text-gold-400 font-black text-xl">3</p>
            <p className="text-slate-400 text-xs mt-0.5">First scorer</p>
            <p className="text-slate-600 text-xs">(not doubled)</p>
          </div>
        </div>
      </div>

      {/* Points summary */}
      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Maximum Points Per Match</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-pitch-700/50 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Group Stage</p>
            <p className="text-gold-400 font-black text-4xl">8</p>
            <p className="text-slate-400 text-xs mt-1">5 (exact) + 3 (scorer)</p>
          </div>
          <div className="bg-pitch-700/50 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Knockout Stage</p>
            <p className="text-gold-400 font-black text-4xl">13</p>
            <p className="text-slate-400 text-xs mt-1">10 (exact) + 3 (scorer)</p>
          </div>
        </div>
      </div>

    </div>
  );
}

function ScoreRow({ points, label, description, highlight, accent }) {
  const bg = highlight ? 'bg-gold-500/10 border border-gold-500/30'
           : accent    ? 'bg-pitch-700/50 border border-pitch-600'
           :             'bg-pitch-700/50';
  const ptColor = highlight || accent ? 'text-gold-400' : 'text-white';
  const labelColor = highlight ? 'text-gold-300' : 'text-white';
  return (
    <div className={`flex items-start gap-4 p-3 rounded-lg ${bg}`}>
      <div className="flex-shrink-0 text-center w-8">
        <span className={`text-2xl font-black ${ptColor}`}>{points}</span>
        <p className="text-slate-500 text-xs leading-none">pts</p>
      </div>
      <div>
        <p className={`font-bold text-sm ${labelColor}`}>{label}</p>
        <p className="text-slate-400 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function Example({ actual, predicted, points, outcome }) {
  return (
    <div className="flex items-center gap-3 bg-pitch-700/50 rounded-lg p-3">
      <div className="flex-shrink-0 flex gap-2 text-xs text-slate-400">
        <div className="text-center">
          <p className="text-slate-500 leading-none mb-0.5">Actual</p>
          <p className="font-mono font-bold text-white text-sm">{actual}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500 leading-none mb-0.5">Predicted</p>
          <p className="font-mono font-bold text-white text-sm">{predicted}</p>
        </div>
      </div>
      <div className="flex-1 text-xs text-slate-400">{outcome}</div>
      <div className="flex-shrink-0 text-right">
        <span className={`font-black text-lg ${points > 0 ? 'text-gold-400' : 'text-slate-600'}`}>{points}</span>
        <span className="text-slate-500 text-xs ml-0.5">pts</span>
      </div>
    </div>
  );
}

function Prizes() {
  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-4">Prize Structure</h3>
        <div className="space-y-3">
          <PrizeRow place="1st" icon="🥇" prize="£50 Amazon voucher" detail="Overall winner with the most points across all matches" />
          <PrizeRow place="2nd" icon="🥈" prize="£25 Amazon voucher" detail="Runner-up at the end of the tournament" />
          <PrizeRow place="3rd" icon="🥉" prize="£10 Amazon voucher" detail="Third place at the end of the tournament" />
        </div>
      </div>

      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Monthly Round Prizes</h3>
        <p className="text-slate-300 text-sm mb-3">
          In addition to the overall prizes, the top scorer each month wins a bonus prize.
        </p>
        <div className="bg-pitch-700/50 rounded-lg p-3 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-white font-bold text-sm">Monthly Winner</p>
            <p className="text-slate-400 text-xs">£10 Amazon voucher for the highest-scoring player each calendar month</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-gold-400 font-bold text-lg mb-3">Tiebreakers</h3>
        <p className="text-slate-300 text-sm mb-2">If two or more players finish level on points, the winner is determined by:</p>
        <ol className="space-y-2 text-slate-300 text-sm list-decimal list-inside">
          <li>Most exact scores predicted correctly</li>
          <li>Most correct first goalscorer picks</li>
          <li>Most correct results (win/draw/loss)</li>
          <li>Earliest entry date (first to sign up wins the tiebreak)</li>
        </ol>
      </div>

      <div className="card border border-gold-500/20">
        <p className="text-slate-400 text-xs text-center">
          Prizes are awarded at the conclusion of the tournament. The organiser reserves the right to amend the prize structure. All decisions are final.
        </p>
      </div>
    </div>
  );
}

function PrizeRow({ place, icon, prize, detail }) {
  return (
    <div className="flex items-start gap-4 bg-pitch-700/50 rounded-lg p-3">
      <span className="text-3xl flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-white font-bold text-sm">{place}</p>
          <p className="text-gold-400 font-black text-base">{prize}</p>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
