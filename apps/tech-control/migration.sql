-- =====================================================================
-- ATS TECH CONTROL — Migration Supabase
-- Exécuter dans Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Recréer gse_equipment avec le bon schéma
-- =====================================================================
DROP TABLE IF EXISTS daily_checklists CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS gse_incidents CASCADE;
DROP TABLE IF EXISTS gse_equipment CASCADE;

CREATE TABLE gse_equipment (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  serie            TEXT DEFAULT '',
  marque           TEXT DEFAULT '',
  type             TEXT DEFAULT 'other' CHECK (type IN (
                     'tractor','escalier','gpu','pushback','belt_loader',
                     'ambulift','loader','air_starter','toilette',
                     'potable_water','tarmac_bus','other'
                   )),
  site             TEXT DEFAULT 'Kinshasa',
  horametre_actuel      INTEGER NOT NULL DEFAULT 0,
  horametre_revision    INTEGER NOT NULL DEFAULT 0,
  intervalle            INTEGER NOT NULL DEFAULT 250,
  horametre_prochain    INTEGER GENERATED ALWAYS AS (horametre_revision + intervalle) STORED,
  delta                 INTEGER GENERATED ALWAYS AS (horametre_actuel - (horametre_revision + intervalle)) STORED,
  statut           TEXT DEFAULT 'op' CHECK (statut IN ('op','inop')),
  assigned_to      UUID REFERENCES profiles(id),
  obs              TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gse_equipment_delta  ON gse_equipment(delta);
CREATE INDEX idx_gse_equipment_site   ON gse_equipment(site);
CREATE INDEX idx_gse_equipment_statut ON gse_equipment(statut);

ALTER TABLE gse_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view gse_equipment"
  ON gse_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/supervisors can modify gse_equipment"
  ON gse_equipment FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gse_equipment_updated_at
  BEFORE UPDATE ON gse_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données de démonstration (parc réel ATS Kinshasa)
INSERT INTO gse_equipment (name, serie, marque, type, horametre_actuel, horametre_revision, intervalle, statut) VALUES
  ('TRACTOR',      'AT-122', 'ROFAN',       'tractor',      1250,  1000, 250,  'op'),
  ('TRACTOR',      'AT-128', 'SOVAM',       'tractor',       850,   750, 250,  'op'),
  ('TRACTOR',      'AT-151', 'ROFAN',       'tractor',      2100,  2000, 250,  'op'),
  ('TRACTOR',      'AT-149', 'ROFAN',       'tractor',      1600,  1500, 250,  'op'),
  ('ESCALIER',     'AT-119', 'FMC',         'escalier',     3200,  3000, 250,  'op'),
  ('ESCALIER',     'AT-135', 'TLD',         'escalier',      450,   250, 250,  'op'),
  ('ESCALIER',     'AT-136', 'TLD',         'escalier',      780,   750, 250,  'op'),
  ('ESCALIER',     'AT-137', 'TLD',         'escalier',     1050,  1000, 250,  'op'),
  ('GPU',          'AT-139', 'TLD',         'gpu',          2200,  2000, 250,  'op'),
  ('PUSHBACK',     'AT-113', 'XXX',         'pushback',     5500,  5000,5000,  'op'),
  ('BELT LOADER',  'AT-126', 'TLD',         'belt_loader',  1750,  1500, 250,  'op'),
  ('AMBULIFT',     'AT-173', 'FMC',         'ambulift',     4200,  4000, 250,  'op'),
  ('BELT LOADER',  'AT-170', 'MULAG',       'belt_loader',   650,   500, 250,  'op'),
  ('BELT LOADER',  'AT-171', 'MULAG',       'belt_loader',   320,   250, 250,  'op'),
  ('BELT LOADER',  'AT-134', 'TLD',         'belt_loader',  2100,  2000, 250,  'op'),
  ('LOADER',       'AT-092', 'AIR MAREL',   'loader',       5800,  5500,5000,  'op'),
  ('LOADER',       'AT-143', 'TREPEL',      'loader',       1250,  1000, 250,  'op'),
  ('LOADER',       'AT-144', 'AIR MAREL',   'loader',       3800,  3750, 250,  'op'),
  ('AIR STARTER',  'AT-115', '',            'air_starter',  2100,  2000, 250,  'op'),
  ('TOILETTE',     'AT-000', '',            'toilette',     1500,  1250, 250,  'op'),
  ('POTABLE WATER','AT-000', '',            'potable_water',2800,  2750, 250,  'op'),
  ('TARMAC BUS',   'AT-131', 'COBUS 2500',  'tarmac_bus',  12500, 12000,5000,  'op'),
  ('TARMAC BUS',   'AT-132', 'COBUS',       'tarmac_bus',  15200, 15000,5000,  'op'),
  ('TARMAC BUS',   'AT-133', 'COBUS',       'tarmac_bus',   8300,  7500,5000,  'op'),
  ('TARMAC BUS',   'AT-148', 'COBUS 3000',  'tarmac_bus',   6200,  6000,5000,  'op'),
  ('TARMAC BUS',   'AT-150', 'TOYOTA HIACE','tarmac_bus',   2500,  2000,5000,  'op');


-- 2. Check-lists journalières
-- =====================================================================
CREATE TABLE daily_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID NOT NULL REFERENCES gse_equipment(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES profiles(id),
  site            TEXT DEFAULT 'Kinshasa',
  proprete        TEXT DEFAULT 'C' CHECK (proprete        IN ('C','NC')),
  carburant       TEXT DEFAULT 'C' CHECK (carburant       IN ('C','NC')),
  huile_moteur    TEXT DEFAULT 'C' CHECK (huile_moteur    IN ('C','NC')),
  freins          TEXT DEFAULT 'C' CHECK (freins          IN ('C','NC')),
  pneus           TEXT DEFAULT 'C' CHECK (pneus           IN ('C','NC')),
  gyrophare       TEXT DEFAULT 'C' CHECK (gyrophare       IN ('C','NC')),
  cales           TEXT DEFAULT 'C' CHECK (cales           IN ('C','NC')),
  phare_clignotant TEXT DEFAULT 'C' CHECK (phare_clignotant IN ('C','NC')),
  extincteur      TEXT DEFAULT 'C' CHECK (extincteur      IN ('C','NC')),
  hydraulique     TEXT DEFAULT 'C' CHECK (hydraulique     IN ('C','NC')),
  horametre       INTEGER DEFAULT 0,
  observation     TEXT DEFAULT '',
  final_status    TEXT DEFAULT 'op' CHECK (final_status IN ('op','inop')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_checklists_equipment_date ON daily_checklists(equipment_id, created_at);
CREATE INDEX idx_daily_checklists_date ON daily_checklists(created_at);
CREATE INDEX idx_daily_checklists_site ON daily_checklists(site);

ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view daily_checklists"
  ON daily_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agents can create their own checklists"
  ON daily_checklists FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());


-- 3. Incidents GSE (séparés des incidents IT)
-- =====================================================================
CREATE TABLE gse_incidents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  equipment_id UUID REFERENCES gse_equipment(id),
  priority     TEXT DEFAULT 'moyen' CHECK (priority IN ('faible','moyen','critique')),
  status       TEXT DEFAULT 'ouvert' CHECK (status IN ('ouvert','en_cours','resolu')),
  site         TEXT DEFAULT 'Kinshasa',
  reporter_id  UUID NOT NULL REFERENCES profiles(id),
  assigned_to  UUID REFERENCES profiles(id),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gse_incidents_status   ON gse_incidents(status);
CREATE INDEX idx_gse_incidents_priority ON gse_incidents(priority);
CREATE INDEX idx_gse_incidents_site     ON gse_incidents(site);

ALTER TABLE gse_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view gse_incidents"
  ON gse_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create gse_incidents"
  ON gse_incidents FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Supervisors/Admins can update gse_incidents"
  ON gse_incidents FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
    OR reporter_id = auth.uid() OR assigned_to = auth.uid()
  );

CREATE TRIGGER gse_incidents_updated_at
  BEFORE UPDATE ON gse_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. Logs carburant
-- =====================================================================
CREATE TABLE fuel_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id     UUID NOT NULL REFERENCES gse_equipment(id) ON DELETE CASCADE,
  fuel_type        TEXT NOT NULL DEFAULT 'gasoil' CHECK (fuel_type IN ('gasoil','essence','huile')),
  quantity         DECIMAL(10,2) NOT NULL,
  horametre_at_fill INTEGER DEFAULT 0,
  site             TEXT DEFAULT 'Kinshasa',
  agent_id         UUID REFERENCES profiles(id),
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_logs_equipment ON fuel_logs(equipment_id);
CREATE INDEX idx_fuel_logs_created   ON fuel_logs(created_at);
CREATE INDEX idx_fuel_logs_site      ON fuel_logs(site);
CREATE INDEX idx_fuel_logs_type      ON fuel_logs(fuel_type);

ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view fuel_logs"
  ON fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Agents can create fuel_logs"
  ON fuel_logs FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid() OR agent_id IS NULL);


