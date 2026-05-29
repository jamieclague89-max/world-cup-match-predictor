import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// ── Relative time ─────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  result:        { icon: '🏆', colour: 'text-gold-400',  bg: 'bg-gold-500/10'   },
  deadline:      { icon: '⏰', colour: 'text-amber-400', bg: 'bg-amber-500/10'  },
  leaderboard:   { icon: '📊', colour: 'text-blue-400',  bg: 'bg-blue-500/10'   },
  jules_payment: { icon: '💰', colour: 'text-green-400', bg: 'bg-green-500/10'  },
};

// ── Single notification row ───────────────────────────────────────────────────
function NotificationRow({ notification, onRead, onDelete, onNavigate }) {
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.result;

  function handleClick() {
    if (!notification.read) onRead(notification.id);
    onNavigate();
  }

  function handleDelete(e) {
    e.stopPropagation();
    onDelete(notification.id);
  }

  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3 transition-colors
                  hover:bg-pitch-700/60 border-b border-pitch-700 last:border-0
                  ${notification.read ? 'opacity-60' : ''}`}
    >
      {/* Clickable area */}
      <button
        onClick={handleClick}
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
      >
        {/* Unread dot */}
        <div className="flex-shrink-0 mt-1 w-2 h-2 rounded-full transition-colors"
             style={{ background: notification.read ? 'transparent' : '#f59e0b' }} />

        {/* Type icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${cfg.bg}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <p className={`text-xs font-bold leading-snug ${notification.read ? 'text-slate-400' : 'text-white'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
            {notification.body}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            {timeAgo(notification.created_at)}
          </p>
        </div>
      </button>

      {/* Delete button — appears on hover */}
      <button
        onClick={handleDelete}
        title="Delete notification"
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity
                   w-6 h-6 flex items-center justify-center rounded-md
                   text-slate-500 hover:text-red-400 hover:bg-red-500/10"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationBell({ userId, setActiveTab }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const { notifications, unreadCount, loading, markAsRead, markAllRead, deleteNotification, clearAll } =
    useNotifications(userId);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
  }

  function goToNotificationsPage() {
    setOpen(false);
    setActiveTab('notifications');
  }

  return (
    <div ref={panelRef} className="relative">

      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        title="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg
                   text-slate-300 hover:text-white hover:bg-pitch-700
                   transition-colors duration-150 focus:outline-none"
      >
        {/* Bell SVG */}
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1
                           bg-red-500 text-white text-[10px] font-black rounded-full
                           flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96
                        bg-pitch-800 border border-pitch-600 rounded-xl shadow-2xl
                        z-[60] flex flex-col overflow-hidden"
             style={{ maxHeight: '480px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-pitch-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400
                                 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-500 text-sm">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span className="text-4xl mb-3">🔔</span>
                <p className="text-slate-300 text-sm font-semibold">You're all caught up!</p>
                <p className="text-slate-500 text-xs mt-1">
                  Notifications about results, deadlines and leaderboard changes will appear here.
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onNavigate={goToNotificationsPage}
                />
              ))
            )}
          </div>

          {/* Footer — always visible */}
          <div className="flex-shrink-0 border-t border-pitch-700 bg-pitch-900/50">
            <button
              onClick={goToNotificationsPage}
              className="w-full py-2.5 text-xs font-semibold text-gold-400
                         hover:text-gold-300 transition-colors text-center"
            >
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
