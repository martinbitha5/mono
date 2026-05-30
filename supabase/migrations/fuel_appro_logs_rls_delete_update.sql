-- Politiques RLS manquantes sur fuel_appro_logs
-- Sans ces politiques, DELETE et UPDATE retournaient silencieusement 0 lignes

CREATE POLICY "Supervisors/Admins can update fuel_appro_logs"
ON fuel_appro_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin','supervisor'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin','supervisor'])
  )
);

CREATE POLICY "Supervisors/Admins can delete fuel_appro_logs"
ON fuel_appro_logs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin','supervisor'])
  )
);
