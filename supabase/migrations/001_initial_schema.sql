-- ============================================
-- GLASSCHADEN MELDEN - INITIALES DATENBANK-SCHEMA
-- Migration: 001_initial_schema.sql
-- ============================================

-- Aktiviere UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'versicherung', 'werkstatt');
CREATE TYPE claim_status AS ENUM ('neu', 'in_bearbeitung', 'abgeschlossen', 'storniert');
CREATE TYPE damage_type AS ENUM ('steinschlag', 'riss', 'austausch', 'sonstiges');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ============================================
-- SYSTEM SETTINGS (Admin Bootstrap Lock)
-- ============================================

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialer Eintrag für Admin-Bootstrap
INSERT INTO system_settings (key, value)
VALUES ('admin_bootstrap', '{"locked": false}');

-- ============================================
-- PROFILES (Erweitert auth.users)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'versicherung',
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger für automatische Profile-Erstellung bei User-Registrierung
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'versicherung');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VERSICHERUNGEN (Auftraggeber-Firmen)
-- ============================================

CREATE TABLE versicherungen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    firma TEXT NOT NULL,
    adresse TEXT NOT NULL,
    ansprechpartner TEXT NOT NULL,
    email TEXT NOT NULL,
    telefon TEXT NOT NULL,
    bankname TEXT,
    iban TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_versicherung_user UNIQUE (user_id)
);

-- ============================================
-- WERKSTÄTTEN (Auftragnehmer-Hauptaccounts)
-- ============================================

CREATE TABLE werkstaetten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_werkstatt_user UNIQUE (user_id)
);

-- ============================================
-- WERKSTATT STANDORTE (Multi-Location Support)
-- ============================================

CREATE TABLE werkstatt_standorte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    werkstatt_id UUID NOT NULL REFERENCES werkstaetten(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    adresse TEXT NOT NULL,
    ansprechpartner TEXT NOT NULL,
    telefon TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Standort-Abfragen
CREATE INDEX idx_standorte_werkstatt ON werkstatt_standorte(werkstatt_id);

-- ============================================
-- CLAIMS (Schadensmeldungen)
-- ============================================

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Beziehungen
    versicherung_id UUID NOT NULL REFERENCES versicherungen(id) ON DELETE RESTRICT,
    werkstatt_standort_id UUID REFERENCES werkstatt_standorte(id) ON DELETE SET NULL,

    -- Status
    status claim_status NOT NULL DEFAULT 'neu',

    -- Kundendaten
    kunde_vorname TEXT NOT NULL,
    kunde_nachname TEXT NOT NULL,
    kunde_telefon TEXT NOT NULL,
    vers_name TEXT NOT NULL,          -- Name der Versicherung des Kunden
    vers_nr TEXT NOT NULL,            -- Versicherungsnummer
    selbstbeteiligung DECIMAL(10,2) DEFAULT 0,

    -- Fahrzeugdaten
    fahrzeug_marke TEXT NOT NULL,
    fahrzeug_modell TEXT NOT NULL,
    kennzeichen TEXT NOT NULL,
    vin TEXT NOT NULL,

    -- Schadensdaten
    schaden_datum DATE NOT NULL,
    schadensart damage_type NOT NULL,
    beschreibung TEXT,

    -- Provision
    provision_amount DECIMAL(10,2) DEFAULT 0,
    provision_paid BOOLEAN DEFAULT FALSE,

    -- Soft Delete
    is_archived BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- VIN Constraint: 17 Zeichen, keine I, O, Q (ISO 3779)
    CONSTRAINT valid_vin CHECK (
        LENGTH(vin) = 17 AND
        vin !~ '[IOQioq]' AND
        vin ~ '^[A-HJ-NPR-Z0-9]{17}$'
    )
);

-- Performance-Indizes
CREATE INDEX idx_claims_vin ON claims(vin);
CREATE INDEX idx_claims_kennzeichen ON claims(kennzeichen);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_versicherung ON claims(versicherung_id);
CREATE INDEX idx_claims_werkstatt ON claims(werkstatt_standort_id);
CREATE INDEX idx_claims_archived ON claims(is_archived) WHERE is_archived = FALSE;

-- ============================================
-- CLAIM ATTACHMENTS (Foto-Uploads)
-- ============================================

CREATE TABLE claim_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_claim ON claim_attachments(claim_id);

-- ============================================
-- CLAIM MESSAGES (Chat zwischen Versicherung & Werkstatt)
-- ============================================

CREATE TABLE claim_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_claim ON claim_messages(claim_id);
CREATE INDEX idx_messages_created ON claim_messages(created_at);

-- ============================================
-- AUDIT LOG (Änderungsprotokoll)
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- AUDIT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    actor UUID;
BEGIN
    -- Versuche actor aus auth.uid() zu bekommen
    actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, actor_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), actor);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, actor_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), actor);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, actor_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), actor);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit Triggers auf relevanten Tabellen
CREATE TRIGGER audit_claims
    AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_versicherungen
    AFTER INSERT OR UPDATE OR DELETE ON versicherungen
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_werkstaetten
    AFTER INSERT OR UPDATE OR DELETE ON werkstaetten
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_werkstatt_standorte
    AFTER INSERT OR UPDATE OR DELETE ON werkstatt_standorte
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_versicherungen
    BEFORE UPDATE ON versicherungen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_werkstaetten
    BEFORE UPDATE ON werkstaetten
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_standorte
    BEFORE UPDATE ON werkstatt_standorte
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_claims
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_system
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
