-- ============================================
-- GLASSCHADEN MELDEN - ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- ============================================

-- Aktiviere RLS auf allen Tabellen
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE versicherungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE werkstaetten ENABLE ROW LEVEL SECURITY;
ALTER TABLE werkstatt_standorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Prüft ob aktueller User Admin ist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Holt Rolle des aktuellen Users
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Holt Versicherung-ID des aktuellen Users
CREATE OR REPLACE FUNCTION get_user_versicherung_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM versicherungen
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Holt Werkstatt-ID des aktuellen Users
CREATE OR REPLACE FUNCTION get_user_werkstatt_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM werkstaetten
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Admin kann alle Profile sehen
CREATE POLICY "Admin kann alle Profile sehen"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin());

-- User sieht eigenes Profil
CREATE POLICY "User sieht eigenes Profil"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- User kann eigenes Profil updaten
CREATE POLICY "User kann eigenes Profil updaten"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================
-- SYSTEM SETTINGS POLICIES
-- ============================================

-- Nur Admin kann Settings sehen
CREATE POLICY "Admin sieht Settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_admin());

-- Bootstrap-Check muss für alle lesbar sein (für Registrierung)
CREATE POLICY "Bootstrap Status lesbar"
    ON system_settings FOR SELECT
    TO authenticated
    USING (key = 'admin_bootstrap');

-- Nur Admin kann Settings ändern
CREATE POLICY "Admin ändert Settings"
    ON system_settings FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- VERSICHERUNGEN POLICIES
-- ============================================

-- Admin sieht alle Versicherungen
CREATE POLICY "Admin sieht alle Versicherungen"
    ON versicherungen FOR SELECT
    TO authenticated
    USING (is_admin());

-- Versicherung sieht nur eigene Firma
CREATE POLICY "Versicherung sieht eigene Firma"
    ON versicherungen FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Werkstatt sieht Versicherungen ihrer Claims
CREATE POLICY "Werkstatt sieht zugewiesene Versicherungen"
    ON versicherungen FOR SELECT
    TO authenticated
    USING (
        get_user_role() = 'werkstatt' AND
        EXISTS (
            SELECT 1 FROM claims c
            JOIN werkstatt_standorte ws ON c.werkstatt_standort_id = ws.id
            WHERE c.versicherung_id = versicherungen.id
            AND ws.werkstatt_id = get_user_werkstatt_id()
        )
    );

-- Versicherung erstellt eigene Firma
CREATE POLICY "Versicherung erstellt eigene Firma"
    ON versicherungen FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND get_user_role() = 'versicherung');

-- Versicherung aktualisiert eigene Firma
CREATE POLICY "Versicherung aktualisiert eigene Firma"
    ON versicherungen FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- WERKSTAETTEN POLICIES
-- ============================================

-- Admin sieht alle Werkstätten
CREATE POLICY "Admin sieht alle Werkstätten"
    ON werkstaetten FOR SELECT
    TO authenticated
    USING (is_admin());

-- Werkstatt sieht eigene Firma
CREATE POLICY "Werkstatt sieht eigene Firma"
    ON werkstaetten FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Werkstatt erstellt eigene Firma
CREATE POLICY "Werkstatt erstellt eigene Firma"
    ON werkstaetten FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND get_user_role() = 'werkstatt');

-- Werkstatt aktualisiert eigene Firma
CREATE POLICY "Werkstatt aktualisiert eigene Firma"
    ON werkstaetten FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- WERKSTATT STANDORTE POLICIES
-- ============================================

-- Admin sieht alle Standorte
CREATE POLICY "Admin sieht alle Standorte"
    ON werkstatt_standorte FOR SELECT
    TO authenticated
    USING (is_admin());

-- Werkstatt sieht eigene Standorte
CREATE POLICY "Werkstatt sieht eigene Standorte"
    ON werkstatt_standorte FOR SELECT
    TO authenticated
    USING (werkstatt_id = get_user_werkstatt_id());

-- Versicherung sieht Standorte für Zuweisung
CREATE POLICY "Versicherung sieht alle Standorte für Zuweisung"
    ON werkstatt_standorte FOR SELECT
    TO authenticated
    USING (get_user_role() = 'versicherung');

-- Werkstatt erstellt eigene Standorte
CREATE POLICY "Werkstatt erstellt eigene Standorte"
    ON werkstatt_standorte FOR INSERT
    TO authenticated
    WITH CHECK (werkstatt_id = get_user_werkstatt_id());

-- Werkstatt aktualisiert eigene Standorte
CREATE POLICY "Werkstatt aktualisiert eigene Standorte"
    ON werkstatt_standorte FOR UPDATE
    TO authenticated
    USING (werkstatt_id = get_user_werkstatt_id())
    WITH CHECK (werkstatt_id = get_user_werkstatt_id());