-- 5. Stock carburant par site
-- =====================================================================
DROP TABLE IF EXISTS fuel_stock CASCADE;

CREATE TABLE fuel_stock (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site       TEXT NOT NULL DEFAULT 'Kinshasa',
  fuel_type  TEXT NOT NULL CHECK (fuel_type IN ('gasoil','essence','huile')),
  quantity   DECIMAL(10,2) NOT NULL DEFAULT 0,
  threshold  DECIMAL(10,2) NOT NULL DEFAULT 200,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (site, fuel_type)
);

ALTER TABLE fuel_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view fuel_stock"
  ON fuel_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors/Admins can modify fuel_stock"
  ON fuel_stock FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- Stock initial Kinshasa
INSERT INTO fuel_stock (site, fuel_type, quantity, threshold) VALUES
  ('Kinshasa', 'gasoil',  2500, 500),
  ('Kinshasa', 'essence',  800, 200),
  ('Kinshasa', 'huile',    150,  50)
ON CONFLICT (site, fuel_type) DO NOTHING;


-- 6. Trigger auto-déduction stock lors d'une saisie carburant
-- =====================================================================
-- SECURITY DEFINER : le trigger s'exécute avec les droits du owner,
-- ce qui permet à un tech_agent d'insérer un fuel_log (INSERT autorisé)
-- et de faire déduire le fuel_stock sans avoir accès direct à cette table.
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

CREATE TRIGGER trg_deduct_fuel_stock
  AFTER INSERT ON fuel_logs
  FOR EACH ROW EXECUTE FUNCTION deduct_fuel_stock_on_log();
