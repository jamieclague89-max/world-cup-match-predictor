import { useState } from 'react';
import { supabase } from '../lib/supabase';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const inputClass =
  'w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white ' +
  'placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors';

export default function AuthPage({ defaultMode = 'signin', onBack }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function clearError() { setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password)     { setError('Please enter a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    if (mode === 'signup') {
      if (password !== confirmPw) { setError("Passwords don't match."); return; }

      setLoading(true);
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);

      if (err) { setError(err.message); return; }
      setEmailSent(true);
    } else {
      setLoading(true);
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);

      if (err) {
        // Make common errors more user-friendly
        if (err.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password. Please try again.');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox.');
        } else {
          setError(err.message);
        }
      }
      // On success: onAuthStateChange in App.jsx handles the session automatically
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setResetSent(true);
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // If there's an immediate error (e.g. provider not configured)
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
    // Otherwise the page will redirect to Google — no need to setLoading(false)
  }

  // ── Forgot password: reset link sent screen ───────────────────────────────
  if (resetSent) {
    return (
      <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center animate-fade-in">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-black text-white mb-3">Check your inbox</h2>
          <p className="text-slate-400 leading-relaxed mb-2">We sent a password reset link to</p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <p className="text-slate-400 text-sm mb-8">
            Click the link in that email to set a new password. The link expires in 1 hour.
          </p>
          <button onClick={onBack} className="btn-primary w-full py-3 mb-3">Back to home</button>
          <p className="text-slate-600 text-xs">
            Didn't receive it? Check your spam folder, or{' '}
            <button className="text-gold-400 hover:underline" onClick={() => { setResetSent(false); setError(''); }}>
              try again
            </button>.
          </p>
        </div>
      </div>
    );
  }

  // ── Forgot password form ───────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500 opacity-[0.03] rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md animate-fade-in">
          <button
            onClick={() => { setMode('signin'); setError(''); }}
            className="text-slate-500 hover:text-slate-300 text-sm mb-6 flex items-center gap-1.5 transition-colors"
          >
            ← Back to sign in
          </button>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-2xl font-black text-white">World Cup 2026</h1>
            <p className="text-gold-400 text-sm font-semibold mt-0.5">Match Predictor</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-black text-white mb-2">Forgot your password?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoFocus
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
                className="btn-primary w-full py-3 font-bold disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Email sent / verify screen ─────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center animate-fade-in">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-black text-white mb-3">Check your inbox</h2>
          <p className="text-slate-400 leading-relaxed mb-2">
            We sent a confirmation link to
          </p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <p className="text-slate-400 text-sm mb-8">
            Click the link in that email to activate your account. Once confirmed you can sign in and start predicting.
          </p>
          <button onClick={onBack} className="btn-primary w-full py-3 mb-3">
            Back to home
          </button>
          <p className="text-slate-600 text-xs">
            Didn't receive it? Check your spam folder, or{' '}
            <button
              className="text-gold-400 hover:underline"
              onClick={() => { setEmailSent(false); setPassword(''); setConfirmPw(''); }}
            >
              try again
            </button>.
          </p>
        </div>
      </div>
    );
  }

  // ── Main auth form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500 opacity-[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Back link */}
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-300 text-sm mb-6 flex items-center gap-1.5 transition-colors"
        >
          ← Back to home
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-black text-white">World Cup 2026</h1>
          <p className="text-gold-400 text-sm font-semibold mt-0.5">Match Predictor</p>
        </div>

        <div className="card">
          {/* Mode tabs */}
          <div className="flex mb-6 bg-pitch-900 rounded-lg p-1 gap-1">
            {[
              { id: 'signin', label: 'Sign in' },
              { id: 'signup', label: 'Create account' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id); clearError(); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                  mode === tab.id
                    ? 'bg-pitch-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className={inputClass + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-slate-600 text-xs mt-1">Minimum 6 characters</p>
              )}
            </div>

            {/* Confirm password — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Confirm password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            {/* Forgot password link — sign in only */}
            {mode === 'signin' && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); }}
                  className="text-xs text-slate-500 hover:text-gold-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? '…'
                : mode === 'signup'
                ? 'Create account →'
                : 'Sign in →'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pitch-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-pitch-800 px-3 text-slate-500 text-xs">or continue with</span>
            </div>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-pitch-600 rounded-lg text-white hover:bg-pitch-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="text-sm">Redirecting…</span>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Mode toggle hint */}
        <p className="text-center text-slate-500 text-sm mt-5">
          {mode === 'signin' ? (
            <>No account?{' '}
              <button onClick={() => { setMode('signup'); clearError(); }} className="text-gold-400 hover:underline">
                Sign up free →
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('signin'); clearError(); }} className="text-gold-400 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
