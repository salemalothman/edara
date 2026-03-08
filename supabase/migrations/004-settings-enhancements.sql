-- ============================================
-- SETTINGS ENHANCEMENTS
-- 1. Update get_org_members_with_email to return full_name
-- 2. Elevate Salem to admin for Alothman Properties
-- ============================================

-- ============================================
-- 1. Updated RPC: get_org_members_with_email
-- Now returns user_full_name from auth.users metadata
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
    AND om.organization_id = get_user_org_id()
  ORDER BY om.created_at;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. Elevate Salem (salem.alothman@gmail.com) to admin
-- for the Alothman Properties organization
-- ============================================

UPDATE organization_members
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'salem.alothman@gmail.com'
)
AND organization_id = (
  SELECT id FROM organizations WHERE name = 'Alothman Properties'
);
