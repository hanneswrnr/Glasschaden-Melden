-- Migration: Auftragsnummer-System und Soft-Delete
-- Fügt eine lesbare Auftragsnummer hinzu (Format: GS-2025-0001)
-- Implementiert Soft-Delete mit Papierkorb-Funktion

-- 1. Neue Spalten für Auftragsnummer und Soft-Delete hinzufügen
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS auftragsnummer VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Index für schnelle Suche nach Auftragsnummer
CREATE INDEX IF NOT EXISTS idx_claims_auftragsnummer ON claims(auftragsnummer);
CREATE INDEX IF NOT EXISTS idx_claims_is_deleted ON claims(is_deleted);

-- 3. Sequenz für fortlaufende Nummern pro Jahr
CREATE SEQUENCE IF NOT EXISTS claims_number_seq START 1;

-- 4. Funktion zum Generieren der Auftragsnummer
CREATE OR REPLACE FUNCTION generate_auftragsnummer()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_number INTEGER;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');

    -- Hole die nächste Nummer für dieses Jahr
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(auftragsnummer FROM 9 FOR 4) AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM claims
    WHERE auftragsnummer LIKE 'GS-' || current_year || '-%';

    -- Generiere die Auftragsnummer im Format GS-YYYY-NNNN
    NEW.auftragsnummer := 'GS-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger für automatische Auftragsnummer-Generierung
DROP TRIGGER IF EXISTS set_auftragsnummer ON claims;
CREATE TRIGGER set_auftragsnummer
    BEFORE INSERT ON claims
    FOR EACH ROW
    WHEN (NEW.auftragsnummer IS NULL)
    EXECUTE FUNCTION generate_auftragsnummer();

-- 6. Bestehende Claims mit Auftragsnummern versehen
DO $$
DECLARE
    claim_record RECORD;
    current_year TEXT;
    counter INTEGER := 0;
BEGIN
    FOR claim_record IN
        SELECT id, created_at
        FROM claims
        WHERE auftragsnummer IS NULL
        ORDER BY created_at ASC
    LOOP
        current_year := TO_CHAR(claim_record.created_at, 'YYYY');
        counter := counter + 1;

        UPDATE claims
        SET auftragsnummer = 'GS-' || current_year || '-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = claim_record.id;
    END LOOP;
END $$;

-- 7. Funktion zum Soft-Delete eines Claims
CREATE OR REPLACE FUNCTION soft_delete_claim(claim_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE claims
    SET is_deleted = TRUE,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = claim_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Funktion zum Wiederherstellen eines Claims
CREATE OR REPLACE FUNCTION restore_claim(claim_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE claims
    SET is_deleted = FALSE,
        deleted_at = NULL,
        updated_at = NOW()
    WHERE id = claim_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Funktion zum permanenten Löschen eines Claims (nur aus Papierkorb)
CREATE OR REPLACE FUNCTION permanent_delete_claim(claim_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_in_trash BOOLEAN;
BEGIN
    -- Prüfe ob der Claim im Papierkorb ist
    SELECT is_deleted INTO is_in_trash
    FROM claims
    WHERE id = claim_uuid;

    -- Nur löschen wenn im Papierkorb
    IF is_in_trash = TRUE THEN
        DELETE FROM claims WHERE id = claim_uuid;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant Permissions für die neuen Funktionen
GRANT EXECUTE ON FUNCTION soft_delete_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION permanent_delete_claim(UUID) TO authenticated;

-- 11. RLS Policies aktualisieren um gelöschte Claims auszuschließen
-- Bestehende Policies updaten (sofern sie nicht bereits is_deleted prüfen)

-- Hinweis: Die bestehenden SELECT Policies sollten um
-- "AND is_deleted = FALSE" erweitert werden für normale Ansichten.
-- Für Papierkorb-Ansichten wird "AND is_deleted = TRUE" verwendet.
