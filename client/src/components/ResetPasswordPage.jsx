import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const inputClass =
  'w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white ' +
  'placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors';

export default function ResetPasswordPage({ onDone }) {
  const [password,  setPassword]  = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPw)    { setError("Passwords don't match."); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }
    toast.success('Password updated! You are now signed in.');
    onDone?.();
  }

  return (
    <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500 opacity-[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src="/world-cup-2026-trophy.webp" alt="World Cup Trophy" className="h-16 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-black text-white">World Cup 2026</h1>
          <p className="text-gold-400 text-sm font-semibold mt-0.5">Match Predictor</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-black text-white mb-2">Set a new password</h2>
          <p className="text-slate-400 text-sm mb-6">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="new-password"
                  className={inputClass + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                  tabIndex={-1}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-slate-600 text-xs mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Confirm new password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete="new-password"
                className={inputClass}
              />
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
              {loading ? 'Saving…' : 'Set new password →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
