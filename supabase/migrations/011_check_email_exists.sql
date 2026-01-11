-- ============================================
-- GLASSCHADEN MELDEN - EMAIL EXISTENCE CHECK
-- Migration: 011_check_email_exists.sql
--
-- Erstellt eine Funktion zum Prüfen ob eine E-Mail
-- bereits in auth.users registriert ist.
-- ============================================

-- Funktion zum Prüfen ob E-Mail bereits existiert
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(email_to_check)
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;
