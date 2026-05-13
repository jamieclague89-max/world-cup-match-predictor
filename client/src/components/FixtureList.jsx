import { useState, useMemo } from 'react';
import Filters from './Filters';
import FixtureCard from './FixtureCard';

export default function FixtureList({ fixtures, predictions, onSavePrediction }) {
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterRound, setFilterRound] = useState('all');

  const filtered = useMemo(() => {
    return fixtures.filter(f => {
      if (filterGroup !== 'all' && f.group !== filterGroup) return false;
      if (filterRound !== 'all' && f.round !== parseInt(filterRound)) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));
  }, [fixtures, filterGroup, filterRound]);

  // Group by date for display
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(f => {
      if (!map[f.date]) map[f.date] = [];
      map[f.date].push(f);
    });
    return map;
  }, [filtered]);

  const total = fixtures.length;
  const predicted = fixtures.filter(f => {
    const p = predictions[f.id];
    return p && (p.home !== '' || p.away !== '');
  }).length;

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mt-6 mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Your predictions</span>
          <span className="font-semibold text-gold-400">{predicted}/{total} matches</span>
        </div>
        <div className="h-1.5 bg-pitch-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-500"
            style={{ width: `${(predicted / total) * 100}%` }}
          />
        </div>
      </div>

      <Filters
        filterGroup={filterGroup}
        filterRound={filterRound}
        setFilterGroup={setFilterGroup}
        setFilterRound={setFilterRound}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No fixtures match this filter</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).map(([date, fixtures]) => {
            const label = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            });
            return (
              <section key={date}>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <span className="flex-1 h-px bg-pitch-700" />
                  {label}
                  <span className="flex-1 h-px bg-pitch-700" />
                </h3>
                <div className="space-y-3">
                  {fixtures.map(f => (
                    <FixtureCard
                      key={f.id}
                      fixture={f}
                      prediction={predictions[f.id]}
                      onSavePrediction={onSavePrediction}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
