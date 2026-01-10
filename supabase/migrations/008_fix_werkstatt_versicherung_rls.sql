-- ============================================
-- FIX: Werkstatt kann Versicherungsdaten für ihre Claims lesen
-- Migration: 008_fix_werkstatt_versicherung_rls.sql
-- ============================================

-- Lösche die alte Policy
DROP POLICY IF EXISTS "Werkstatt sieht zugewiesene Versicherungen" ON versicherungen;

-- Erstelle eine verbesserte Policy mit einfacherem Check
-- Diese Policy erlaubt Werkstätten, Versicherungsdaten zu lesen,
-- wenn sie einen Claim von dieser Versicherung haben
CREATE POLICY "Werkstatt sieht zugewiesene Versicherungen"
    ON versicherungen FOR SELECT
    TO authenticated
    USING (
        -- Prüfe ob User Werkstatt-Rolle hat
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'werkstatt'
        )
        AND
        -- Prüfe ob ein Claim existiert, der diese Versicherung mit einem Standort der Werkstatt verbindet
        EXISTS (
            SELECT 1
            FROM claims c
            INNER JOIN werkstatt_standorte ws ON ws.id = c.werkstatt_standort_id
            INNER JOIN werkstaetten w ON w.id = ws.werkstatt_id
            WHERE c.versicherung_id = versicherungen.id
            AND w.user_id = auth.uid()
        )
    );

-- Alternative: Falls die obige Policy noch zu komplex ist,
-- kann eine noch einfachere Version verwendet werden (auskommentiert):
-- Diese würde allen Werkstätten erlauben, alle Versicherungen zu lesen,
-- was aus Datenschutzsicht nicht ideal ist, aber funktionieren würde.
/*
CREATE POLICY "Werkstatt sieht alle Versicherungen"
    ON versicherungen FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'werkstatt'
        )
    );
*/
