-- =====================================================================
-- ATS TECH CONTROL — Patch 2 : Historique des approvisionnements
-- Exécuter après migration.sql ou migration_patch.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS fuel_appro_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site       TEXT NOT NULL DEFAULT 'Kinshasa',
  fuel_type  TEXT NOT NULL CHECK (fuel_type IN ('gasoil','essence','huile')),
  quantity   DECIMAL(10,2) NOT NULL,
  notes      TEXT DEFAULT '',
  agent_id   UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_appro_site    ON fuel_appro_logs(site);
CREATE INDEX IF NOT EXISTS idx_fuel_appro_type    ON fuel_appro_logs(fuel_type);
CREATE INDEX IF NOT EXISTS idx_fuel_appro_created ON fuel_appro_logs(created_at);

ALTER TABLE fuel_appro_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view fuel_appro_logs"         ON fuel_appro_logs;
DROP POLICY IF EXISTS "Supervisors/Admins can create fuel_appro_logs" ON fuel_appro_logs;

CREATE POLICY "All users can view fuel_appro_logs"
  ON fuel_appro_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors/Admins can create fuel_appro_logs"
  ON fuel_appro_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')
  ));
