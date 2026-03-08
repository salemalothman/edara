-- ============================================
-- FIX: Invitations RLS + Salem's display name
-- ============================================

-- ============================================
-- 1. Fix invitations SELECT policy
-- The old policy queries auth.users directly, which the
-- authenticated role cannot access. Replace with auth.jwt().
-- ============================================

DROP POLICY IF EXISTS "invitations_select" ON invitations;

CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    organization_id = get_user_org_id()
    OR email = (auth.jwt()->>'email')
  );

-- ============================================
-- 2. Set Salem's full_name in user metadata
-- This populates the name shown in the settings team list.
-- ============================================

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"full_name": "Salem Al-Othman"}'::jsonb
WHERE email = 'salem.alothman@gmail.com';
