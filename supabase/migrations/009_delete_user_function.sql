-- Migration: Add function to completely delete a user including auth.users entry
-- This function must run with elevated privileges (SECURITY DEFINER)
-- to be able to delete from auth.users

CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id UUID;
  werkstatt_record_id UUID;
BEGIN
  -- Get the calling user's ID
  calling_user_id := auth.uid();

  -- Verify the calling user is deleting their own account (or is admin)
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF calling_user_id != user_id_to_delete THEN
    -- Check if the calling user is an admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = calling_user_id AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Not authorized to delete this account';
    END IF;
  END IF;

  -- Delete versicherung data if exists
  DELETE FROM versicherungen WHERE user_id = user_id_to_delete;

  -- Delete werkstatt data if exists
  SELECT id INTO werkstatt_record_id FROM werkstaetten WHERE user_id = user_id_to_delete;
  IF werkstatt_record_id IS NOT NULL THEN
    -- Delete all standorte first (should cascade, but being explicit)
    DELETE FROM werkstatt_standorte WHERE werkstatt_id = werkstatt_record_id;
    -- Delete werkstatt
    DELETE FROM werkstaetten WHERE id = werkstatt_record_id;
  END IF;

  -- Delete profile
  DELETE FROM profiles WHERE id = user_id_to_delete;

  -- Delete from auth.users (this is the critical part that requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = user_id_to_delete;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION delete_user_completely IS 'Completely deletes a user account including all related data and the auth.users entry. Users can only delete their own accounts unless they are admins.';
