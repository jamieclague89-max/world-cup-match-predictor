import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { FIXTURES } from './data/wc2026';
import UserSetup from './components/UserSetup';
import Header from './components/Header';
import FixtureList from './components/FixtureList';
import KnockoutBracket from './components/KnockoutBracket';
import LeagueManager from './components/LeagueManager';
import AdminPage from './components/AdminPage';
import RulesPage from './components/RulesPage';
import Leaderboard from './components/Leaderboard';

export default function App() {
  const [user, setUser] = useLocalStorage('wc2026_user', null);
  const [predictions, setPredictions] = useLocalStorage('wc2026_predictions', {});
  const [overrides] = useLocalStorage('wc2026_fixture_overrides', {});
  const [activeTab, setActiveTab] = useState('predictions');
  const syncTimer = useRef(null);

  const fixtures = useMemo(
    () => FIXTURES.map(f => ({ ...f, ...(overrides[f.id] || {}) })),
    [overrides]
  );

  // Whenever predictions change, push them to the server after a short delay.
  // This ensures the server always has up-to-date picks for everyone,
  // so the leaderboard can be scored correctly without any manual action.
  useEffect(() => {
    if (!user) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, country: user.country, predictions }),
      }).catch(() => {
        // Silently ignore — predictions are safe in localStorage
        // and will sync next time the user makes a change or reloads
      });
    }, 2000);

    return () => clearTimeout(syncTimer.current);
  }, [predictions, user]);

  // Also push on first load so returning users are always registered
  useEffect(() => {
    if (!user) return;
    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name, country: user.country, predictions }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name]); // only re-run if the user identity changes

  function handleSavePrediction(matchId, home, away, scorer = '') {
    setPredictions(prev => ({ ...prev, [matchId]: { home, away, scorer } }));
  }

  if (!user) {
    return <UserSetup onComplete={setUser} />;
  }

  return (
    <div className="min-h-screen bg-pitch-900">
      <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setUser(null)} />
      <main className="max-w-5xl mx-auto px-4 pb-16">
        {activeTab === 'predictions' && (
          <FixtureList fixtures={fixtures} predictions={predictions} onSavePrediction={handleSavePrediction} />
        )}
        {activeTab === 'knockout' && <KnockoutBracket />}
        {activeTab === 'league' && <LeagueManager user={user} predictions={predictions} />}
        {activeTab === 'rules' && <RulesPage />}
        {activeTab === 'leaderboard' && <Leaderboard user={user} />}
        {activeTab === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}
