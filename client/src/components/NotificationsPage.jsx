import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 50;

// ── Dedicated hook for the full notifications page ────────────────────────────
// Uses a unique channel key so it doesn't conflict with NotificationBell's
// existing subscription to the same user's notifications.
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

    // Realtime — unique channel key so it doesn't clash with NotificationBell
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

const TYPE_CONFIG = {
  result:        { icon: '🏆', label: 'Match result' },
  deadline:      { icon: '⏰', label: 'Deadline'     },
  leaderboard:   { icon: '📊', label: 'Leaderboard'  },
  jules_payment: { icon: '💰', label: 'Jules Rimet'  },
};

// ── Single notification card ──────────────────────────────────────────────────
function NotificationCard({ notification, onRead }) {
  const cfg = TYPE_CONFIG[notification.type] || { icon: '🔔', label: 'Notification' };

  return (
    <button
      onClick={() => { if (!notification.read) onRead(notification.id); }}
      className={`w-full text-left rounded-xl border transition-colors p-4
                  ${notification.read
                    ? 'bg-pitch-800/50 border-pitch-700/50 opacity-70'
                    : 'bg-pitch-800 border-pitch-700 hover:border-pitch-600'
                  }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="flex-shrink-0 mt-1.5">
          <div className={`w-2 h-2 rounded-full ${notification.read ? 'bg-transparent' : 'bg-amber-400'}`} />
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pitch-700 flex items-center justify-center text-lg">
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm font-bold leading-snug ${notification.read ? 'text-slate-400' : 'text-white'}`}>
              {notification.title}
            </p>
            <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5">
              {timeAgo(notification.created_at)}
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {notification.body}
          </p>
          <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {cfg.label}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage({ userId }) {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } =
    useAllNotifications(userId);

  return (
    <div className="animate-fade-in mt-6 max-w-2xl mx-auto">

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
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

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="bg-pitch-800 border border-pitch-700 rounded-xl flex flex-col items-center justify-center py-16 text-center px-6">
          <span className="text-6xl mb-4">🔔</span>
          <p className="text-white font-bold text-lg mb-1">No notifications yet</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Match results, prediction deadlines, and league updates will appear here when they arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <NotificationCard key={n.id} notification={n} onRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
}
