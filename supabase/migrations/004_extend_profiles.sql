-- ============================================
-- EXTEND PROFILES TABLE WITH DISPLAY FIELDS
-- Migration: 004_extend_profiles.sql
-- ============================================

-- Add new columns to profiles table for better visibility in Supabase dashboard
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comments for clarity
COMMENT ON COLUMN profiles.display_name IS 'Ansprechpartner name for display';
COMMENT ON COLUMN profiles.company_name IS 'Company/Workshop name';
COMMENT ON COLUMN profiles.phone IS 'Contact phone number';
COMMENT ON COLUMN profiles.address IS 'Business address';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Update existing profiles from versicherungen table
UPDATE profiles p
SET
    display_name = v.ansprechpartner,
    company_name = v.firma,
    phone = v.telefon,
    address = v.adresse
FROM versicherungen v
WHERE p.id = v.user_id AND p.role = 'versicherung';

-- Update existing profiles from werkstatt_standorte (primary location)
UPDATE profiles p
SET
    display_name = ws.ansprechpartner,
    company_name = ws.name,
    phone = ws.telefon,
    address = ws.adresse
FROM werkstaetten w
JOIN werkstatt_standorte ws ON w.id = ws.werkstatt_id AND ws.is_primary = true
WHERE p.id = w.user_id AND p.role = 'werkstatt';

-- For werkstätten without primary standort, use first standort
UPDATE profiles p
SET
    display_name = ws.ansprechpartner,
    company_name = ws.name,
    phone = ws.telefon,
    address = ws.adresse
FROM werkstaetten w
JOIN werkstatt_standorte ws ON w.id = ws.werkstatt_id
WHERE p.id = w.user_id
  AND p.role = 'werkstatt'
  AND p.display_name IS NULL;
