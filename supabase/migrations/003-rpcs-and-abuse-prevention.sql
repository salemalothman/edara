-- ============================================
-- MISSING RPCs + ABUSE PREVENTION
-- ============================================

-- ============================================
-- 1. get_my_membership() RPC
-- Returns the current user's organization membership
-- Consumer: contexts/organization-context.tsx
-- ============================================

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
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. get_org_members_with_email(org_id uuid) RPC
-- Returns members of a given org with their email
-- Consumer: app/(main)/settings/settings-content.tsx
-- ============================================

CREATE OR REPLACE FUNCTION get_org_members_with_email(org_id uuid)
RETURNS TABLE(id uuid, user_id uuid, role text, created_at timestamptz, user_email text) AS $$
  SELECT
    om.id          AS id,
    om.user_id     AS user_id,
    om.role        AS role,
    om.created_at  AS created_at,
    u.email        AS user_email
  FROM organization_members om
  JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = org_id
    AND om.organization_id = get_user_org_id()
  ORDER BY om.created_at;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 3. Rate-limited create_org_and_join
-- Overrides the version from 001-multi-tenancy.sql
-- Limits each user to a maximum of 3 organizations
-- ============================================

CREATE OR REPLACE FUNCTION create_org_and_join(org_name text)
RETURNS uuid AS $$
DECLARE
  new_org_id uuid;
  org_slug text;
  membership_count int;
BEGIN
  -- Abuse prevention: limit to 3 organizations per user
  SELECT count(*) INTO membership_count
  FROM organization_members
  WHERE user_id = auth.uid();

  IF membership_count >= 3 THEN
    RAISE EXCEPTION 'Maximum number of organizations (3) reached';
  END IF;

  -- Generate slug from name
  org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8);

  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'admin');

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Auto-set invited_by on invitations
-- Sets invited_by to the current authenticated user
-- ============================================

CREATE OR REPLACE FUNCTION set_invitation_invited_by()
RETURNS trigger AS $$
BEGIN
  NEW.invited_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_invited_by
  BEFORE INSERT ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_invited_by();
