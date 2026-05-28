import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@ats/supabase/client';

export type AppNotification = {
  id: string;
  service: 'tech' | 'it' | 'both';
  type: 'intervention' | 'gse_inop' | 'incident' | 'maintenance' | 'info';
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  read: boolean;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const userId = useRef<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      userId.current = session.user.id;

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      await load(session.user.id);

      channel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        }, (payload) => {
          const n = payload.new as AppNotification;
          setNotifications(prev => [{ ...n, read: false }, ...prev]);

          if (Notification.permission === 'granted') {
            new Notification(n.title, {
              body: n.body,
              icon: '/favicon.ico',
              tag: n.id,
            });
          }
        })
        .subscribe();
    }

    async function load(uid: string) {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!notifs?.length) { setNotifications([]); return; }

      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .in('notification_id', notifs.map(n => n.id));

      const readSet = new Set(reads?.map(r => r.notification_id) ?? []);
      setNotifications(notifs.map(n => ({ ...n, read: readSet.has(n.id) })));
      void uid;
    }

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const markAllRead = useCallback(async () => {
    const uid = userId.current;
    if (!uid) return;
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;

    await supabase.from('notification_reads').upsert(
      unread.map(n => ({ notification_id: n.id, user_id: uid })),
      { onConflict: 'notification_id,user_id' },
    );
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead };
}
