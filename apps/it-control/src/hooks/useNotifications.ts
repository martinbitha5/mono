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

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function playNotifSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch { /* AudioContext bloqué (iOS nécessite un geste utilisateur préalable) */ }
}

async function subscribePush(uid: string) {
  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const p256dh = sub.getKey('p256dh');
    const auth = sub.getKey('auth');
    if (!p256dh || !auth) return;
    await supabase.from('push_subscriptions').upsert({
      user_id: uid,
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    }, { onConflict: 'endpoint' });
  } catch { /* navigateur sans support push ou permission refusée */ }
}

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
        await Notification.requestPermission();
      }

      await subscribePush(session.user.id);
      await load(session.user.id);

      channel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        }, (payload) => {
          const n = payload.new as AppNotification;
          if (n.service !== 'it' && n.service !== 'both') return;
          setNotifications(prev => [{ ...n, read: false }, ...prev]);

          if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
          playNotifSound();

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
        .in('service', ['it', 'both'])
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
