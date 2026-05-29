import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FIXTURES } from '../data/wc2026';

const ALL_TEAMS = [...new Set(
  FIXTURES.flatMap(f => [f.homeTeam, f.awayTeam])
)].sort();

const inputClass =
  'w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white ' +
  'placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors';

export default function ProfileSetup({ session, onComplete }) {
  // Pre-fill name from Google account if available
  const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
  const [name, setName] = useState(googleName.split(' ')[0] || '');
  const [favouriteTeam, setFavouriteTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Avatar preview — initials from whatever the user has typed
  const initials = name.trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter a display name.'); return; }

    setLoading(true);

    const { data, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: session.user.id, name: name.trim() })
      .select()
      .single();

    if (insertError) {
      // Handle duplicate key — profile somehow already exists (edge case)
      if (insertError.code === '23505') {
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (existing) { onComplete(existing); return; }
      }
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Save favourite team preference if selected
    if (favouriteTeam) {
      await supabase
        .from('user_preferences')
        .upsert(
          { user_id: session.user.id, key: 'favouriteTeam', value: favouriteTeam, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,key' }
        );
    }

    // Send welcome email + notification now that we have the display name
    fetch('/api/welcome', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email: session.user.email, name: name.trim() }),
    }).catch(() => {});

    onComplete(data);
  }

  return (
    <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500 opacity-[0.04] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 opacity-[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Avatar preview */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gold-500/20 border-2 border-gold-500/40 flex items-center justify-center text-2xl font-black text-gold-400 mx-auto mb-5 transition-all">
            {initials}
          </div>
          <h2 className="text-2xl font-black text-white">One last step</h2>
          <p className="text-slate-400 text-sm mt-1.5">
            Choose a display name before you start predicting
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Jamie"
                autoFocus
                autoComplete="given-name"
                className={inputClass}
              />
              <p className="text-slate-600 text-xs mt-1.5">
                This name appears on the leaderboard — make it memorable!
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Favourite Team <span className="text-slate-600 normal-case font-normal">(optional)</span>
              </label>
              <select
                value={favouriteTeam}
                onChange={e => setFavouriteTeam(e.target.value)}
                className={inputClass}
              >
                <option value="">— Select your team —</option>
                {ALL_TEAMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-slate-600 text-xs mt-1.5">
                You can change this at any time in Preferences.
              </p>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up…' : 'Start predicting →'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Signed in as {session.user.email}
        </p>
      </div>
    </div>
  );
}
