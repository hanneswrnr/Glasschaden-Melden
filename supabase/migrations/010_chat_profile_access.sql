-- ============================================
-- GLASSCHADEN MELDEN - CHAT SENDER INFO
-- Migration: 010_chat_profile_access.sql
--
-- Problem: Werkstatt/Versicherung können Profile anderer
-- Chat-Teilnehmer nicht lesen (RLS blockiert).
-- Lösung: Sender-Info direkt in claim_messages speichern.
-- ============================================

-- Füge Sender-Info Spalten zur claim_messages Tabelle hinzu
ALTER TABLE claim_messages
ADD COLUMN IF NOT EXISTS sender_role TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_address TEXT;
