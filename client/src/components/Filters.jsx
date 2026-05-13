import { GROUPS } from '../data/wc2026';

const selectClass =
  'bg-pitch-800 border-2 border-pitch-600 rounded-lg px-3 py-2 text-sm text-white ' +
  'focus:border-gold-400 focus:outline-none transition-colors cursor-pointer ' +
  'hover:border-pitch-500 appearance-none pr-8';

export default function Filters({ filterGroup, filterRound, setFilterGroup, setFilterRound }) {
  const groups = Object.keys(GROUPS);
  const hasFilter = filterGroup !== 'all' || filterRound !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      {/* Group dropdown */}
      <div className="relative">
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className={`${selectClass} ${filterGroup !== 'all' ? 'border-gold-500 text-gold-400' : ''}`}
        >
          <option value="all">All Groups</option>
          {groups.map(g => (
            <option key={g} value={g}>Group {g}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
      </div>

      {/* Round dropdown */}
      <div className="relative">
        <select
          value={filterRound}
          onChange={e => setFilterRound(e.target.value)}
          className={`${selectClass} ${filterRound !== 'all' ? 'border-gold-500 text-gold-400' : ''}`}
        >
          <option value="all">All Rounds</option>
          <option value="1">Round 1</option>
          <option value="2">Round 2</option>
          <option value="3">Round 3</option>
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
      </div>

      {/* Clear filters */}
      {hasFilter && (
        <button
          onClick={() => { setFilterGroup('all'); setFilterRound('all'); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
