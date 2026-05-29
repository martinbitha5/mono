-- ── Migration patch 5 : photo_url sur gse_incidents + bucket Storage ──────────
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne photo_url (nullable, idempotent)
ALTER TABLE gse_incidents ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Créer le bucket Supabase Storage pour les photos d'interventions
--    (si non existant — à faire aussi via Dashboard > Storage si cette commande échoue)
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-photos', 'intervention-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Politique RLS Storage : tout utilisateur authentifié peut uploader
CREATE POLICY "auth upload intervention photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'intervention-photos');

-- 4. Politique RLS Storage : lecture publique (pour afficher les photos)
CREATE POLICY "public read intervention photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'intervention-photos');
