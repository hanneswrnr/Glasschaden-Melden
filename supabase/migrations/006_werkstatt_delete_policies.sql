-- ============================================
-- GLASSCHADEN MELDEN - ERWEITERTE POLICIES FÜR WERKSTATT UND ADMIN
-- Migration: 006_werkstatt_delete_policies.sql
-- ============================================

-- ============================================
-- CLAIMS DELETE POLICIES
-- ============================================

-- Werkstatt kann zugewiesene Claims löschen
CREATE POLICY "Werkstatt löscht zugewiesene Claims"
    ON claims FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM werkstatt_standorte ws
            WHERE ws.id = claims.werkstatt_standort_id
            AND ws.werkstatt_id = get_user_werkstatt_id()
        )
    );

-- Admin kann alle Claims löschen
CREATE POLICY "Admin löscht alle Claims"
    ON claims FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================
-- HELPER FUNCTION FÜR STANDORT-UNASSIGN
-- ============================================

-- Funktion um Claims von einem Standort zu entfernen (für Standort-Löschung)
CREATE OR REPLACE FUNCTION unassign_claims_from_standort(standort_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Prüfe ob der User Besitzer des Standorts ist
    IF NOT EXISTS (
        SELECT 1 FROM werkstatt_standorte ws
        WHERE ws.id = standort_uuid
        AND ws.werkstatt_id = get_user_werkstatt_id()
    ) THEN
        RAISE EXCEPTION 'Kein Zugriff auf diesen Standort';
    END IF;

    -- Update claims - setze werkstatt_standort_id auf NULL
    UPDATE claims
    SET werkstatt_standort_id = NULL, updated_at = NOW()
    WHERE werkstatt_standort_id = standort_uuid;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ERWEITERTE ADMIN UPDATE POLICY
-- ============================================

-- Admin kann alle Claims aktualisieren (volle Kontrolle)
DROP POLICY IF EXISTS "Admin archiviert Claims" ON claims;

CREATE POLICY "Admin aktualisiert alle Claims"
    ON claims FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
