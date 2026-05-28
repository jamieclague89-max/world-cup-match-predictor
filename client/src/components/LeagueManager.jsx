import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HeadToHead from './HeadToHead';

const API = '/api';

async function apiFetch(path, options) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const MEDALS = ['🥇', '🥈', '🥉'];

// ── League share sheet ────────────────────────────────────────────────────────
function ShareSheet({ code, leagueName }) {
  const [copied, setCopied] = useState(false);

  const appUrl  = typeof window !== 'undefined' ? window.location.origin : 'https://playworldcup26.com';
  const message = `Join my World Cup 2026 Predictor league! ⚽🏆\n\nLeague: ${leagueName}\nCode: ${code}\n\nSign up & play free at ${appUrl}`;
  const msgEnc  = encodeURIComponent(message);
  const urlEnc  = encodeURIComponent(appUrl);

  const platforms = [
    {
      label: 'WhatsApp',
      bg:    'bg-[#25D366] hover:bg-[#20BD5A]',
      icon:  (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.856L.057 23.885a.5.5 0 0 0 .612.612l6.098-1.493A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.9 9.9 0 0 1-5.031-1.371l-.36-.214-3.733.914.944-3.641-.235-.374A9.862 9.862 0 0 1 2.1 12C2.1 6.532 6.532 2.1 12 2.1S21.9 6.532 21.9 12 17.468 21.9 12 21.9z"/>
        </svg>
      ),
      href: `https://wa.me/?text=${msgEnc}`,
    },
    {
      label: 'Email',
      bg:    'bg-blue-600 hover:bg-blue-500',
      icon:  (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      href: `mailto:?subject=${encodeURIComponent(`Join ${leagueName} — World Cup 2026 Predictor`)}&body=${msgEnc}`,
    },
    {
      label: 'Telegram',
      bg:    'bg-[#2AABEE] hover:bg-[#229ED9]',
      icon:  (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      href: `https://t.me/share/url?url=${urlEnc}&text=${encodeURIComponent(`Join my World Cup 2026 Predictor league!\n\nLeague: ${leagueName} · Code: ${code}`)}`,
    },
    {
      label: 'X',
      bg:    'bg-black hover:bg-neutral-800 border border-neutral-700',
      icon:  (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.631 5.903-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join my World Cup 2026 Predictor league! ⚽🏆\nLeague: ${leagueName} · Code: ${code}\n${appUrl}`)}`,
    },
    {
      label: 'SMS',
      bg:    'bg-green-700 hover:bg-green-600',
      icon:  (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
        </svg>
      ),
      href: `sms:?body=${msgEnc}`,
    },
  ];

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Code copied!');
    });
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: `Join ${leagueName} — World Cup 2026 Predictor`, text: message, url: appUrl });
    } catch { /* dismissed or unsupported */ }
  }

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Share with friends</p>
      <div className="flex flex-wrap gap-2">
        {supportsNativeShare && (
          <button
            onClick={nativeShare}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg
                       bg-gold-500 text-pitch-900 hover:bg-gold-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            Share
          </button>
        )}
        {platforms.map(({ label, bg, icon, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white transition-colors ${bg}`}
          >
            {icon} <span>{label}</span>
          </a>
        ))}
        <button
          onClick={copyCode}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border
            ${copied
              ? 'bg-green-500/20 border-green-500/40 text-green-400'
              : 'bg-pitch-700 border-pitch-600 text-slate-300 hover:bg-pitch-600'
            }`}
        >
          {copied
            ? <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          }
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
    </div>
  );
}

// ── Jules Rimet Jackpot promo tile ───────────────────────────────────────────
function JulesRimetTile({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-2xl border border-gold-500/40 overflow-hidden
                 bg-gradient-to-br from-gold-500/10 via-pitch-800 to-pitch-900
                 hover:border-gold-500/70 hover:from-gold-500/15 transition-all group"
    >
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">🏆</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white font-black text-base group-hover:text-gold-400 transition-colors">
              Jules Rimet Jackpot
            </span>
            <span className="text-xs font-bold text-gold-400 bg-gold-500/15 border border-gold-500/30
                             rounded-full px-2 py-0.5 flex-shrink-0">
              Paid
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            Winner-takes-all premium league — open to all
          </p>
        </div>
        <span className="text-gold-400 text-xl flex-shrink-0 group-hover:translate-x-0.5 transition-transform">›</span>
      </div>
    </button>
  );
}

// ── Standings table ───────────────────────────────────────────────────────────
function StandingsTable({ standings, currentUser, isOwner, onSelectOpponent, onRemoveMember }) {
  if (standings.length === 0) {
    return (
      <p className="text-slate-400 text-center py-8 text-sm">
        No results yet — standings will appear once match results are recorded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-pitch-600">
            <th className="text-left py-2 pr-3 w-10">Rank</th>
            <th className="text-left py-2 pr-3">Player</th>
            <th className="text-right py-2 pr-3 hidden sm:table-cell">
              <span className="text-gold-400">Exact</span>
            </th>
            <th className="text-right py-2 pr-3 hidden sm:table-cell">Result</th>
            <th className="text-right py-2 font-bold text-gold-400">Pts</th>
            {isOwner && <th className="w-8" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-pitch-700/50">
          {standings.map((s, i) => {
            const isMe = currentUser && s.name.toLowerCase() === currentUser.name.toLowerCase();
            return (
              <tr
                key={s.name}
                onClick={() => !isMe && onSelectOpponent(s)}
                className={`transition-colors ${
                  isMe
                    ? 'bg-gold-500/5 border-l-2 border-gold-500'
                    : 'hover:bg-pitch-700/30 cursor-pointer'
                }`}
              >
                <td className="py-3 pr-3">
                  {i < 3
                    ? <span className="text-xl">{MEDALS[i]}</span>
                    : <span className="text-slate-400 font-bold text-sm">#{i + 1}</span>
                  }
                </td>
                <td className="py-3 pr-3">
                  <span className={`font-semibold ${isMe ? 'text-gold-400' : 'text-white'}`}>
                    {s.name}
                    {isMe && <span className="text-xs text-gold-600 ml-1.5">(you)</span>}
                  </span>
                  {!isMe && (
                    <span className="text-slate-600 text-xs ml-2 hidden sm:inline">vs you →</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-right text-gold-400 font-bold hidden sm:table-cell">{s.exact}</td>
                <td className="py-3 pr-3 text-right text-slate-300 hidden sm:table-cell">{s.correct}</td>
                <td className="py-3 text-right font-black text-gold-400 text-base">{s.points}</td>
                {isOwner && (
                  <td className="py-3 pl-2 text-right" onClick={e => e.stopPropagation()}>
                    {!isMe && (
                      <button
                        onClick={() => onRemoveMember(s.userId, s.name)}
                        className="text-slate-600 hover:text-red-400 transition-colors text-xs px-1.5 py-1 rounded"
                        title={`Remove ${s.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-slate-600 text-xs text-center mt-3 pb-1">
        Tap any player to see a head-to-head comparison
        {isOwner && <span className="ml-1">· ✕ to remove a member</span>}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LeagueManager({ user, predictions, userEmail }) {
  // Array of leagues the user belongs to: [{ code, name, createdBy? }]
  const [savedLeagues, setSavedLeagues] = useLocalStorage('wc2026_leagues', []);

  // Migrate old single-league format (wc2026_league → wc2026_leagues)
  useEffect(() => {
    const old = localStorage.getItem('wc2026_league');
    if (!old) return;
    try {
      const parsed = JSON.parse(old);
      if (parsed?.code) {
        setSavedLeagues(prev =>
          prev.some(l => l.code === parsed.code)
            ? prev
            : [...prev, { code: parsed.code, name: parsed.name }]
        );
      }
    } catch {}
    localStorage.removeItem('wc2026_league');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate    = useNavigate();
  const location    = useLocation();

  // Derive view and activeCode from URL path
  // /league → list
  // /league/create → create
  // /league/join → join
  // /league/jules-rimet → jules-rimet
  // /league/:code → home
  // /league/:code/standings → standings
  // /league/:code/h2h → h2h
  const SPECIAL_SEGS = ['create', 'join', 'jules-rimet'];
  const subParts = location.pathname.replace(/^\/league\/?/, '').split('/').filter(Boolean);
  const activeCode = subParts[0] && !SPECIAL_SEGS.includes(subParts[0].toLowerCase())
    ? subParts[0].toUpperCase()
    : null;
  const view = subParts.length === 0              ? 'list'
    : subParts[0] === 'create'                    ? 'create'
    : subParts[0] === 'join'                      ? 'join'
    : subParts[0] === 'jules-rimet'               ? 'jules-rimet'
    : subParts[1] === 'standings'                 ? 'standings'
    : subParts[1] === 'h2h'                       ? 'h2h'
    : subParts.length === 1                       ? 'home'
    : 'home';

  // Opponent for H2H — encoded in URL search params
  const searchParams = new URLSearchParams(location.search);
  const opponent = view === 'h2h' && searchParams.get('userId')
    ? { userId: searchParams.get('userId'), name: decodeURIComponent(searchParams.get('name') || 'Opponent') }
    : null;

  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode]     = useState('');
  const [standings, setStandings]   = useState(null);
  const [leagueInfo, setLeagueInfo] = useState(null); // server-side league metadata (includes created_by)
  const [loading, setLoading]       = useState(false);

  // Jules Rimet Jackpot enquiry state
  const [jrLoading, setJrLoading]     = useState(false);
  const [jrSubmitted, setJrSubmitted] = useState(false);
  const [jrError, setJrError]         = useState('');

  const activeLeague = savedLeagues.find(l => l.code === activeCode)
    || (leagueInfo ? { code: leagueInfo.code, name: leagueInfo.name } : null);

  // Fetch league metadata (including created_by) as soon as a league is opened.
  // This resolves ownership before standings are ever loaded.
  useEffect(() => {
    if (!activeCode) return;
    apiFetch(`/leagues/${activeCode}`)
      .then(data => {
        setLeagueInfo(data.league);
        // Persist createdBy into savedLeagues so it survives page refreshes
        setSavedLeagues(prev => prev.map(l =>
          l.code === activeCode
            ? { ...l, createdBy: data.league.created_by }
            : l
        ));
      })
      .catch(() => {}); // fail silently — isOwner just stays false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode]);

  // Auto-load standings when navigating directly to the standings URL
  useEffect(() => {
    if (view === 'standings' && activeCode && !standings) {
      loadStandings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activeCode]);

  // Is the current user the creator of the active league?
  const isOwner = !!(
    leagueInfo?.created_by === user.id ||
    activeLeague?.createdBy === user.id
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function addLeague({ code, name, createdBy }) {
    setSavedLeagues(prev =>
      prev.some(l => l.code === code)
        ? prev.map(l => l.code === code ? { ...l, name, createdBy } : l)
        : [...prev, { code, name, createdBy }]
    );
  }

  function purgeLeague(code) {
    setSavedLeagues(prev => prev.filter(l => l.code !== code));
    if (activeCode === code) {
      setStandings(null);
      setLeagueInfo(null);
      navigate('/league');
    }
  }

  function openLeague(code) {
    setStandings(null);
    setLeagueInfo(null);
    navigate('/league/' + code);
  }

  // ── Create league ────────────────────────────────────────────────────────────
  async function createLeague() {
    if (!leagueName.trim()) { toast.error('Enter a league name'); return; }
    setLoading(true);
    try {
      const data = await apiFetch('/leagues', {
        method: 'POST',
        body: JSON.stringify({ name: leagueName.trim(), userId: user.id }),
      });
      addLeague({ code: data.code, name: data.league.name, createdBy: user.id });
      toast.success(`League "${data.league.name}" created!`);
      setLeagueName('');
      openLeague(data.code);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Join league ──────────────────────────────────────────────────────────────
  async function joinLeague() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { toast.error('Enter a valid 6-character code'); return; }
    if (savedLeagues.some(l => l.code === code)) {
      toast.error('You\'re already in that league');
      setJoinCode('');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/leagues/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      addLeague({ code, name: data.league.name });
      toast.success(`Joined "${data.league.name}"!`);
      setJoinCode('');
      openLeague(code);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Load standings ───────────────────────────────────────────────────────────
  const loadStandings = useCallback(async () => {
    if (!activeCode) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/leagues/${activeCode}/standings`);
      setStandings(data.standings);
      setLeagueInfo(data.league); // includes created_by
      navigate(`/league/${activeCode}/standings`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeCode, navigate]);

  // ── Leave league (self-remove) ───────────────────────────────────────────────
  async function leaveLeague() {
    if (!confirm('Leave this league? You can rejoin with the invite code.')) return;
    try {
      await apiFetch(`/leagues/${activeCode}/members/${user.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: user.id }),
      });
    } catch { /* fail silently — remove locally regardless */ }
    purgeLeague(activeCode);
    toast.success('Left league');
  }

  // ── Delete league (creator only) ─────────────────────────────────────────────
  async function deleteLeague() {
    const name = activeLeague?.name || 'this league';
    if (!confirm(`Delete "${name}"? This permanently removes the league and all members. This cannot be undone.`)) return;
    setLoading(true);
    try {
      await apiFetch(`/leagues/${activeCode}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: user.id }),
      });
      purgeLeague(activeCode);
      toast.success('League deleted');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Remove member (creator only) ─────────────────────────────────────────────
  async function removeMember(memberId, memberName) {
    if (!confirm(`Remove ${memberName} from the league?`)) return;
    try {
      await apiFetch(`/leagues/${activeCode}/members/${memberId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: user.id }),
      });
      setStandings(prev => prev.filter(s => s.userId !== memberId));
      toast.success(`${memberName} removed`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  // ── Jules Rimet Jackpot enquiry submit ──────────────────────────────────────
  async function submitJulesRimetEnquiry() {
    const isResend = jrSubmitted; // already sent once — this is a resend
    setJrLoading(true);
    setJrError('');
    try {
      const res = await fetch('/api/jules-rimet/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: user.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setJrSubmitted(true);
      if (isResend) toast.success('Payment details resent — check your inbox!');
    } catch (e) {
      setJrError(e.message);
    } finally {
      setJrLoading(false);
    }
  }

  // ── Views ────────────────────────────────────────────────────────────────────

  // Jules Rimet Jackpot enquiry view
  if (view === 'jules-rimet') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button
          onClick={() => { setJrSubmitted(false); setJrError(''); navigate('/league'); }}
          className="text-slate-400 hover:text-white text-sm mb-5 block transition-colors"
        >
          ← My Leagues
        </button>

        {/* Header card */}
        <div className="rounded-2xl bg-gradient-to-br from-gold-500/20 via-pitch-800 to-pitch-900
                        border border-gold-500/40 overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-gold-600/30 to-gold-500/10 px-6 py-5 text-center border-b border-gold-500/20">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-2xl font-black text-white">Jules Rimet Jackpot</h2>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-gold-500/20 border border-gold-500/40
                            rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">Premium Paid League</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed">
              The <strong className="text-gold-400">Jules Rimet Jackpot</strong> is our exclusive premium competition —
              a winner-takes-all league where every entry fee goes straight into the prize pot.
              The player with the most points when the World Cup final whistle blows takes home the jackpot.
            </p>

            {/* How it works — hidden once request is sent to keep success state visible */}
            {!jrSubmitted && (
              <div className="bg-pitch-900/60 rounded-xl border border-pitch-700 p-4 space-y-2.5">
                <p className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3">How it works</p>
                {[
                  { icon: '💰', text: 'Pay a one-off entry fee to secure your place' },
                  { icon: '🔑', text: 'Receive a private invite code once payment is confirmed' },
                  { icon: '⚽', text: 'Predict every match to score points and climb the league table' },
                  { icon: '🏆', text: 'Highest points at the end of the tournament wins the entire prize pool' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                    <p className="text-sm text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Enquiry button or success state */}
            {jrSubmitted ? (
              <div className="space-y-4 pt-1">
                {/* Success confirmation */}
                <div className="text-center py-3">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-white font-bold text-lg mb-1">Request sent!</p>
                  <p className="text-slate-400 text-sm">
                    Payment details have been sent to <strong className="text-white">{userEmail}</strong>.
                    Check your inbox (and spam folder).
                  </p>
                </div>

                {/* Didn't receive it? */}
                <div className="border-t border-pitch-700 pt-4 space-y-2">
                  <p className="text-xs text-slate-500 text-center">Didn't receive it?</p>
                  <button
                    onClick={submitJulesRimetEnquiry}
                    disabled={jrLoading}
                    className="w-full py-2.5 px-4 rounded-xl border border-pitch-600 text-slate-300
                               hover:border-gold-500/50 hover:text-gold-400 transition-all text-sm
                               font-semibold disabled:opacity-50"
                  >
                    {jrLoading ? 'Sending…' : '↺ Resend payment details'}
                  </button>
                  <a
                    href={`mailto:jamieclague89@gmail.com?subject=${encodeURIComponent('Jules Rimet Jackpot — email not received')}&body=${encodeURIComponent(`Hi,\n\nI requested joining details for the Jules Rimet Jackpot but haven't received the email.\n\nMy account email is: ${userEmail}\nMy name is: ${user.name}\n\nCould you please send the payment details?\n\nThanks`)}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl
                               border border-pitch-600 text-slate-400 hover:border-gold-500/50
                               hover:text-gold-400 transition-all text-sm font-semibold"
                  >
                    ✉️ Contact admin for help
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {jrError && (
                  <p className="text-xs text-red-400">{jrError}</p>
                )}
                <button
                  onClick={submitJulesRimetEnquiry}
                  disabled={jrLoading}
                  className="btn-primary w-full py-3 font-bold disabled:opacity-50 text-sm"
                >
                  {jrLoading ? 'Sending…' : '📩 Request Details To Join'}
                </button>
                <p className="text-xs text-slate-600 text-center">
                  Payment details will be sent to <span className="text-slate-400">{userEmail}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // H2H view
  if (view === 'h2h' && activeCode) {
    if (!opponent) {
      // No opponent in URL — redirect back to standings
      navigate(`/league/${activeCode}/standings`, { replace: true });
      return null;
    }
    return (
      <HeadToHead
        leagueCode={activeCode}
        opponent={opponent}
        myPredictions={predictions ?? {}}
        myName={user.name}
        onBack={() => navigate(`/league/${activeCode}/standings`)}
      />
    );
  }

  // Standings view
  if (view === 'standings') {
    if (!standings) {
      return (
        <div className="animate-fade-in mt-6 text-center py-16">
          <p className="text-slate-400 text-sm">{loading ? 'Loading standings…' : 'Loading…'}</p>
        </div>
      );
    }
    return (
      <div className="animate-fade-in mt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(`/league/${activeCode}`)} className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back
          </button>
          <h2 className="text-white font-black text-xl">{activeLeague?.name}</h2>
          {isOwner && (
            <span className="text-xs bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-full px-2 py-0.5 font-semibold">
              Owner
            </span>
          )}
        </div>

        <div className="card">
          <StandingsTable
            standings={standings}
            currentUser={user}
            isOwner={isOwner}
            onSelectOpponent={s => navigate(`/league/${activeCode}/h2h?userId=${encodeURIComponent(s.userId)}&name=${encodeURIComponent(s.name)}`)}
            onRemoveMember={removeMember}
          />
        </div>

        <div className="flex gap-3 mt-3">
          <button onClick={loadStandings} disabled={loading} className="btn-secondary flex-1 py-2 text-sm">
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {/* Invite more friends */}
        <div className="card mt-4">
          <p className="text-xs text-slate-400 font-semibold mb-1">Invite more friends</p>
          <p className="font-mono text-2xl font-black text-gold-400 tracking-[0.2em] mb-2">{activeCode}</p>
          <ShareSheet code={activeCode} leagueName={activeLeague?.name || ''} />
        </div>

        <p className="text-slate-500 text-xs text-center mt-3">
          Standings update automatically as official match results are confirmed.
        </p>
      </div>
    );
  }

  // League home view (single league selected)
  if (view === 'home' && activeCode) {
    return (
      <div className="animate-fade-in mt-6 space-y-4">
        {/* Back to list */}
        <button onClick={() => navigate('/league')}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← My Leagues
        </button>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-1">
                {isOwner ? 'Your League' : 'Joined League'}
              </p>
              <h2 className="text-2xl font-black text-white">{activeLeague.name}</h2>
            </div>
            {/* Owner: delete. Member: leave. */}
            {isOwner ? (
              <button
                onClick={deleteLeague}
                disabled={loading}
                className="text-xs text-red-500 hover:text-red-400 transition-colors mt-1 disabled:opacity-50 border border-red-500/30 hover:border-red-400/50 rounded-lg px-2.5 py-1.5 font-semibold"
              >
                🗑 Delete League
              </button>
            ) : (
              <button
                onClick={leaveLeague}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1"
              >
                Leave
              </button>
            )}
          </div>

          {/* Invite code + share */}
          <div className="mt-4 bg-pitch-900 rounded-xl p-4 border border-pitch-600">
            <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Invite code</p>
            <span className="font-mono text-4xl font-black text-gold-400 tracking-[0.25em]">
              {activeLeague.code}
            </span>
            <p className="text-slate-500 text-xs mt-2">
              Friends enter this code under My League → Join League.
            </p>
            <ShareSheet code={activeLeague.code} leagueName={activeLeague.name} />
          </div>
        </div>

        <button
          onClick={loadStandings}
          disabled={loading}
          className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50"
        >
          {loading ? 'Loading…' : '🏆 View League Standings'}
        </button>

        <p className="text-slate-600 text-xs text-center">
          Standings update as official results come in — no manual sync needed.
        </p>
      </div>
    );
  }

  // Create league form
  if (view === 'create') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button onClick={() => navigate('/league')} className="text-slate-400 hover:text-white text-sm mb-4 block transition-colors">
          ← Back
        </button>
        <div className="card">
          <h2 className="text-xl font-black text-white mb-1">Create a League</h2>
          <p className="text-slate-400 text-sm mb-5">
            Give your league a name — you'll get a 6-character invite code to share
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                League Name
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createLeague()}
                placeholder="e.g. Work Mates 2026"
                maxLength={40}
                autoFocus
                className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                           placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors"
              />
            </div>
            <button onClick={createLeague} disabled={loading} className="btn-primary w-full py-3 font-bold disabled:opacity-50">
              {loading ? 'Creating…' : 'Create League →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join league form
  if (view === 'join') {
    return (
      <div className="animate-fade-in mt-6 max-w-md mx-auto">
        <button onClick={() => navigate('/league')} className="text-slate-400 hover:text-white text-sm mb-4 block transition-colors">
          ← Back
        </button>
        <div className="card">
          <h2 className="text-xl font-black text-white mb-1">Join a League</h2>
          <p className="text-slate-400 text-sm mb-5">
            Enter the 6-character invite code from your friend
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Invite Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && joinLeague()}
                placeholder="AB3X7K"
                autoFocus
                className="w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white
                           placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors
                           font-mono text-xl tracking-[0.2em] uppercase text-center"
                maxLength={6}
              />
            </div>
            <button onClick={joinLeague} disabled={loading} className="btn-primary w-full py-3 font-bold disabled:opacity-50">
              {loading ? 'Joining…' : 'Join League →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // League list view (default — shown whether user has leagues or not)
  return (
    <div className="animate-fade-in mt-6 max-w-md mx-auto">

      {savedLeagues.length === 0 ? (
        /* ── Empty state ── */
        <>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🏅</div>
            <h2 className="text-2xl font-black text-white">Mini League</h2>
            <p className="text-slate-400 text-sm mt-2">
              Create a private league and challenge your friends to beat your predictions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => navigate('/league/create')}
              className="card hover:border-gold-500/50 hover:bg-pitch-700/50 transition-all cursor-pointer text-center py-6"
            >
              <div className="text-3xl mb-2">➕</div>
              <p className="text-white font-bold">Create League</p>
              <p className="text-slate-400 text-xs mt-1">Start a new private league</p>
            </button>

            <button
              onClick={() => navigate('/league/join')}
              className="card hover:border-gold-500/50 hover:bg-pitch-700/50 transition-all cursor-pointer text-center py-6"
            >
              <div className="text-3xl mb-2">🔗</div>
              <p className="text-white font-bold">Join League</p>
              <p className="text-slate-400 text-xs mt-1">Enter an invite code</p>
            </button>
          </div>

          <JulesRimetTile onOpen={() => navigate('/league/jules-rimet')} />

          <div className="mt-4 card border-pitch-600/50">
            <h3 className="text-sm font-bold text-slate-300 mb-3">How it works</h3>
            <ul className="text-slate-400 text-xs space-y-2">
              <li>🎯 <strong className="text-slate-300">Exact scoreline</strong> — 5 pts</li>
              <li>✅ <strong className="text-slate-300">Correct result</strong> — 3 pts</li>
              <li>⚽ <strong className="text-slate-300">First goalscorer</strong> — 3 pts bonus</li>
              <li>📏 <strong className="text-slate-300">Correct score, wrong winner</strong> — 1 pt</li>
            </ul>
          </div>
        </>
      ) : (
        /* ── Leagues list ── */
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">My Leagues</h2>
            <span className="text-xs text-slate-500">{savedLeagues.length} league{savedLeagues.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3 mb-5">
            {savedLeagues.map(league => (
              <button
                key={league.code}
                onClick={() => openLeague(league.code)}
                className="card w-full text-left hover:border-gold-500/40 hover:bg-pitch-700/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold group-hover:text-gold-400 transition-colors">
                      {league.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-500 tracking-widest">{league.code}</span>
                      {league.createdBy === user.id && (
                        <span className="text-xs bg-gold-500/15 text-gold-500 border border-gold-500/25 rounded-full px-1.5 py-0 font-semibold">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-gold-400 transition-colors text-lg">›</span>
                </div>
              </button>
            ))}
          </div>

          <JulesRimetTile onOpen={() => navigate('/league/jules-rimet')} />

          {/* Always-visible create + join buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/league/create')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-pitch-600
                         text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-all text-sm font-semibold"
            >
              ➕ Create new
            </button>
            <button
              onClick={() => navigate('/league/join')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-pitch-600
                         text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-all text-sm font-semibold"
            >
              🔗 Join another
            </button>
          </div>
        </>
      )}
    </div>
  );
}
