-- =====================================================================
-- ATS TECH CONTROL — Patch carburant
-- Exécuter si vous avez déjà lancé migration.sql
-- Ajoute fuel_type/site à fuel_logs + crée fuel_stock + trigger
-- =====================================================================

-- 1. Ajouter colonnes manquantes sur fuel_logs
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS
  fuel_type TEXT DEFAULT 'gasoil' CHECK (fuel_type IN ('gasoil','essence','huile'));

ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS
  site TEXT DEFAULT 'Kinshasa';

CREATE INDEX IF NOT EXISTS idx_fuel_logs_site ON fuel_logs(site);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_type ON fuel_logs(fuel_type);

-- 2. Créer fuel_stock si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS fuel_stock (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site       TEXT NOT NULL DEFAULT 'Kinshasa',
  fuel_type  TEXT NOT NULL CHECK (fuel_type IN ('gasoil','essence','huile')),
  quantity   DECIMAL(10,2) NOT NULL DEFAULT 0,
  threshold  DECIMAL(10,2) NOT NULL DEFAULT 200,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (site, fuel_type)
);

ALTER TABLE fuel_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view fuel_stock"            ON fuel_stock;
DROP POLICY IF EXISTS "Supervisors/Admins can modify fuel_stock" ON fuel_stock;

CREATE POLICY "All users can view fuel_stock"
  ON fuel_stock FOR SELECT TO authenticated USING (true);

CREATE POLICY "Supervisors/Admins can modify fuel_stock"
  ON fuel_stock FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- 3. Stock initial Kinshasa (ne fait rien si déjà présent)
INSERT INTO fuel_stock (site, fuel_type, quantity, threshold) VALUES
  ('Kinshasa', 'gasoil',  2500, 500),
  ('Kinshasa', 'essence',  800, 200),
  ('Kinshasa', 'huile',    150,  50)
ON CONFLICT (site, fuel_type) DO NOTHING;

-- 4. Trigger : déduire automatiquement du stock à chaque saisie
--    SECURITY DEFINER = s'exécute avec les droits du owner (bypass RLS fuel_stock)
--    Permet aux tech_agents d'insérer un fuel_log sans accès direct à fuel_stock
CREATE OR REPLACE FUNCTION deduct_fuel_stock_on_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fuel_stock (site, fuel_type, quantity, threshold)
  VALUES (
    COALESCE(NEW.site, 'Kinshasa'),
    NEW.fuel_type,
    -NEW.quantity,
    200
  )
  ON CONFLICT (site, fuel_type)
  DO UPDATE SET
    quantity   = fuel_stock.quantity - NEW.quantity,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_fuel_stock ON fuel_logs;
CREATE TRIGGER trg_deduct_fuel_stock
  AFTER INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION deduct_fuel_stock_on_log();
