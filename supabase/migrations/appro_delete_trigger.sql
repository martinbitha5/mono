-- Trigger : ajuste automatiquement fuel_stock quand un appro est supprimé
-- Exécuté AFTER DELETE, SECURITY DEFINER pour contourner RLS

CREATE OR REPLACE FUNCTION adjust_stock_on_appro_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE fuel_stock
  SET
    quantity   = GREATEST(0, quantity - OLD.quantity),
    updated_at = NOW()
  WHERE site      = OLD.site
    AND fuel_type = OLD.fuel_type;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_appro_delete ON fuel_appro_logs;
CREATE TRIGGER trg_adjust_stock_on_appro_delete
  AFTER DELETE ON fuel_appro_logs
  FOR EACH ROW
  EXECUTE FUNCTION adjust_stock_on_appro_delete();
