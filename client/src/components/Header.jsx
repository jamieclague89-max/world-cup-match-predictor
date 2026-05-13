export default function Header({ user, activeTab, setActiveTab, onLogout }) {
  const tabs = [
    { id: 'predictions', label: '📋 Group Stage' },
    { id: 'knockout',    label: '⚔️ Knockout' },
    { id: 'league',      label: '🏅 My League' },
    { id: 'rules',       label: '📖 Rules' },
    { id: 'admin',       label: '⚙️ Admin' },
  ];

  return (
    <header className="bg-pitch-800 border-b border-pitch-700 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h1 className="text-white font-black text-base leading-none">World Cup 2026</h1>
              <p className="text-gold-400 text-xs font-semibold">Match Predictor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-semibold leading-none">{user.name}</p>
              <p className="text-slate-400 text-xs">{user.country}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors px-2 py-1 rounded hover:bg-pitch-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 pb-0 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-gold-400 border-gold-400 font-bold bg-pitch-900'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-pitch-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
