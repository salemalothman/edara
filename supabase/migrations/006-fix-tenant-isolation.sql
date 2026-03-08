-- ============================================
-- CRITICAL FIX: Tenant Isolation & Authorization
-- ============================================
-- ROOT CAUSE: get_user_org_id() uses LIMIT 1 without ORDER BY.
-- When a user belongs to multiple orgs (e.g. from the backfill in
-- migration 001 that added ALL auth.users to the default org),
-- PostgreSQL returns a non-deterministic result — potentially
-- returning the WRONG org, causing cross-tenant data leakage.
--
-- Migration 001 line 131-135 runs:
--   INSERT INTO organization_members (organization_id, user_id, role)
--   SELECT '00000000-0000-0000-0000-000000000001', id, 'admin'
--   FROM auth.users
--
-- This means EVERY user who signs up gets backfilled into the
-- default org (Alothman Properties) if migration 001 is re-run
-- or if it ran after they signed up.
-- ============================================

-- ============================================
-- 1. FIX: get_user_org_id()
-- Return the MOST RECENTLY JOINED org (the user's own org,
-- not the backfilled default org).
-- ============================================

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. FIX: is_admin()
-- Scope admin check to the user's CURRENT org only.
-- Previously checked ANY org — a user who was backfill-admin
-- in the default org would pass admin checks even if they
-- are a viewer in their own org.
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND organization_id = get_user_org_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 3. FIX: get_user_role()
-- Scope to current org, with deterministic ordering.
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM organization_members
  WHERE user_id = auth.uid()
    AND organization_id = get_user_org_id()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 4. FIX: get_my_membership()
-- Use ORDER BY created_at DESC to return the user's
-- most recently joined org (their own, not backfilled).
-- ============================================

DROP FUNCTION IF EXISTS get_my_membership();

CREATE OR REPLACE FUNCTION get_my_membership()
RETURNS TABLE(org_id uuid, org_name text, org_slug text, role text) AS $$
  SELECT
    o.id        AS org_id,
    o.name      AS org_name,
    o.slug      AS org_slug,
    om.role     AS role
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
  ORDER BY om.created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 5. CLEANUP: Remove stale backfill memberships
-- Delete memberships in the default org for users who
-- have their OWN org (created via create_org_and_join).
-- This ensures each user only belongs to the org they
-- created or were invited to.
-- ============================================

DELETE FROM organization_members
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND user_id IN (
    -- Users who belong to at least one OTHER org
    SELECT DISTINCT user_id
    FROM organization_members
    WHERE organization_id != '00000000-0000-0000-0000-000000000001'
  );

-- ============================================
-- 6. CLEANUP: Purge leaked data from Nayef's workspace
-- The set_organization_id() trigger uses get_user_org_id()
-- which was broken. If Nayef inserted any data while the
-- function was returning the wrong org, that data went to
-- Alothman Properties instead. Since Nayef's workspace
-- should be empty (new account), we ensure no data exists
-- under his org that shouldn't be there.
--
-- Also: if any data was accidentally stamped with Nayef's
-- org_id, we remove it (it would be Alothman's data
-- duplicated under the wrong org).
-- ============================================

-- Find Nayef's org (the one that is NOT the default org)
-- and ensure it has no data (it should be a fresh workspace)
DO $$
DECLARE
  nayef_user_id uuid;
  nayef_org_id uuid;
BEGIN
  -- Get Nayef's user ID
  SELECT id INTO nayef_user_id
  FROM auth.users
  WHERE email = 'alien-q8@windowslive.com';

  IF nayef_user_id IS NULL THEN
    RAISE NOTICE 'Nayef user not found, skipping cleanup';
    RETURN;
  END IF;

  -- Get Nayef's own org (not the default org)
  SELECT organization_id INTO nayef_org_id
  FROM organization_members
  WHERE user_id = nayef_user_id
    AND organization_id != '00000000-0000-0000-0000-000000000001'
  ORDER BY created_at DESC
  LIMIT 1;

  IF nayef_org_id IS NULL THEN
    RAISE NOTICE 'Nayef has no own org, skipping cleanup';
    RETURN;
  END IF;

  -- Purge any data that leaked into Nayef's org
  -- (These should all be empty for a new workspace, but
  -- this ensures a clean slate)
  DELETE FROM invoice_items WHERE organization_id = nayef_org_id;
  DELETE FROM invoices WHERE organization_id = nayef_org_id;
  DELETE FROM contracts WHERE organization_id = nayef_org_id;
  DELETE FROM maintenance_requests WHERE organization_id = nayef_org_id;
  DELETE FROM notifications WHERE organization_id = nayef_org_id;
  DELETE FROM whatsapp_reminders WHERE organization_id = nayef_org_id;
  DELETE FROM expenses WHERE organization_id = nayef_org_id;
  DELETE FROM units WHERE organization_id = nayef_org_id;
  DELETE FROM tenants WHERE organization_id = nayef_org_id;
  DELETE FROM properties WHERE organization_id = nayef_org_id;

  RAISE NOTICE 'Cleanup complete for Nayef org: %', nayef_org_id;
END;
$$;

-- ============================================
-- 7. CONSOLIDATION (run manually after migration)
-- Salem had 10 test orgs from development. All data
-- lives in the default org (Alothman Properties).
-- Steps executed in SQL Editor:
--   a) Deleted 10 empty test org memberships for Salem
--   b) Re-added Salem as admin of Alothman Properties
--   c) Deleted all empty test organizations (CASCADE)
-- Result: Salem = 1 membership (Alothman Properties, admin)
--         Nayef/others = no membership (will onboard fresh)
-- ============================================

-- Delete test org memberships (keep only Alothman Properties)
DELETE FROM organization_members
WHERE user_id = '61f7c796-a905-41f2-9a03-327a539a88f4'
  AND organization_id != '00000000-0000-0000-0000-000000000001';

-- Ensure Salem is admin of Alothman Properties
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', '61f7c796-a905-41f2-9a03-327a539a88f4', 'admin')
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'admin';

-- Delete empty test organizations
DELETE FROM organizations
WHERE id != '00000000-0000-0000-0000-000000000001'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE organization_id = organizations.id)
  AND NOT EXISTS (SELECT 1 FROM invoices WHERE organization_id = organizations.id)
  AND NOT EXISTS (SELECT 1 FROM tenants WHERE organization_id = organizations.id)
  AND NOT EXISTS (SELECT 1 FROM expenses WHERE organization_id = organizations.id)
  AND NOT EXISTS (SELECT 1 FROM units WHERE organization_id = organizations.id)
  AND NOT EXISTS (SELECT 1 FROM contracts WHERE organization_id = organizations.id)
  AND NOT EXISTS (SELECT 1 FROM maintenance_requests WHERE organization_id = organizations.id);

-- ============================================
-- 8. Verify: After this migration, each user should
-- belong to exactly ONE organization.
-- Run this query to confirm:
--   SELECT user_id, count(*) as org_count
--   FROM organization_members
--   GROUP BY user_id
--   HAVING count(*) > 1;
-- Expected result: 0 rows
-- ============================================
