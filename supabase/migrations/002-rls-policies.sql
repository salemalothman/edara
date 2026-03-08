-- ============================================
-- RLS POLICIES - MULTI-TENANT ISOLATION + RBAC
-- ============================================

-- ============================================
-- 1. HELPER FUNCTIONS
-- ============================================

-- Get the organization_id for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. DROP ALL EXISTING PERMISSIVE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Allow all for properties" ON properties;
DROP POLICY IF EXISTS "Allow all for units" ON units;
DROP POLICY IF EXISTS "Allow all for tenants" ON tenants;
DROP POLICY IF EXISTS "Allow all for contracts" ON contracts;
DROP POLICY IF EXISTS "Allow all for invoices" ON invoices;
DROP POLICY IF EXISTS "Allow all for invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "Allow all for maintenance_requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Allow all for notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all for whatsapp_reminders" ON whatsapp_reminders;
DROP POLICY IF EXISTS "Allow all for expenses" ON expenses;

-- ============================================
-- 3. DATA TABLE POLICIES
-- Pattern: SELECT = org member, INSERT/UPDATE/DELETE = admin only
-- ============================================

-- PROPERTIES
CREATE POLICY "org_select_properties" ON properties
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_properties" ON properties
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_properties" ON properties
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_properties" ON properties
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- UNITS
CREATE POLICY "org_select_units" ON units
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_units" ON units
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_units" ON units
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_units" ON units
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- TENANTS (property renters)
CREATE POLICY "org_select_tenants" ON tenants
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_tenants" ON tenants
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_tenants" ON tenants
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_tenants" ON tenants
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- CONTRACTS
CREATE POLICY "org_select_contracts" ON contracts
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_contracts" ON contracts
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_contracts" ON contracts
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_contracts" ON contracts
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- INVOICES
CREATE POLICY "org_select_invoices" ON invoices
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_invoices" ON invoices
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_invoices" ON invoices
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_invoices" ON invoices
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- INVOICE_ITEMS
CREATE POLICY "org_select_invoice_items" ON invoice_items
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_invoice_items" ON invoice_items
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_invoice_items" ON invoice_items
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_invoice_items" ON invoice_items
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- MAINTENANCE_REQUESTS
CREATE POLICY "org_select_maintenance" ON maintenance_requests
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_maintenance" ON maintenance_requests
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_maintenance" ON maintenance_requests
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_maintenance" ON maintenance_requests
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- EXPENSES
CREATE POLICY "org_select_expenses" ON expenses
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_expenses" ON expenses
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_expenses" ON expenses
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_expenses" ON expenses
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- NOTIFICATIONS
CREATE POLICY "org_select_notifications" ON notifications
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_notifications" ON notifications
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_notifications" ON notifications
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_notifications" ON notifications
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- WHATSAPP_REMINDERS
CREATE POLICY "org_select_whatsapp" ON whatsapp_reminders
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "org_insert_whatsapp" ON whatsapp_reminders
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_update_whatsapp" ON whatsapp_reminders
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "org_delete_whatsapp" ON whatsapp_reminders
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- ============================================
-- 4. MANAGEMENT TABLE POLICIES
-- ============================================

-- ORGANIZATIONS
CREATE POLICY "org_select_own" ON organizations
  FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "org_update_own" ON organizations
  FOR UPDATE USING (id = get_user_org_id() AND is_admin());

-- ORGANIZATION_MEMBERS
CREATE POLICY "members_select_own_org" ON organization_members
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "members_insert_admin" ON organization_members
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "members_update_admin" ON organization_members
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "members_delete_admin" ON organization_members
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- INVITATIONS
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    organization_id = get_user_org_id()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
CREATE POLICY "invitations_insert_admin" ON invitations
  FOR INSERT WITH CHECK (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "invitations_update_admin" ON invitations
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_admin());
CREATE POLICY "invitations_delete_admin" ON invitations
  FOR DELETE USING (organization_id = get_user_org_id() AND is_admin());

-- ============================================
-- 5. STORAGE POLICIES
-- ============================================

-- Drop existing public storage policies
DROP POLICY IF EXISTS "Allow public uploads to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from documents" ON storage.objects;

-- Property Images - org-scoped by folder prefix
CREATE POLICY "org_upload_property_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND is_admin()
  );

CREATE POLICY "org_read_property_images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

CREATE POLICY "org_delete_property_images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND is_admin()
  );

-- Documents - org-scoped by folder prefix
CREATE POLICY "org_upload_documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND is_admin()
  );

CREATE POLICY "org_read_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

CREATE POLICY "org_delete_documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
    AND is_admin()
  );
