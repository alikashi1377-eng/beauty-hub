-- =============================================================================
-- Migration: 001_core_helpers.sql
-- Purpose:   Core trigger functions and shared database helpers for PostgreSQL 17.
-- Note:      Uses PostgreSQL 17 built-in gen_random_uuid(). No extension required here.
-- Transactional: YES (executed inside BEGIN ... COMMIT by migration runner)
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;
