import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { useLocalStorage } from './hooks/useLocalStorage';
import { FIXTURES } from './data/wc2026';
import LandingPage    from './components/LandingPage';
import AuthPage       from './components/AuthPage';
import ProfileSetup   from './components/ProfileSetup';
import Header         from './components/Header';
import FixtureList    from './components/FixtureList';
import KnockoutBracket from './components/KnockoutBracket';
import LeagueManager  from './components/LeagueManager';
import AdminPage      from './components/AdminPage';
import RulesPage      from './components/RulesPage';
import Leaderboard    from './components/Leaderboard';
import PersonalStats  from './components/PersonalStats';
import MyResults      from './components/MyResults';
import NudgeBanner      from './components/NudgeBanner';
import CountdownTicker  from './components/CountdownTicker';
import ScoringGuide     from './components/ScoringGuide';
import BackToTop        from './components/BackToTop';
import PreferencesPage  from './components/PreferencesPage';
import SettingsPage        from './components/SettingsPage';
import ResetPasswordPage   from './components/ResetPasswordPage';
import ErrorPage           from './components/ErrorPage';

// ── Default preferences ───────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  theme:            'dark',
  oddsFormat:       'fractional',
  showOdds:         true,
  compactCards:     false,
  notifyResults:    true,
  notifyDeadlines:  true,
  notifyLeaderboard: true,
  favouriteTeam:    '',
};

