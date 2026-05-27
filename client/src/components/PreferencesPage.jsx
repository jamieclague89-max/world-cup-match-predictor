import { FIXTURES } from '../data/wc2026';

// All teams from fixtures (deduped, sorted)
const ALL_TEAMS = [...new Set(
  FIXTURES.flatMap(f => [f.homeTeam, f.awayTeam])
)].sort();

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-4 py-3.5 border-b border-pitch-700 last:border-0 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div
        onClick={onChange}
        className={`relative flex items-center w-10 h-[22px] rounded-full flex-shrink-0 mt-0.5
                    transition-colors duration-200 cursor-pointer
                    ${checked ? 'bg-green-500' : 'bg-pitch-600'}`}
      >
        <span
          className="absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </div>
    </label>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────
function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="flex gap-1 bg-pitch-900 border border-pitch-600 rounded-xl p-1">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150
            ${value === opt.id
              ? 'bg-pitch-700 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="bg-pitch-800 border border-pitch-700 rounded-xl overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-pitch-700 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PreferencesPage({ prefs, onPrefChange, onToggleTheme }) {
  const theme      = prefs.theme      || 'dark';
  const oddsFormat = prefs.oddsFormat || 'fractional';

  return (
    <div className="max-w-xl mx-auto pt-6 pb-16 px-2">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          ⚙️ Preferences
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Personalise your experience — changes sync across all your devices.
        </p>
      </div>

      {/* ── Appearance ── */}
      <Section title="Appearance" icon="🎨">
        <ToggleRow
          label="Dark mode"
          description="Switch between the dark pitch theme and light mode."
          checked={theme === 'dark'}
          onChange={onToggleTheme}
        />
        <ToggleRow
          label="Show bookies' odds panel"
          description="Display the collapsible odds panel on fixture cards."
          checked={!!prefs.showOdds}
          onChange={() => onPrefChange('showOdds', !prefs.showOdds)}
        />
        <ToggleRow
          label="Compact fixture cards"
          description="Reduce spacing to see more fixtures without scrolling."
          checked={!!prefs.compactCards}
          onChange={() => onPrefChange('compactCards', !prefs.compactCards)}
        />

        {/* Odds format */}
        <div className="py-3.5">
          <p className="text-sm font-semibold text-slate-200 mb-1">Odds format</p>
          <p className="text-xs text-slate-500 mb-3">
            Choose how odds are displayed in the bookies' picks panel.
            <span className="block mt-1 text-slate-600">
              Fractional: 4/1 &nbsp;·&nbsp; Decimal: 5.00
            </span>
          </p>
          <SegmentedControl
            value={oddsFormat}
            onChange={val => onPrefChange('oddsFormat', val)}
            options={[
              { id: 'fractional', label: '½  Fractional' },
              { id: 'decimal',    label: '1.0  Decimal'  },
            ]}
          />
        </div>
      </Section>

      {/* ── Favourite team ── */}
      <Section title="My Team" icon="⭐">
        <div className="py-3.5">
          <p className="text-sm font-semibold text-slate-200 mb-1">Favourite team</p>
          <p className="text-xs text-slate-500 mb-3">
            Used to highlight your team's fixtures (coming soon).
          </p>
          <select
            value={prefs.favouriteTeam || ''}
            onChange={e => onPrefChange('favouriteTeam', e.target.value)}
            className="w-full bg-pitch-900 border border-pitch-600 rounded-lg px-3 py-2
                       text-sm text-slate-200 focus:outline-none focus:border-gold-500
                       transition-colors"
          >
            <option value="">— No favourite —</option>
            {ALL_TEAMS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications" icon="🔔">
        <div className="py-2 pb-3">
          <p className="text-xs text-slate-500 italic">
            In-app notifications only — browser push coming in a future update.
          </p>
        </div>
        <ToggleRow
          label="Match results"
          description="Get notified when a result is confirmed for a fixture you predicted, including your points breakdown."
          checked={!!prefs.notifyResults}
          onChange={() => onPrefChange('notifyResults', !prefs.notifyResults)}
        />
        <ToggleRow
          label="Prediction deadlines"
          description="Get reminded on match day when you haven't yet predicted an upcoming fixture."
          checked={!!prefs.notifyDeadlines}
          onChange={() => onPrefChange('notifyDeadlines', !prefs.notifyDeadlines)}
        />
        <ToggleRow
          label="Daily leaderboard digest"
          description="Receive an end-of-day notification on match days to check your score and leaderboard position."
          checked={!!prefs.notifyLeaderboard}
          onChange={() => onPrefChange('notifyLeaderboard', !prefs.notifyLeaderboard)}
        />
      </Section>

      <p className="text-center text-xs text-slate-600 mt-2">
        Preferences are synced to your account and available on every device.
      </p>
    </div>
  );
}
