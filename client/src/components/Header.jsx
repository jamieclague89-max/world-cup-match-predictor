import { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';
const trophyImg = '/world-cup-2026-trophy.webp';

// ── Theme toggle switch ───────────────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg
                 text-slate-300 hover:text-slate-100 hover:bg-pitch-700
                 transition-colors duration-150 focus:outline-none flex-shrink-0"
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

// ── User dropdown menu ────────────────────────────────────────────────────────
function UserMenu({ user, onLogout, setActiveTab }) {
  const [open, setOpen] = useState(false);
  const menuRef   = useRef(null);
  const leaveTimer = useRef(null);

  // Initials avatar
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function openMenu()  {
    clearTimeout(leaveTimer.current);
    setOpen(true);
  }
  function startClose() {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  }

  // Close on outside click
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
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={startClose}
    >
      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                   hover:bg-pitch-700 transition-colors duration-150 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-pitch-900 leading-none">{initials}</span>
        </div>

        {/* Name (hidden on xs) */}
        <span className="text-white text-sm font-semibold leading-none hidden sm:block">
          {user?.name}
        </span>

        {/* Chevron */}
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
        <div
          className="absolute right-0 top-full mt-2 w-52 bg-pitch-800 border border-pitch-600
                     rounded-xl shadow-2xl py-1 z-[60]"
          onMouseEnter={openMenu}
          onMouseLeave={startClose}
        >
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
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

  // Bottom nav: all tabs (Rules + Admin both shown for admins)
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
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <NotificationBell userId={userId} />
            <UserMenu
              user={user}
              onLogout={onLogout}
              setActiveTab={setActiveTab}
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
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              activeTab === tab.id
                ? 'text-gold-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-lg leading-none">{tab.emoji}</span>
            <span className={`text-[9px] leading-none font-semibold ${activeTab === tab.id ? 'text-gold-400' : 'text-slate-500'}`}>
              {tab.short}
            </span>
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}
