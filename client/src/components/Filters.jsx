import { GROUPS } from '../data/wc2026';

export default function Filters({ filterGroup, filterRound, setFilterGroup, setFilterRound }) {
  const groups = Object.keys(GROUPS);

  return (
    <div className="flex flex-wrap gap-2 py-4">
      {/* Group filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterGroup('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filterGroup === 'all' ? 'bg-gold-500 text-pitch-900' : 'bg-pitch-700 text-slate-300 hover:bg-pitch-600'
          }`}
        >
          All Groups
        </button>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filterGroup === g
                ? `group-badge-${g} text-white`
                : 'bg-pitch-700 text-slate-300 hover:bg-pitch-600'
            }`}
          >
            Group {g}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px bg-pitch-600 mx-1 hidden sm:block" />

      {/* Round filter */}
      <div className="flex gap-1.5">
        {['all', '1', '2', '3'].map(r => (
          <button
            key={r}
            onClick={() => setFilterRound(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filterRound === r ? 'bg-gold-500 text-pitch-900' : 'bg-pitch-700 text-slate-300 hover:bg-pitch-600'
            }`}
          >
            {r === 'all' ? 'All Rounds' : `Round ${r}`}
          </button>
        ))}
      </div>
    </div>
  );
}
