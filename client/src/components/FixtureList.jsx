import { useState, useMemo, useEffect } from 'react';
import Filters from './Filters';
import FixtureCard from './FixtureCard';
import ScoringGuide from './ScoringGuide';
import { isKickoffPassed } from '../utils/fixtures';

export default function FixtureList({ fixtures, predictions, onSavePrediction, fixtureOdds = {}, oddsFormat = 'fractional', unpredictedOnly: unpredictedOnlyProp = false }) {
  const [filterGroup, setFilterGroup]       = useState('all');
  const [filterRound, setFilterRound]       = useState('all');
  const [unpredictedOnly, setUnpredictedOnly] = useState(false);

  // Sync external prop (e.g. triggered by NudgeBanner)
  useEffect(() => {
    if (unpredictedOnlyProp) setUnpredictedOnly(true);
  }, [unpredictedOnlyProp]);

  const filtered = useMemo(() => {
    return fixtures.filter(f => {
      if (filterGroup !== 'all' && f.group !== filterGroup) return false;
      if (filterRound !== 'all' && f.round !== parseInt(filterRound)) return false;
      if (unpredictedOnly) {
        const locked = isKickoffPassed(f.date, f.kickoff);
        if (locked) return false; // locked = can't predict, skip
        const p = predictions[f.id];
        if (p && (p.home !== '' || p.away !== '')) return false; // already predicted
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));
  }, [fixtures, filterGroup, filterRound, unpredictedOnly, predictions]);

  // Group by date for display
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(f => {
      if (!map[f.date]) map[f.date] = [];
      map[f.date].push(f);
    });
    return map;
  }, [filtered]);

  return (
    <div className="animate-fade-in">
      {/* Scoring guide — mobile only; sidebar shows it on desktop */}
      <div className="lg:hidden">
        <ScoringGuide />
      </div>

      <div className="flex flex-wrap items-center gap-2 py-3">
        <Filters
          filterGroup={filterGroup}
          filterRound={filterRound}
          setFilterGroup={setFilterGroup}
          setFilterRound={setFilterRound}
        />

        {/* Unpredicted-only toggle */}
        <button
          onClick={() => setUnpredictedOnly(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
            unpredictedOnly
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              : 'bg-pitch-800 border-pitch-600 text-slate-400 hover:text-slate-200 hover:border-pitch-500'
          }`}
        >
          {unpredictedOnly ? '✕ Clear' : '⚡ Needs prediction'}
        </button>
      </div>

      {filtered.length === 0 && unpredictedOnly ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-semibold text-slate-400">All upcoming matches predicted!</p>
          <p className="text-sm mt-1">You're fully up to date — nothing left to fill in.</p>
          <button
            onClick={() => setUnpredictedOnly(false)}
            className="mt-4 text-sm text-gold-400 hover:text-gold-300 underline underline-offset-2"
          >
            Show all fixtures
          </button>
        </div>
      ) : filtered.length === 0 ? (
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
                      odds={fixtureOdds[f.id]}
                      oddsFormat={oddsFormat}
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
