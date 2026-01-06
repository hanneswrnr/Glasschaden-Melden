-- ============================================
-- GLASSCHADEN MELDEN - ADMIN BOOTSTRAP LOGIK
-- Migration: 003_admin_bootstrap.sql
-- ============================================

-- ============================================
-- BOOTSTRAP ADMIN FUNCTION
--
-- Diese Funktion wird NUR EINMAL erfolgreich ausgeführt.
-- Der erste User, der diese Funktion auf der Route
-- /auth/system-access/x-portal-x aufruft, wird Admin.
-- Danach ist die Funktion permanent gesperrt.
-- ============================================

CREATE OR REPLACE FUNCTION bootstrap_admin(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    bootstrap_status JSONB;
    is_locked BOOLEAN;
BEGIN
    -- Hole aktuellen Bootstrap-Status
    SELECT value INTO bootstrap_status
    FROM system_settings
    WHERE key = 'admin_bootstrap';

    -- Prüfe ob bereits gelockt
    is_locked := COALESCE((bootstrap_status->>'locked')::BOOLEAN, false);

    IF is_locked THEN
        -- Bootstrap bereits abgeschlossen
        RETURN jsonb_build_object(
            'success', false,
            'error', 'BOOTSTRAP_LOCKED',
            'message', 'Admin-Bootstrap wurde bereits durchgeführt. Diese Funktion ist permanent deaktiviert.'
        );
    END IF;

    -- Prüfe ob der User existiert
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'USER_NOT_FOUND',
            'message', 'Der angegebene User existiert nicht.'
        );
    END IF;

    -- Setze User als Admin
    UPDATE profiles
    SET role = 'admin', updated_at = NOW()
    WHERE id = target_user_id;

    -- PERMANENT: Sperre Bootstrap-Funktion
    UPDATE system_settings
    SET value = jsonb_build_object(
        'locked', true,
        'admin_id', target_user_id,
        'locked_at', NOW()
    ),
    updated_at = NOW()
    WHERE key = 'admin_bootstrap';

    -- Erfolg
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Admin erfolgreich eingerichtet. Bootstrap ist nun permanent deaktiviert.',
        'admin_id', target_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHECK BOOTSTRAP STATUS FUNCTION
--
-- Prüft ob Bootstrap verfügbar ist.
-- Wird vom Frontend aufgerufen um zu entscheiden,
-- ob die Registrierung auf der Admin-Route möglich ist.
-- ============================================

CREATE OR REPLACE FUNCTION check_bootstrap_status()
RETURNS JSONB AS $$
DECLARE
    bootstrap_status JSONB;
    is_locked BOOLEAN;
BEGIN
    SELECT value INTO bootstrap_status
    FROM system_settings
    WHERE key = 'admin_bootstrap';

    is_locked := COALESCE((bootstrap_status->>'locked')::BOOLEAN, false);

    RETURN jsonb_build_object(
        'available', NOT is_locked,
        'locked', is_locked
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REGISTER AS ADMIN FUNCTION
--
-- Kombinierte Funktion für Frontend:
-- 1. Registriert neuen User (falls nicht existent)
-- 2. Führt Bootstrap durch
--
-- Wird über Supabase RPC aufgerufen.
-- ============================================

CREATE OR REPLACE FUNCTION register_and_bootstrap_admin()
RETURNS JSONB AS $$
DECLARE
    current_user_id UUID;
    bootstrap_result JSONB;
BEGIN
    -- Hole aktuelle User-ID
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NOT_AUTHENTICATED',
            'message', 'User muss eingeloggt sein.'
        );
    END IF;

    -- Führe Bootstrap durch
    bootstrap_result := bootstrap_admin(current_user_id);

    RETURN bootstrap_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Erlaube authentifizierten Usern den Aufruf der Funktionen
GRANT EXECUTE ON FUNCTION bootstrap_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_bootstrap_status() TO authenticated;
GRANT EXECUTE ON FUNCTION check_bootstrap_status() TO anon;
GRANT EXECUTE ON FUNCTION register_and_bootstrap_admin() TO authenticated;
