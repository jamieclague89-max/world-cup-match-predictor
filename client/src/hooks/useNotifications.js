import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 30;

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Initial load ──────────────────────────────────────────────────────────
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
  }, [userId]);

  // ── Realtime subscription — inserts only ──────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          setNotifications(prev => [payload.new, ...prev].slice(0, PAGE_SIZE));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Mark a single notification as read ───────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
  }, [userId]);

  // ── Mark all notifications as read ───────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllRead };
}
