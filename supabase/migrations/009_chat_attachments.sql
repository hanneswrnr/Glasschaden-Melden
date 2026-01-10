-- Migration: Chat Message Attachments
-- Adds support for file attachments in the chat system

-- ============================================
-- 1. Create message_attachments table
-- ============================================
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES claim_messages(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by message
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- ============================================
-- 2. Enable RLS on message_attachments
-- ============================================
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies for message_attachments
-- ============================================

-- Admin full access
CREATE POLICY "admin_full_access_message_attachments"
ON message_attachments FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Versicherung can view attachments for their claims
CREATE POLICY "versicherung_view_message_attachments"
ON message_attachments FOR SELECT
TO authenticated
USING (
    get_user_role() = 'versicherung' AND
    EXISTS (
        SELECT 1 FROM claim_messages cm
        JOIN claims c ON cm.claim_id = c.id
        WHERE cm.id = message_attachments.message_id
        AND c.versicherung_id = get_user_versicherung_id()
    )
);

-- Versicherung can insert attachments for their claims
CREATE POLICY "versicherung_insert_message_attachments"
ON message_attachments FOR INSERT
TO authenticated
WITH CHECK (
    get_user_role() = 'versicherung' AND
    EXISTS (
        SELECT 1 FROM claim_messages cm
        JOIN claims c ON cm.claim_id = c.id
        WHERE cm.id = message_attachments.message_id
        AND c.versicherung_id = get_user_versicherung_id()
    )
);

-- Werkstatt can view attachments for their claims
CREATE POLICY "werkstatt_view_message_attachments"
ON message_attachments FOR SELECT
TO authenticated
USING (
    get_user_role() = 'werkstatt' AND
    EXISTS (
        SELECT 1 FROM claim_messages cm
        JOIN claims c ON cm.claim_id = c.id
        WHERE cm.id = message_attachments.message_id
        AND c.werkstatt_standort_id IN (
            SELECT id FROM werkstatt_standorte
            WHERE werkstatt_id = get_user_werkstatt_id()
        )
    )
);

-- Werkstatt can insert attachments for their claims
CREATE POLICY "werkstatt_insert_message_attachments"
ON message_attachments FOR INSERT
TO authenticated
WITH CHECK (
    get_user_role() = 'werkstatt' AND
    EXISTS (
        SELECT 1 FROM claim_messages cm
        JOIN claims c ON cm.claim_id = c.id
        WHERE cm.id = message_attachments.message_id
        AND c.werkstatt_standort_id IN (
            SELECT id FROM werkstatt_standorte
            WHERE werkstatt_id = get_user_werkstatt_id()
        )
    )
);

-- ============================================
-- 4. Storage Bucket for Chat Attachments
-- ============================================
-- Note: This needs to be run in Supabase Dashboard or via Supabase CLI
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'chat-attachments',
--     'chat-attachments',
--     false,
--     5242880, -- 5MB limit
--     ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
-- );

-- ============================================
-- 5. Storage Policies (run in Supabase Dashboard)
-- ============================================
-- These policies need to be created via the Supabase Dashboard or API:
--
-- Policy: "Authenticated users can upload to chat-attachments"
-- Operation: INSERT
-- Expression: auth.role() = 'authenticated'
--
-- Policy: "Users can view their claim attachments"
-- Operation: SELECT
-- Expression: auth.role() = 'authenticated'
--
-- Policy: "Users can delete their own uploads"
-- Operation: DELETE
-- Expression: auth.uid() = owner
