import trophyImg from '../assets/world-cup-2026-trophy.webp';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg
                 text-slate-400 hover:text-slate-200 hover:bg-pitch-700
                 transition-colors duration-150 focus:outline-none"
    >
      <span className="text-sm leading-none">{isDark ? '🌙' : '☀️'}</span>
      <span className="text-xs font-medium hidden sm:block">
        {isDark ? 'Dark' : 'Light'}
      </span>
      <div
        className="relative flex items-center w-8 h-[18px] rounded-full
                   transition-colors duration-300 flex-shrink-0"
        style={{ background: isDark ? '#163058' : '#d97706' }}
      >
        <span
          className="absolute w-3 h-3 bg-white rounded-full shadow-sm
                     transition-transform duration-300"
          style={{ transform: isDark ? 'translateX(2px)' : 'translateX(14px)' }}
        />
      </div>
    </button>
  );
}

export default function LandingPage({ onSignIn, onSignUp, theme = 'dark', onToggleTheme }) {
  return (
    <div className="min-h-screen bg-pitch-900 text-white">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-pitch-900/90 backdrop-blur-sm border-b border-pitch-700/50">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={trophyImg} alt="World Cup Trophy" className="h-9 w-auto" />
            <div>
              <p className="text-white font-black text-sm leading-none">World Cup 2026</p>
              <p className="text-gold-400 text-xs font-semibold">Match Predictor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              onClick={onSignIn}
              className="btn-secondary text-sm py-1.5 px-4"
            >
              Sign in
            </button>
            <button
              onClick={onSignUp}
              className="btn-primary text-sm py-1.5 px-4"
            >
              Sign up free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-10 sm:py-14 text-center">
        {/* Decorative background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold-500 opacity-[0.04] rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600 opacity-[0.04] rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold-500 opacity-[0.03] rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="text-sm">🗓️</span>
            <span className="text-gold-400 text-xs font-semibold">Tournament starts 11 June 2026</span>
          </div>

          <img
            src={trophyImg}
            alt="World Cup Trophy"
            className="mx-auto mb-8 h-40 w-auto"
          />

          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-5 tracking-tight">
            Predict every match.
            <br />
            <span className="text-gold-400">Top the table.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            The ultimate World Cup 2026 prediction game. Pick scores, name the first goalscorer, and battle your friends on a live leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={onSignUp}
              className="btn-primary text-base py-3.5 px-8 font-bold w-full sm:w-auto"
            >
              Create free account →
            </button>
            <button
              onClick={onSignIn}
              className="btn-secondary text-base py-3.5 px-8 w-full sm:w-auto"
            >
              I already have an account
            </button>
          </div>

          <p className="text-slate-600 text-xs mt-5">
            Free to play · No credit card · Takes 30 seconds
          </p>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div className="border-y border-pitch-700/50 bg-pitch-800/50">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { num: '48',   label: 'Teams',           sub: 'competing' },
            { num: '104',  label: 'Matches',          sub: 'to predict' },
            { num: '3',    label: 'Host Countries',   sub: 'USA · Canada · Mexico' },
            { num: '13',   label: 'Max points',       sub: 'per group match' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-gold-400">{s.num}</p>
              <p className="text-white text-sm font-semibold">{s.label}</p>
              <p className="text-slate-500 text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">How it works</h2>
          <p className="text-slate-400">Up and running in under 2 minutes</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon:  '🔐',
              step:  '01',
              title: 'Create your account',
              desc:  'Sign up free with your email or Google in 30 seconds.',
            },
            {
              icon:  '⚽',
              step:  '02',
              title: 'Predict match scores',
              desc:  'Pick the scoreline for every group stage fixture before kick-off.',
            },
            {
              icon:  '🎯',
              step:  '03',
              title: 'Pick the first scorer',
              desc:  'Choose who you think scores first for a 3-point bonus.',
            },
            {
              icon:  '🏆',
              step:  '04',
              title: 'Climb the leaderboard',
              desc:  'Watch your rank update live as World Cup results come in.',
            },
          ].map(s => (
            <div key={s.step} className="card text-center hover:border-pitch-600 transition-colors">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-xs text-gold-600 font-black mb-2 tracking-widest">{s.step}</div>
              <h3 className="text-white font-bold mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scoring breakdown ──────────────────────────────────────────────── */}
      <section className="bg-pitch-800/50 border-y border-pitch-700/50 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">How points are scored</h2>
            <p className="text-slate-400">Every prediction counts — even a close miss earns you points</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { pts: 5, title: 'Exact score',       desc: 'Perfect scoreline prediction',    gold: true  },
              { pts: 3, title: 'Correct result',    desc: 'Right outcome, wrong score',      gold: false },
              { pts: 3, title: 'First goalscorer',  desc: 'Bonus — awarded independently',  gold: true  },
              { pts: 1, title: 'Correct score, wrong winner',   desc: 'Correct margin, wrong winner',    gold: false },
            ].map(s => (
              <div
                key={s.title}
                className={`rounded-xl p-6 text-center ${
                  s.gold
                    ? 'bg-gold-500/10 border border-gold-500/20'
                    : 'bg-pitch-700/60'
                }`}
              >
                <p className={`text-5xl font-black mb-1 leading-none ${s.gold ? 'text-gold-400' : 'text-slate-200'}`}>
                  {s.pts}
                </p>
                <p className="text-slate-400 text-xs mb-3">points</p>
                <p className="text-white font-bold text-sm">{s.title}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm">
            💡 Knockout stage: score prediction points are <strong className="text-slate-400">doubled</strong>. Scorer bonus stays at 3 pts.
            Max 13 pts per group match · up to 18 pts per knockout match.
          </p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Everything you need to play</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              icon:  '🌍',
              title: 'Global Leaderboard',
              desc:  'Live standings updated automatically after every match. See where you rank among all players.',
            },
            {
              icon:  '🏅',
              title: 'Private Leagues',
              desc:  'Create a private league, share the code with your friends, and compete on your own mini table.',
            },
            {
              icon:  '📱',
              title: 'Any Device, Any Time',
              desc:  'Fully responsive — predict on your phone, tablet, or laptop. Your picks are saved to the cloud.',
            },
            {
              icon:  '🔔',
              title: 'Instant Notifications',
              desc:  'Get notified the moment a result is confirmed, complete with your points breakdown for that match.',
            },
            {
              icon:  '📊',
              title: 'Personal Stats & History',
              desc:  'Track your prediction record match by match — see your exact scores, correct results, and total points over the tournament.',
            },
            {
              icon:  '⏰',
              title: 'Deadline Reminders',
              desc:  "Never miss a kick-off. Get reminded on match day if you haven't predicted yet, so you're never caught out.",
            },
          ].map(f => (
            <div key={f.title} className="card flex gap-4 items-start hover:border-pitch-600 transition-colors">
              <div className="text-3xl flex-shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <h3 className="text-white font-bold mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-pitch-800/50 border-t border-pitch-700/50 px-4 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-5xl mb-5">⚽</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Ready to play?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Set up your free account in seconds, predict every match, and compete with friends from the very first kick-off on <strong className="text-white">11 June 2026</strong>.
          </p>
          <button
            onClick={onSignUp}
            className="btn-primary text-base py-4 px-10 font-bold"
          >
            Create your free account →
          </button>
          <p className="text-slate-600 text-xs mt-4">Already playing?{' '}
            <button onClick={onSignIn} className="text-gold-400 hover:underline">Sign in here</button>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-pitch-700/50 px-4 py-6 text-center text-slate-600 text-xs">
        <p>World Cup 2026 Match Predictor · USA · Canada · Mexico · 11 June – 19 July 2026</p>
      </footer>
    </div>
  );
}
