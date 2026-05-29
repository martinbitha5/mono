-- ============================================================
--  Table : push_subscriptions
--  Stocke les abonnements Web Push par appareil/navigateur.
--  À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   text        UNIQUE NOT NULL,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur gère uniquement ses propres abonnements
CREATE POLICY "own_subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Index pour accélérer la recherche par user_id (Edge Function)
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);