-- Werkstatt löscht eigene Standorte
CREATE POLICY "Werkstatt löscht eigene Standorte"
    ON werkstatt_standorte FOR DELETE
    TO authenticated
    USING (werkstatt_id = get_user_werkstatt_id());

-- ============================================
-- CLAIMS POLICIES
-- ============================================

-- Admin sieht alle Claims
CREATE POLICY "Admin sieht alle Claims"
    ON claims FOR SELECT
    TO authenticated
    USING (is_admin());

-- Versicherung sieht eigene Claims
CREATE POLICY "Versicherung sieht eigene Claims"
    ON claims FOR SELECT
    TO authenticated
    USING (versicherung_id = get_user_versicherung_id());

-- Werkstatt sieht zugewiesene Claims
CREATE POLICY "Werkstatt sieht zugewiesene Claims"
    ON claims FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM werkstatt_standorte ws
            WHERE ws.id = claims.werkstatt_standort_id
            AND ws.werkstatt_id = get_user_werkstatt_id()
        )
    );

-- Versicherung erstellt Claims
CREATE POLICY "Versicherung erstellt Claims"
    ON claims FOR INSERT
    TO authenticated
    WITH CHECK (
        versicherung_id = get_user_versicherung_id() AND
        get_user_role() = 'versicherung'
    );

-- Versicherung aktualisiert eigene Claims (eingeschränkt)
CREATE POLICY "Versicherung aktualisiert eigene Claims"
    ON claims FOR UPDATE
    TO authenticated
    USING (versicherung_id = get_user_versicherung_id())
    WITH CHECK (versicherung_id = get_user_versicherung_id());

-- Werkstatt aktualisiert zugewiesene Claims (für Korrekturen)
CREATE POLICY "Werkstatt aktualisiert zugewiesene Claims"
    ON claims FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM werkstatt_standorte ws
            WHERE ws.id = claims.werkstatt_standort_id
            AND ws.werkstatt_id = get_user_werkstatt_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM werkstatt_standorte ws
            WHERE ws.id = claims.werkstatt_standort_id
            AND ws.werkstatt_id = get_user_werkstatt_id()
        )
    );

-- Admin kann Claims löschen (Soft Delete)
CREATE POLICY "Admin archiviert Claims"
    ON claims FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- CLAIM ATTACHMENTS POLICIES
-- ============================================

-- Admin sieht alle Attachments
CREATE POLICY "Admin sieht alle Attachments"
    ON claim_attachments FOR SELECT
    TO authenticated
    USING (is_admin());

-- User sieht Attachments ihrer Claims
CREATE POLICY "User sieht eigene Claim Attachments"
    ON claim_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM claims c
            WHERE c.id = claim_attachments.claim_id
            AND (
                c.versicherung_id = get_user_versicherung_id() OR
                EXISTS (
                    SELECT 1 FROM werkstatt_standorte ws
                    WHERE ws.id = c.werkstatt_standort_id
                    AND ws.werkstatt_id = get_user_werkstatt_id()
                )
            )
        )
    );

-- Versicherung erstellt Attachments für eigene Claims
CREATE POLICY "Versicherung erstellt Attachments"
    ON claim_attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM claims c
            WHERE c.id = claim_attachments.claim_id
            AND c.versicherung_id = get_user_versicherung_id()
        )
    );

-- ============================================
-- CLAIM MESSAGES POLICIES
-- ============================================

-- Admin sieht alle Nachrichten
CREATE POLICY "Admin sieht alle Nachrichten"
    ON claim_messages FOR SELECT
    TO authenticated
    USING (is_admin());

-- User sieht Nachrichten ihrer Claims
CREATE POLICY "User sieht eigene Claim Nachrichten"
    ON claim_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM claims c
            WHERE c.id = claim_messages.claim_id
            AND (
                c.versicherung_id = get_user_versicherung_id() OR
                EXISTS (
                    SELECT 1 FROM werkstatt_standorte ws
                    WHERE ws.id = c.werkstatt_standort_id
                    AND ws.werkstatt_id = get_user_werkstatt_id()
                )
            )
        )
    );

-- User erstellt Nachrichten für berechtigte Claims
CREATE POLICY "User erstellt Nachrichten"
    ON claim_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM claims c
            WHERE c.id = claim_messages.claim_id
            AND (
                c.versicherung_id = get_user_versicherung_id() OR
                EXISTS (
                    SELECT 1 FROM werkstatt_standorte ws
                    WHERE ws.id = c.werkstatt_standort_id
                    AND ws.werkstatt_id = get_user_werkstatt_id()
                )
            )
        )
    );

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================

-- Nur Admin sieht Audit Log
CREATE POLICY "Nur Admin sieht Audit Log"
    ON audit_log FOR SELECT
    TO authenticated
    USING (is_admin());

-- System kann Audit Log schreiben (via trigger)
CREATE POLICY "System schreibt Audit Log"
    ON audit_log FOR INSERT
    TO authenticated
    WITH CHECK (true);
