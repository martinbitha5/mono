// Edge Function — send-push
// Déclenchée par un Database Webhook sur INSERT dans la table notifications.
// Envoie une Web Push notification à tous les appareils abonnés du bon service.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webPush from 'npm:web-push';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@ats.aero';

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req) => {
  // Supabase Database Webhooks envoient un POST avec { type, table, record, ... }
  const body = await req.json().catch(() => null);
  const notification = body?.record;

  if (!notification) {
    return new Response('No record', { status: 400 });
  }

  const notifService: string = notification.service;
  // service='both' → tout le monde ; sinon cibler le bon service + 'both'
  const serviceFilter = notifService === 'both'
    ? ['tech', 'it', 'both']
    : [notifService, 'both'];

  // Récupérer les user_id cibles
  const { data: targetUsers } = await supabase
    .from('profiles')
    .select('id')
    .in('service', serviceFilter);

  if (!targetUsers?.length) return new Response('No targets', { status: 200 });

  const userIds = targetUsers.map((u: { id: string }) => u.id);

  // Récupérer leurs abonnements push
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds);

  if (!subs?.length) return new Response('No subscriptions', { status: 200 });

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    link: notification.link,
  });

  // Envoyer en parallèle, ignorer les erreurs individuelles (abonnement expiré, etc.)
  await Promise.allSettled(
    subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ).catch(() => null)
    )
  );

  return new Response('OK', { status: 200 });
});
