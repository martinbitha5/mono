-- ============================================================
--  REMISE À ZÉRO DES DONNÉES OPÉRATIONNELLES — ATS Monorepo
--  Exécuter dans : Supabase Dashboard > SQL Editor
--
--  ✅ CONSERVE  : profiles (tous les comptes agents)
--  🗑  SUPPRIME : toutes les données opérationnelles
-- ============================================================

-- Désactiver temporairement les contraintes FK pour éviter les erreurs d'ordre
SET session_replication_role = 'replica';

-- ── TECH CONTROL ─────────────────────────────────────────────

-- Historique carburant
TRUNCATE TABLE fuel_appro_logs RESTART IDENTITY CASCADE;

-- Saisies carburant (consommations)
TRUNCATE TABLE fuel_logs RESTART IDENTITY CASCADE;

-- Stocks carburant (remis à 0)
TRUNCATE TABLE fuel_stock RESTART IDENTITY CASCADE;

-- Check-lists journalières
TRUNCATE TABLE daily_checklists RESTART IDENTITY CASCADE;

-- Interventions / incidents GSE
TRUNCATE TABLE gse_incidents RESTART IDENTITY CASCADE;

-- Parc GSE (tous les engins)
TRUNCATE TABLE gse_equipment RESTART IDENTITY CASCADE;

-- Pointages / présences
TRUNCATE TABLE attendance RESTART IDENTITY CASCADE;

-- Planning / horaires
TRUNCATE TABLE schedules RESTART IDENTITY CASCADE;

-- ── IT CONTROL ───────────────────────────────────────────────

-- Historique équipement IT
TRUNCATE TABLE equipment_logs RESTART IDENTITY CASCADE;

-- Inventaire équipements IT
TRUNCATE TABLE equipment RESTART IDENTITY CASCADE;

-- Installations compagnies aériennes
TRUNCATE TABLE installations RESTART IDENTITY CASCADE;

-- Incidents IT
TRUNCATE TABLE incidents RESTART IDENTITY CASCADE;

-- ── COMMUN (les deux apps) ───────────────────────────────────

-- Notifications lues (lectures)
TRUNCATE TABLE notification_reads RESTART IDENTITY CASCADE;

-- Notifications
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- Forum — réponses (avant les topics pour la FK)
TRUNCATE TABLE forum_replies RESTART IDENTITY CASCADE;

-- Forum — sujets
TRUNCATE TABLE forum_topics RESTART IDENTITY CASCADE;

-- Réactiver les contraintes FK
SET session_replication_role = 'origin';

-- ── Vérification ─────────────────────────────────────────────
-- Après exécution, ces requêtes doivent toutes retourner 0 :
SELECT 'fuel_appro_logs'   AS table_name, COUNT(*) AS lignes FROM fuel_appro_logs
UNION ALL SELECT 'fuel_logs',         COUNT(*) FROM fuel_logs
UNION ALL SELECT 'fuel_stock',        COUNT(*) FROM fuel_stock
UNION ALL SELECT 'daily_checklists',  COUNT(*) FROM daily_checklists
UNION ALL SELECT 'gse_incidents',     COUNT(*) FROM gse_incidents
UNION ALL SELECT 'gse_equipment',     COUNT(*) FROM gse_equipment
UNION ALL SELECT 'attendance',        COUNT(*) FROM attendance
UNION ALL SELECT 'schedules',         COUNT(*) FROM schedules
UNION ALL SELECT 'equipment_logs',    COUNT(*) FROM equipment_logs
UNION ALL SELECT 'equipment',         COUNT(*) FROM equipment
UNION ALL SELECT 'installations',     COUNT(*) FROM installations
UNION ALL SELECT 'incidents',         COUNT(*) FROM incidents
UNION ALL SELECT 'notifications',     COUNT(*) FROM notifications
UNION ALL SELECT 'forum_topics',      COUNT(*) FROM forum_topics
UNION ALL SELECT 'forum_replies',     COUNT(*) FROM forum_replies
-- profiles DOIT rester > 0 :
UNION ALL SELECT 'profiles (conservé)', COUNT(*) FROM profiles;
