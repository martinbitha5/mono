-- ── Migration patch 4 : corriger la colonne service sur les profils existants ──
-- À exécuter une seule fois dans l'éditeur SQL de Supabase

-- 1. S'assurer que la colonne existe (idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service text
  CHECK (service IN ('tech', 'it', 'both'));

-- 2. Agents IT purs → service = 'it'
UPDATE profiles
SET service = 'it'
WHERE role = 'it_agent'
  AND (service IS NULL OR service = '');

-- 3. Agents Technique purs → service = 'tech'
UPDATE profiles
SET service = 'tech'
WHERE role = 'tech_agent'
  AND (service IS NULL OR service = '');

-- 4. Admins et superviseurs sans service → 'both' (accès cross-service)
UPDATE profiles
SET service = 'both'
WHERE role IN ('admin', 'supervisor')
  AND (service IS NULL OR service = '');

-- 5. Forcer martinbitha@yahoo.fr en 'both' (admin cross-service)
--    → il apparaîtra dans les deux apps
UPDATE profiles
SET service = 'both'
WHERE email = 'martinbitha@yahoo.fr';

-- Vérifier le résultat :
-- SELECT email, role, service FROM profiles ORDER BY service, role;
