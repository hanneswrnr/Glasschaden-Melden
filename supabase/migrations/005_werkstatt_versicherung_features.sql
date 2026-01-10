-- ============================================
-- GLASSCHADEN MELDEN - WERKSTATT & VERSICHERUNG FEATURES
-- Migration: 005_werkstatt_versicherung_features.sql
-- ============================================

-- ============================================
-- NEUE ENUMS
-- ============================================

-- Payment Status für Provisionen
CREATE TYPE payment_status AS ENUM ('nicht_bezahlt', 'bezahlt');

-- Neue Schadensarten hinzufügen
ALTER TYPE damage_type ADD VALUE IF NOT EXISTS 'frontscheibe_steinschlag';
ALTER TYPE damage_type ADD VALUE IF NOT EXISTS 'frontscheibe_austausch';
ALTER TYPE damage_type ADD VALUE IF NOT EXISTS 'seitenscheibe_austausch';
ALTER TYPE damage_type ADD VALUE IF NOT EXISTS 'heckscheibe_austausch';

-- Neuer Status: reparatur_abgeschlossen
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'reparatur_abgeschlossen';

-- ============================================
-- PROVISION CONFIGS (Pro Versicherung)
-- ============================================

CREATE TABLE IF NOT EXISTS provision_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    versicherung_id UUID REFERENCES versicherungen(id) ON DELETE CASCADE,

    -- Standard-Provisionen (können pro Versicherung überschrieben werden)
    frontscheibe_steinschlag DECIMAL(10,2) DEFAULT 10.00,
    frontscheibe_austausch DECIMAL(10,2) DEFAULT 50.00,
    seitenscheibe_austausch DECIMAL(10,2) DEFAULT 20.00,
    heckscheibe_austausch DECIMAL(10,2) DEFAULT 20.00,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Eine Config pro Versicherung
    CONSTRAINT unique_provision_config UNIQUE (versicherung_id)
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_provision_configs_versicherung ON provision_configs(versicherung_id);

-- Updated_at Trigger
CREATE TRIGGER set_updated_at_provision_configs
    BEFORE UPDATE ON provision_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CLAIMS TABELLE ERWEITERUNGEN
-- ============================================

-- Payment Status Spalte hinzufügen
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'nicht_bezahlt';

-- Index für Payment Status
CREATE INDEX IF NOT EXISTS idx_claims_payment_status ON claims(payment_status);

-- ============================================
-- CLAIMS FELDER OPTIONAL MACHEN
-- ============================================

-- Versicherungsnummer optional machen
ALTER TABLE claims ALTER COLUMN vers_nr DROP NOT NULL;

-- Fahrzeugdaten optional machen
ALTER TABLE claims ALTER COLUMN fahrzeug_marke DROP NOT NULL;
ALTER TABLE claims ALTER COLUMN fahrzeug_modell DROP NOT NULL;
ALTER TABLE claims ALTER COLUMN kennzeichen DROP NOT NULL;

-- VIN optional machen und Constraint anpassen
ALTER TABLE claims DROP CONSTRAINT IF EXISTS valid_vin;
ALTER TABLE claims ALTER COLUMN vin DROP NOT NULL;

-- Neuer VIN Constraint der NULL erlaubt
ALTER TABLE claims ADD CONSTRAINT valid_vin CHECK (
    vin IS NULL OR (
        LENGTH(vin) = 17 AND
        vin !~ '[IOQioq]' AND
        vin ~ '^[A-HJ-NPR-Z0-9]{17}$'
    )
);

-- Versicherungsname optional (für Makler-Dropdown)
ALTER TABLE claims ALTER COLUMN vers_name DROP NOT NULL;

-- ============================================
-- RLS POLICIES FÜR PROVISION_CONFIGS
-- ============================================

ALTER TABLE provision_configs ENABLE ROW LEVEL SECURITY;

-- Admin kann alles sehen und bearbeiten
CREATE POLICY "Admin full access on provision_configs"
ON provision_configs
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Werkstatt kann Provision Configs lesen (für Berechnung)
CREATE POLICY "Werkstatt can read provision_configs"
ON provision_configs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'werkstatt'
    )
);

-- Versicherung kann eigene Config sehen
CREATE POLICY "Versicherung can read own provision_config"
ON provision_configs
FOR SELECT
TO authenticated
USING (
    versicherung_id IN (
        SELECT id FROM versicherungen
        WHERE user_id = auth.uid()
    )
);

-- ============================================
-- STANDARD PROVISION CONFIG (Global Defaults)
-- ============================================

-- Füge einen Eintrag ohne versicherung_id als globale Defaults hinzu
INSERT INTO provision_configs (id, versicherung_id, frontscheibe_steinschlag, frontscheibe_austausch, seitenscheibe_austausch, heckscheibe_austausch)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    NULL,
    10.00,
    50.00,
    20.00,
    20.00
)
ON CONFLICT DO NOTHING;

-- ============================================
-- HILFSFUNKTION: Provision berechnen
-- ============================================

CREATE OR REPLACE FUNCTION calculate_provision(
    p_versicherung_id UUID,
    p_schadensart damage_type
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_provision DECIMAL(10,2);
    v_config RECORD;
BEGIN
    -- Versuche spezifische Config für diese Versicherung zu finden
    SELECT * INTO v_config
    FROM provision_configs
    WHERE versicherung_id = p_versicherung_id;

    -- Falls keine spezifische Config, nutze Defaults
    IF NOT FOUND THEN
        SELECT * INTO v_config
        FROM provision_configs
        WHERE versicherung_id IS NULL;
    END IF;

    -- Berechne Provision basierend auf Schadensart
    CASE p_schadensart
        WHEN 'frontscheibe_steinschlag', 'steinschlag' THEN
            v_provision := v_config.frontscheibe_steinschlag;
        WHEN 'frontscheibe_austausch', 'austausch' THEN
            v_provision := v_config.frontscheibe_austausch;
        WHEN 'seitenscheibe_austausch' THEN
            v_provision := v_config.seitenscheibe_austausch;
        WHEN 'heckscheibe_austausch' THEN
            v_provision := v_config.heckscheibe_austausch;
        ELSE
            v_provision := 0;
    END CASE;

    RETURN COALESCE(v_provision, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Automatische Provisionsberechnung
-- ============================================

CREATE OR REPLACE FUNCTION auto_calculate_provision()
RETURNS TRIGGER AS $$
BEGIN
    -- Berechne Provision automatisch wenn Schadensart gesetzt
    IF NEW.schadensart IS NOT NULL THEN
        NEW.provision_amount := calculate_provision(NEW.versicherung_id, NEW.schadensart);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger nur bei INSERT oder wenn schadensart geändert wird
DROP TRIGGER IF EXISTS auto_provision_on_claim ON claims;
CREATE TRIGGER auto_provision_on_claim
    BEFORE INSERT OR UPDATE OF schadensart ON claims
    FOR EACH ROW EXECUTE FUNCTION auto_calculate_provision();

-- ============================================
-- AUDIT TRIGGER FÜR PROVISION_CONFIGS
-- ============================================

CREATE TRIGGER audit_provision_configs
    AFTER INSERT OR UPDATE OR DELETE ON provision_configs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
