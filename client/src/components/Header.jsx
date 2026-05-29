import { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';

const trophyImg = '/world-cup-2026-trophy.webp';
const WHATSAPP_URL = 'https://chat.whatsapp.com/GRCIsF3ZDvjJFW6ZV3tWRn?mode=gi_t';

// ── WhatsApp icon (header button) ─────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Join our WhatsApp group"
      className="relative flex items-center justify-center w-9 h-9 rounded-lg
                 hover:bg-pitch-700 transition-colors duration-150 focus:outline-none flex-shrink-0"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"
           style={{ fill: '#25d366' }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}

// ── Theme toggle switch ───────────────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg
                 text-slate-300 hover:text-slate-100 hover:bg-pitch-700
                 transition-colors duration-150 focus:outline-none flex-shrink-0"
    >
      <span className="text-sm leading-none">{isDark ? '🌙' : '☀️'}</span>
      <span className="text-xs font-medium">
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

// ── User dropdown menu ────────────────────────────────────────────────────────
function UserMenu({ user, onLogout, setActiveTab, theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const isDark = theme === 'dark';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function navigate(tab) {
    setActiveTab(tab);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                   hover:bg-pitch-700 transition-colors duration-150 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-pitch-900 leading-none">{initials}</span>
        </div>
        <span className="text-white text-sm font-semibold leading-none hidden sm:block">
          {user?.name}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-150 hidden sm:block
                      ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-pitch-800 border border-pitch-600
                        rounded-xl shadow-2xl py-1 z-[60]">

          {/* User info header */}
          <div className="flex items-center gap-3 px-3 py-2.5 border-b border-pitch-700">
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-black text-pitch-900 leading-none">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate leading-tight">{user?.name}</p>
              {user?.is_admin && (
                <p className="text-gold-400 text-xs font-semibold leading-tight">Administrator</p>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">

            {/* Theme toggle — mobile only (desktop has it in the header) */}
            <button
              onClick={() => { onToggleTheme(); }}
              className="sm:hidden w-full flex items-center justify-between gap-3 px-3 py-2.5
                         text-sm text-slate-300 hover:text-white hover:bg-pitch-700
                         transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-base w-5 text-center">{isDark ? '🌙' : '☀️'}</span>
                <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
              </div>
              {/* Mini toggle pill */}
              <div
                className="relative flex items-center w-8 h-[18px] rounded-full flex-shrink-0
                           transition-colors duration-300"
                style={{ background: isDark ? '#163058' : '#d97706' }}
              >
                <span
                  className="absolute w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300"
                  style={{ transform: isDark ? 'translateX(2px)' : 'translateX(14px)' }}
                />
              </div>
            </button>

            <button
              onClick={() => navigate('preferences')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300
                         hover:text-white hover:bg-pitch-700 transition-colors text-left"
            >
              <span className="text-base w-5 text-center">⚙️</span>
              <span>Preferences</span>
            </button>
            <button
              onClick={() => navigate('settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300
                         hover:text-white hover:bg-pitch-700 transition-colors text-left"
            >
              <span className="text-base w-5 text-center">🔧</span>
              <span>Settings</span>
            </button>
          </div>

          {/* Divider + sign out */}
          <div className="border-t border-pitch-700 py-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400
                         hover:text-red-300 hover:bg-pitch-700 transition-colors text-left"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export default function Header({ user, activeTab, setActiveTab, onLogout, theme, onToggleTheme, userId, onLogoClick }) {
  const allTabs = [
    { id: 'predictions', label: '🔮 Predictions', emoji: '🔮', short: 'Predict'  },
    { id: 'results',     label: '📊 My Results',  emoji: '📊', short: 'Results'  },
    { id: 'leaderboard', label: '🌍 Leaderboard', emoji: '🌍', short: 'Leaders'  },
    { id: 'league',      label: '🏅 My League',   emoji: '🏅', short: 'League'   },
    { id: 'rules',       label: '📖 Rules',        emoji: '📖', short: 'Rules'    },
    ...(user.is_admin ? [{ id: 'admin', label: '⚙️ Admin', emoji: '⚙️', short: 'Admin' }] : []),
  ];

  const bottomTabs = allTabs;

  return (
    <>
    <header className="bg-pitch-800 border-b border-pitch-700 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">

        {/* Top bar */}
        <div className="flex items-center justify-between py-3">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="Go to home"
          >
            <img src={trophyImg} alt="World Cup Trophy" className="h-9 w-auto" />
            <div className="text-left">
              <h1 className="text-white font-black text-base leading-none">World Cup 2026</h1>
              <p className="text-gold-400 text-xs font-semibold">Match Predictor</p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {/* Theme toggle — desktop only (mobile: inside user dropdown) */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            {/* WhatsApp — always visible */}
            <WhatsAppButton />
            <NotificationBell userId={userId} setActiveTab={setActiveTab} />
            <UserMenu
              user={user}
              onLogout={onLogout}
              setActiveTab={setActiveTab}
              theme={theme}
              onToggleTheme={onToggleTheme}
            />
          </div>
        </div>

        {/* Tab navigation — desktop only */}
        <nav className="hidden sm:flex gap-1 pb-0 -mb-px">
          {allTabs.map(tab => (
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

    {/* ── Bottom tab bar — mobile only ──────────────────────────────────── */}
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-pitch-800 border-t border-pitch-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {bottomTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              activeTab === tab.id ? 'text-gold-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl leading-none">{tab.emoji}</span>
            <span className={`text-[10px] leading-none font-semibold ${activeTab === tab.id ? 'text-gold-400' : 'text-slate-500'}`}>
              {tab.short}
            </span>
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}
