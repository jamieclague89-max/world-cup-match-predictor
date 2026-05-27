import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div className="bg-pitch-800 border border-pitch-700 rounded-xl overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-pitch-700 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Input({ value, onChange, type = 'text', placeholder, disabled, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-pitch-900 border rounded-lg px-3 py-2.5 text-sm text-slate-200
                  placeholder-slate-600 focus:outline-none transition-colors
                  ${disabled
                    ? 'border-pitch-700 text-slate-500 cursor-not-allowed'
                    : 'border-pitch-600 focus:border-gold-500'}`}
      {...rest}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage({ user, session, onProfileUpdate }) {
  // ── Display name ───────────────────────────────────────────────────────────
  const [displayName,  setDisplayName]  = useState(user?.name || '');
  const [nameSaving,   setNameSaving]   = useState(false);

  async function handleSaveName() {
    if (!displayName.trim()) return toast.error('Name cannot be empty');
    if (displayName.trim() === user?.name) return;

    setNameSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: displayName.trim() })
        .eq('id', session.user.id);

      if (error) throw error;

      onProfileUpdate({ ...user, name: displayName.trim() });
      toast.success('Display name updated');
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setNameSaving(false);
    }
  }

  // ── Password reset ─────────────────────────────────────────────────────────
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handlePasswordReset() {
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        session?.user?.email,
        { redirectTo: window.location.origin }
      );
      if (error) throw error;
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  const [deletePhrase, setDeletePhrase] = useState('');
  const DELETE_PHRASE = 'delete my account';
  const deleteReady = deletePhrase.toLowerCase() === DELETE_PHRASE;

  return (
    <div className="max-w-xl mx-auto pt-6 pb-16 px-2">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          🔧 Account Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account details and security.
        </p>
      </div>

      {/* ── Account info ── */}
      <Section title="Account" icon="👤">
        <Field label="Email address">
          <Input
            value={session?.user?.email || ''}
            disabled
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Your email address cannot be changed here.
          </p>
        </Field>

        <Field label="Display name">
          <div className="flex gap-2">
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your display name"
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            />
            <button
              onClick={handleSaveName}
              disabled={nameSaving || displayName.trim() === user?.name}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-pitch-700
                         disabled:text-slate-500 text-pitch-900 font-bold text-sm rounded-lg
                         transition-colors flex-shrink-0"
            >
              {nameSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            This is the name shown on the leaderboard and to your league members.
          </p>
        </Field>

        {user?.is_admin && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-gold-500/10 border border-gold-500/30 rounded-lg">
            <span className="text-sm">⚙️</span>
            <p className="text-xs text-gold-400 font-semibold">Administrator account</p>
          </div>
        )}
      </Section>

      {/* ── Security ── */}
      <Section title="Security" icon="🔒">
        <Field label="Password">
          <p className="text-sm text-slate-400 mb-3">
            We'll send a password reset link to{' '}
            <span className="text-slate-200 font-medium">
              {session?.user?.email}
            </span>
          </p>
          {resetSent ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span>✅</span>
              <p className="text-sm text-green-400 font-medium">
                Reset email sent — check your inbox.
              </p>
            </div>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="px-4 py-2.5 border border-pitch-600 hover:border-pitch-500
                         text-sm text-slate-300 hover:text-white rounded-lg
                         transition-colors disabled:opacity-50"
            >
              {resetLoading ? 'Sending…' : 'Send password reset email'}
            </button>
          )}
        </Field>
      </Section>

      {/* ── Sessions ── */}
      <Section title="Active Session" icon="🖥️">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-slate-200 font-medium">Current device</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Signed in as{' '}
              <span className="text-slate-300">{session?.user?.email}</span>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Session started: {session?.user?.last_sign_in_at
                ? new Date(session.user.last_sign_in_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : 'Unknown'}
            </p>
          </div>
          <span className="mt-0.5 px-2 py-0.5 bg-green-500/15 border border-green-500/30 rounded-full text-xs text-green-400 font-semibold flex-shrink-0">
            Active
          </span>
        </div>
      </Section>

      {/* ── Danger zone ── */}
      <div className="bg-red-950/30 border border-red-800/50 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-red-800/40 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h2>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-slate-300 mb-1">Delete account</p>
          <p className="text-xs text-slate-500 mb-4">
            Permanently delete your account and all predictions. This cannot be undone.
            Your league memberships and leaderboard entries will also be removed.
          </p>
          <Field label={`Type "${DELETE_PHRASE}" to confirm`}>
            <Input
              value={deletePhrase}
              onChange={e => setDeletePhrase(e.target.value)}
              placeholder={DELETE_PHRASE}
            />
          </Field>
          <button
            disabled={!deleteReady}
            onClick={() => toast.error('Please contact support to delete your account.')}
            className="mt-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-600 disabled:bg-pitch-700
                       disabled:text-slate-500 text-white font-bold text-sm rounded-lg
                       transition-colors"
          >
            Delete my account permanently
          </button>
        </div>
      </div>
    </div>
  );
}