// Load cached prefs from localStorage (fast initial paint, no flash)
function loadCachedPrefs() {
  try {
    const cached = JSON.parse(localStorage.getItem('wc2026_prefs') || '{}');
    // Migrate legacy theme key if needed
    if (!cached.theme) {
      const legacyTheme = localStorage.getItem('wc2026_theme');
      if (legacyTheme) cached.theme = legacyTheme;
    }
    return { ...DEFAULT_PREFS, ...cached };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

// Write prefs to localStorage cache (write-through on every save)
function cachePrefs(prefs) {
  try {
    localStorage.setItem('wc2026_prefs', JSON.stringify(prefs));
    // Keep legacy theme key in sync for any code still reading it
    if (prefs.theme) localStorage.setItem('wc2026_theme', prefs.theme);
  } catch {}
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  // ── User preferences (source of truth = Supabase, cached in localStorage) ──
  const [userPrefs, setUserPrefs] = useState(loadCachedPrefs);

  // Derived helpers — used throughout the app
  const theme      = userPrefs.theme      || 'dark';
  const oddsFormat = userPrefs.oddsFormat || 'fractional';

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [theme]);

  // Save a single preference key → value to Supabase + localStorage cache
  function handlePrefChange(key, value) {
    // Optimistic UI update
    setUserPrefs(prev => {
      const next = { ...prev, [key]: value };
      cachePrefs(next);
      return next;
    });

    // Persist to Supabase (fire-and-forget — optimistic update already applied)
    const userId = session?.user?.id;
    if (!userId) return;

    supabase
      .from('user_preferences')
      .upsert(
        { user_id: userId, key, value: String(value), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      )
      .then(({ error }) => {
        if (error) console.error('[prefs] Save failed:', error.message);
      });
  }

  function toggleTheme() {
    handlePrefChange('theme', theme === 'dark' ? 'light' : 'dark');
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [session,    setSession]    = useState(undefined);
  const [profile,    setProfile]    = useState(undefined);
  const [recovering, setRecovering] = useState(false);
  const [predictions,  setPredictions]  = useState({});
  const [fixtureOdds,  setFixtureOdds]  = useState({});
  const navigate_    = useNavigate();
  const location     = useLocation();

  // Derive the active tab from the URL path segment
  const VALID_TABS = ['predictions', 'results', 'leaderboard', 'league', 'rules', 'admin', 'preferences', 'settings'];
  const pathSeg    = location.pathname.split('/')[1] || '';
  const is404      = pathSeg !== '' && !VALID_TABS.includes(pathSeg);
  const activeTab  = VALID_TABS.includes(pathSeg) ? pathSeg : 'predictions';
  function setActiveTab(tab) { navigate_('/' + tab); }

  const [authView, setAuthView] = useState('landing');
  const [authMode, setAuthMode] = useState('signin');
  const [predView, setPredView]             = useState('group');
  const [unpredictedOnly, setUnpredictedOnly] = useState(false);

  const [overrides] = useLocalStorage('wc2026_fixture_overrides', {});
  const syncTimer        = useRef(null);
  // Only true when the user deliberately clicks Sign Out.
  // Prevents Supabase's tab-switch SIGNED_OUT events from wiping the UI.
  const explicitSignOut  = useRef(false);

  const fixtures = useMemo(
    () => FIXTURES.map(f => ({ ...f, ...(overrides[f.id] || {}) })),
    [overrides]
  );

  // ── Auth listener ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Supabase fires SIGNED_OUT on tab-switch token-refresh cycles.
          // Only clear the UI when the user deliberately signed out.
          if (!explicitSignOut.current) return;
          explicitSignOut.current = false;
        }
        setSession(session ?? null);
        if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Load profile, predictions & preferences when session is established ─────
  useEffect(() => {
    if (session === undefined) return;

    if (!session) {
      setProfile(null);
      setPredictions({});
      return;
    }

    async function loadUserData() {
      // 1. Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      setProfile(profileData ?? null);
      if (profileData?.is_admin) navigate_('/admin', { replace: true });

      if (profileData) {
        // 2. Predictions
        const { data: predRows } = await supabase
          .from('predictions')
          .select('fixture_id, home_score, away_score, scorer')
          .eq('user_id', session.user.id);

        const predMap = {};
        predRows?.forEach(p => {
          predMap[p.fixture_id] = {
            home:   p.home_score,
            away:   p.away_score,
            scorer: p.scorer,
          };
        });
        setPredictions(predMap);

        // 3. Preferences — load from DB and merge over the cached defaults
        const { data: prefRows } = await supabase
          .from('user_preferences')
          .select('key, value')
          .eq('user_id', session.user.id);

        if (prefRows?.length > 0) {
          // User has at least some stored prefs — merge DB values over defaults.
          // Any key not yet in the DB still falls back to DEFAULT_PREFS.
          const dbPrefs = {};
          prefRows.forEach(({ key, value }) => {
            if (value === 'true')       dbPrefs[key] = true;
            else if (value === 'false') dbPrefs[key] = false;
            else                        dbPrefs[key] = value;
          });

          // If new default keys have been added since this user last logged in,
          // seed those missing keys to the DB now so they're explicit going forward.
          const storedKeys = new Set(prefRows.map(r => r.key));
          const missingRows = Object.entries(DEFAULT_PREFS)
            .filter(([key]) => !storedKeys.has(key))
            .map(([key, value]) => ({
              user_id: session.user.id,
              key,
              value: String(value),
              updated_at: new Date().toISOString(),
            }));

          if (missingRows.length > 0) {
            supabase.from('user_preferences').insert(missingRows)
              .then(({ error }) => {
                if (error) console.error('[prefs] Failed to seed missing defaults:', error.message);
              });
          }

          setUserPrefs(prev => {
            const merged = { ...prev, ...dbPrefs };
            cachePrefs(merged);
            return merged;
          });

        } else {
          // Brand-new user with no preferences stored — write all defaults to DB now.
          const defaultRows = Object.entries(DEFAULT_PREFS).map(([key, value]) => ({
            user_id:    session.user.id,
            key,
            value:      String(value),
            updated_at: new Date().toISOString(),
          }));

          supabase.from('user_preferences').insert(defaultRows)
            .then(({ error }) => {
              if (error) console.error('[prefs] Failed to seed defaults:', error.message);
              else console.log('[prefs] Default preferences seeded for new user');
            });

          // State is already initialised to DEFAULT_PREFS — nothing more to merge
        }
      }
    }

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // ── Fetch bookies odds — re-fetches on tab switch ────────────────────────────
  useEffect(() => {
    async function fetchOdds() {
      const { data: oddsRows } = await supabase
        .from('fixture_odds')
        .select('fixture_id, scorelines, scorers');

      const oddsMap = {};
      oddsRows?.forEach(row => {
        oddsMap[row.fixture_id] = {
          scorelines: row.scorelines || [],
          scorers:    row.scorers    || [],
        };
      });
      setFixtureOdds(oddsMap);
    }

    fetchOdds();
  }, [activeTab]);

  // ── Save a prediction ────────────────────────────────────────────────────────
  function handleSavePrediction(matchId, home, away, scorer = '') {
    setPredictions(prev => ({ ...prev, [matchId]: { home, away, scorer } }));

    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const userId = session?.user?.id;
      if (!userId) return;

      supabase
        .from('predictions')
        .upsert(
          {
            user_id:    userId,
            fixture_id: matchId,
            home_score: home,
            away_score: away,
            scorer,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,fixture_id' }
        )
        .then(({ error }) => {
          if (error) console.error('[predictions] Save failed:', error.message);
        });
    }, 500);
  }

  async function handleLogout() {
    clearTimeout(syncTimer.current);
    explicitSignOut.current = true; // allow the SIGNED_OUT event to clear the UI
    await supabase.auth.signOut();
    setProfile(null);
    setPredictions({});
    setAuthView('landing');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Password recovery — show reset form after user clicks the email link
  if (recovering) {
    return (
      <ResetPasswordPage onDone={() => setRecovering(false)} />
    );
  }

  // Auth not yet resolved — show a blank dark screen to prevent any flash
  if (session === undefined || (session && profile === undefined)) {
    return (
      <div className="min-h-screen bg-pitch-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/world-cup-2026-trophy.webp" alt="Loading" className="h-14 w-auto opacity-40 animate-pulse" />
          <p className="text-slate-600 text-sm font-semibold">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (is404) {
      return <ErrorPage code={404} onGoHome={() => { setAuthView('landing'); navigate_('/'); }} />;
    }
    if (authView === 'auth') {
      return (
        <AuthPage
          defaultMode={authMode}
          onBack={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onSignIn={() => { setAuthMode('signin'); setAuthView('auth'); }}
        onSignUp={() => { setAuthMode('signup'); setAuthView('auth'); }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (!profile) {
    return (
      <ProfileSetup
        session={session}
        onComplete={newProfile => {
          setProfile(newProfile);
        }}
      />
    );
  }

  // 404 — unknown path (logged-in users only; logged-out handled below)
  if (is404 && profile) {
    return <ErrorPage code={404} onGoHome={() => setActiveTab('predictions')} />;
  }

  return (
    <div className="min-h-screen bg-pitch-900">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: theme === 'light' ? {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          } : {
            background: '#0f2240',
            color: '#e2e8f0',
            border: '1px solid #1e4080',
          },
        }}
      />
      <Header
        user={profile}
        userId={session.user.id}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogoClick={() => setActiveTab('predictions')}
      />
      <BackToTop />
      <main className="max-w-5xl mx-auto px-4 pb-16">
        {activeTab === 'predictions' && (
          <>
            <CountdownTicker fixtures={fixtures} />

            <div className="flex gap-1 bg-pitch-800 border border-pitch-700 rounded-xl p-1 mb-4 mt-4">
              {[
                { id: 'group',    label: '📋 Group Stage' },
                { id: 'knockout', label: '⚔️ Knockout' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setPredView(tab.id); setUnpredictedOnly(false); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    predView === tab.id
                      ? 'bg-pitch-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {predView === 'group' && (
              <div className="lg:grid lg:grid-cols-5 lg:gap-6 lg:items-start">
                <div className="lg:col-span-3">
                  <div className="lg:hidden">
                    <NudgeBanner
                      predictions={predictions}
                      fixtures={fixtures}
                      onShowUnpredicted={() => {
                        setPredView('group');
                        setUnpredictedOnly(true);
                      }}
                    />
                  </div>
                  <FixtureList
                    fixtures={fixtures}
                    predictions={predictions}
                    onSavePrediction={handleSavePrediction}
                    fixtureOdds={fixtureOdds}
                    oddsFormat={oddsFormat}
                    unpredictedOnly={unpredictedOnly}
                  />
                </div>

                <aside className="hidden lg:flex flex-col gap-3 lg:col-span-2 sticky top-28 self-start">
                  <ScoringGuide sidebar />
                  <NudgeBanner
                    predictions={predictions}
                    fixtures={fixtures}
                    onShowUnpredicted={() => {
                      setPredView('group');
                      setUnpredictedOnly(true);
                    }}
                  />
                </aside>
              </div>
            )}

            {predView === 'knockout' && <KnockoutBracket />}
          </>
        )}
        {activeTab === 'results' && (
          <>
            <PersonalStats user={profile} predictions={predictions} fixtures={fixtures} />
            <MyResults predictions={predictions} />
          </>
        )}
        {activeTab === 'league'      && <LeagueManager user={profile} predictions={predictions} userEmail={session.user.email} />}
        {activeTab === 'rules'       && <RulesPage />}
        {activeTab === 'leaderboard' && <Leaderboard user={profile} />}
        {activeTab === 'admin'       && (profile.is_admin ? <AdminPage /> : <ErrorPage code={403} onGoHome={() => setActiveTab('predictions')} />)}
        {activeTab === 'preferences' && (
          <PreferencesPage
            prefs={userPrefs}
            onPrefChange={handlePrefChange}
            onToggleTheme={toggleTheme}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            user={profile}
            session={session}
            onProfileUpdate={setProfile}
            onLogout={handleLogout}
          />
        )}
      </main>
      <Analytics />
    </div>
  );
}
