import { useState, useMemo } from 'react';
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

  const fixtures = useMemo(
    () => FIXTURES.map(f => ({ ...f, ...(overrides[f.id] || {}) })),
    [overrides]
  );

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
        {activeTab === 'leaderboard' && <Leaderboard user={user} predictions={predictions} />}
        {activeTab === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}
