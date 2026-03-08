-- ============================================
-- ROBUST TENANT FUNCTIONS
-- Comprehensive rewrite of all helper functions
-- to eliminate caching issues, race conditions,
-- and fragile cross-function dependencies.
-- ============================================

-- ============================================
-- 1. get_user_org_id() — VOLATILE (no caching)
-- Returns the user's current org. Uses VOLATILE
-- instead of STABLE to prevent PostgreSQL from
-- caching stale results across RPC calls within
-- the same session.
-- ============================================

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER VOLATILE;

-- ============================================
-- 2. is_admin() — VOLATILE, scoped to current org
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND organization_id = (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        ORDER BY created_at DESC
        LIMIT 1
      )
  );
$$ LANGUAGE sql SECURITY DEFINER VOLATILE;

-- ============================================
-- 3. get_user_role() — VOLATILE, scoped to current org
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM organization_members
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER VOLATILE;

-- ============================================
-- 4. get_my_membership() — VOLATILE
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
$$ LANGUAGE sql SECURITY DEFINER VOLATILE;

-- ============================================
-- 5. get_org_members_with_email() — REWRITE
-- Remove the fragile get_user_org_id() cross-check.
-- Instead, verify the caller IS a member of the
-- requested org directly. This eliminates the
-- mismatch bug where cached get_user_org_id()
-- returns a different value than the org_id param.
-- ============================================

DROP FUNCTION IF EXISTS get_org_members_with_email(uuid);

CREATE OR REPLACE FUNCTION get_org_members_with_email(org_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  user_email text,
  user_full_name text
) AS $$
  SELECT
    om.id          AS id,
    om.user_id     AS user_id,
    om.role        AS role,
    om.created_at  AS created_at,
    u.email        AS user_email,
    u.raw_user_meta_data->>'full_name' AS user_full_name
  FROM organization_members om
  JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = org_id
    -- Security: verify the caller is a member of this org
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
        AND organization_id = org_id
    )
  ORDER BY om.created_at;
$$ LANGUAGE sql SECURITY DEFINER VOLATILE;
