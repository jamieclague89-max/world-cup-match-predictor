import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 50;

// ── Dedicated hook ─────────────────────────────────────────────────────────────
function useAllNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!error) setNotifications(data || []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => setNotifications(prev => [payload.new, ...prev].slice(0, PAGE_SIZE))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
  }, [userId]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllRead };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const TYPE_CONFIG = {
  result:        { icon: '🏆', label: 'Match result',   colour: 'text-gold-400',  bg: 'bg-gold-500/10'  },
  deadline:      { icon: '⏰', label: 'Deadline',        colour: 'text-amber-400', bg: 'bg-amber-500/10' },
  leaderboard:   { icon: '📊', label: 'Leaderboard',    colour: 'text-blue-400',  bg: 'bg-blue-500/10'  },
  jules_payment: { icon: '💰', label: 'Jules Rimet',    colour: 'text-green-400', bg: 'bg-green-500/10' },
};

// ── Left panel — inbox row ────────────────────────────────────────────────────
function InboxRow({ notification, selected, onClick }) {
  const cfg = TYPE_CONFIG[notification.type] || { icon: '🔔', label: 'Notification', bg: 'bg-pitch-700' };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-pitch-700 transition-colors relative
                  ${selected
                    ? 'bg-pitch-700'
                    : 'hover:bg-pitch-700/50'
                  }`}
    >
      {/* Selected indicator bar */}
      {selected && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-r" />
      )}

      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="flex-shrink-0 mt-1.5">
          <div className={`w-2 h-2 rounded-full transition-colors ${notification.read ? 'bg-transparent' : 'bg-amber-400'}`} />
        </div>

        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${cfg.bg}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p className={`text-xs font-bold truncate leading-snug
                           ${notification.read ? 'text-slate-400' : 'text-white'}`}>
              {notification.title}
            </p>
            <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
              {timeAgo(notification.created_at)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
            {notification.body}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Right panel — full detail ─────────────────────────────────────────────────
function NotificationDetail({ notification, onBack }) {
  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
        <span className="text-6xl mb-4 opacity-20">📬</span>
        <p className="text-slate-500 text-sm font-semibold">Select a notification</p>
        <p className="text-slate-600 text-xs mt-1">Click any item on the left to read it here</p>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[notification.type] || { icon: '🔔', label: 'Notification', colour: 'text-slate-400', bg: 'bg-pitch-700' };

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-pitch-700 flex-shrink-0">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="sm:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center
                     rounded-lg hover:bg-pitch-700 text-slate-400 hover:text-white transition-colors"
          aria-label="Back to inbox"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Type badge */}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5
                          rounded-full border ${cfg.colour}
                          ${notification.type === 'result'        ? 'border-gold-500/30  bg-gold-500/10'  :
                            notification.type === 'deadline'      ? 'border-amber-500/30 bg-amber-500/10' :
                            notification.type === 'leaderboard'   ? 'border-blue-500/30  bg-blue-500/10'  :
                            notification.type === 'jules_payment' ? 'border-green-500/30 bg-green-500/10' :
                            'border-pitch-600 bg-pitch-700'}`}>
          {cfg.label}
        </span>

        {/* Timestamp */}
        <span className="text-xs text-slate-500 ml-auto">{fullDate(notification.created_at)}</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${cfg.bg}`}>
            {cfg.icon}
          </div>
          <h2 className="text-white font-black text-lg leading-snug pt-1">
            {notification.title}
          </h2>
        </div>

        {/* Divider */}
        <div className="border-t border-pitch-700 mb-5" />

        {/* Full message body */}
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {notification.body}
        </p>

        {/* Read status indicator */}
        {notification.read && (
          <p className="text-slate-600 text-xs mt-8 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Read
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage({ userId }) {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } =
    useAllNotifications(userId);

  const [selectedId, setSelectedId] = useState(null);
  // On mobile: 'list' or 'detail'
  const [mobileView, setMobileView] = useState('list');

  const selectedNotification = notifications.find(n => n.id === selectedId) || null;

  function handleSelect(notification) {
    setSelectedId(notification.id);
    setMobileView('detail');
    if (!notification.read) markAsRead(notification.id);
  }

  function handleBack() {
    setMobileView('list');
  }

  return (
    <div className="animate-fade-in mt-6 max-w-5xl mx-auto">

      {/* Page title row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-black text-xl leading-none">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-slate-500 text-xs mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-slate-400 hover:text-white border border-pitch-700
                       hover:border-pitch-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Inbox shell */}
      <div className="bg-pitch-800 border border-pitch-700 rounded-xl overflow-hidden"
           style={{ minHeight: '520px' }}>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <span className="text-6xl mb-4">🔔</span>
            <p className="text-white font-bold text-lg mb-1">No notifications yet</p>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Match results, prediction deadlines, and league updates will appear here.
            </p>
          </div>
        ) : (
          <div className="flex h-full" style={{ minHeight: '520px' }}>

            {/* ── Left panel — inbox list ── */}
            <div className={`w-full sm:w-72 xl:w-80 flex-shrink-0 border-r border-pitch-700
                             flex flex-col overflow-hidden
                             ${mobileView === 'detail' ? 'hidden sm:flex' : 'flex'}`}>

              {/* Inbox label */}
              <div className="px-4 py-3 border-b border-pitch-700 flex items-center gap-2 flex-shrink-0">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Inbox</span>
                {unreadCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto flex-1">
                {notifications.map(n => (
                  <InboxRow
                    key={n.id}
                    notification={n}
                    selected={n.id === selectedId}
                    onClick={() => handleSelect(n)}
                  />
                ))}
              </div>
            </div>

            {/* ── Right panel — detail view ── */}
            <div className={`flex-1 min-w-0
                             ${mobileView === 'list' ? 'hidden sm:flex sm:flex-col' : 'flex flex-col'}`}>
              <NotificationDetail
                notification={selectedNotification}
                onBack={handleBack}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
