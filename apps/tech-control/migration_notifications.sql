-- ── Notifications system ─────────────────────────────────────────────────────

-- Main notifications table (service-scoped)
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service    text NOT NULL CHECK (service IN ('tech', 'it', 'both')),
  type       text NOT NULL CHECK (type IN ('intervention', 'gse_inop', 'incident', 'maintenance', 'info')),
  title      text NOT NULL,
  body       text NOT NULL,
  link       text,
  created_at timestamptz DEFAULT now()
);

-- Per-user read tracking
CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

-- Enable Supabase Realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- RLS
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads  ENABLE ROW LEVEL SECURITY;

-- Users can read notifications matching their service.
-- service='both' admins (cross-service) see ALL notifications from all services.
CREATE POLICY "read service notifications" ON notifications
  FOR SELECT USING (
    service = 'both' OR
    (SELECT service FROM profiles WHERE id = auth.uid()) = 'both' OR
    service = (SELECT service FROM profiles WHERE id = auth.uid())
  );

-- Authenticated users can insert notifications (used by DB triggers + frontend)
CREATE POLICY "insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users manage their own read records
CREATE POLICY "manage own reads" ON notification_reads
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Trigger: new gse_incident → notification ──────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_gse_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (service, type, title, body, link)
  VALUES (
    'tech',
    'intervention',
    'Nouvel incident GSE : ' || NEW.title,
    CASE NEW.priority
      WHEN 'critique' THEN 'Priorité critique — ' || NEW.site
      WHEN 'moyen'    THEN 'Priorité moyenne — '  || NEW.site
      ELSE                 'Priorité faible — '   || NEW.site
    END,
    '/interventions'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_gse_incident ON gse_incidents;
CREATE TRIGGER trg_notify_gse_incident
  AFTER INSERT ON gse_incidents
  FOR EACH ROW EXECUTE FUNCTION notify_on_gse_incident();

-- ── Trigger: GSE set to INOP → notification ───────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_gse_inop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.statut = 'inop' AND (OLD.statut IS DISTINCT FROM 'inop') THEN
    INSERT INTO notifications (service, type, title, body, link)
    VALUES (
      'tech',
      'gse_inop',
      'Engin INOP : ' || NEW.name,
      NEW.name || ' (' || COALESCE(NEW.serie, '—') || ') mis hors service sur ' || NEW.site,
      '/gse'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_gse_inop ON gse_equipment;
CREATE TRIGGER trg_notify_gse_inop
  AFTER UPDATE ON gse_equipment
  FOR EACH ROW EXECUTE FUNCTION notify_on_gse_inop();

-- ── Trigger: new IT incident → notification ───────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_it_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (service, type, title, body, link)
  VALUES (
    'it',
    'incident',
    'Incident IT : ' || NEW.title,
    CASE NEW.priority
      WHEN 'critical' THEN 'Priorité critique — ' || NEW.site
      WHEN 'medium'   THEN 'Priorité moyenne — '  || NEW.site
      ELSE                 'Priorité faible — '   || NEW.site
    END,
    '/incidents'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_it_incident ON incidents;
CREATE TRIGGER trg_notify_it_incident
  AFTER INSERT ON incidents
  FOR EACH ROW EXECUTE FUNCTION notify_on_it_incident();
