-- =====================================================================
-- ATS TECH CONTROL — Patch 3 : Champ service sur les profils
-- Distingue les agents IT des agents Technique
-- Exécuter après migration_patch2.sql
-- =====================================================================

-- 1. Ajouter la colonne service sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS service TEXT DEFAULT 'tech'
  CHECK (service IN ('tech', 'it', 'both'));

-- 2. Les agents IT passent en 'it' → ne s'affichent pas dans tech-control
UPDATE profiles SET service = 'it' WHERE role = 'it_agent';

-- 3. Le compte dev passe partout (adapter l'email si nécessaire)
UPDATE profiles SET service = 'both' WHERE email = 'martinbitha@yahoo.fr';

-- Les tech_agent et supervisor restent à 'tech' (valeur par défaut)
-- Les admin restent à 'tech' par défaut — les mettre à 'both' manuellement si besoin
-- ex : UPDATE profiles SET service = 'both' WHERE email = 'votre.email@ats.com';
