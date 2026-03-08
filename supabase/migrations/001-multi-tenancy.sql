-- ============================================
-- MULTI-TENANCY MIGRATION
-- Creates organizations, membership, invitations
-- Adds organization_id to all data tables
-- ============================================

-- ============================================
-- 1. NEW TABLES
-- ============================================

-- Organizations (SaaS tenants - property management companies)
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Organization Members (maps auth.users to organizations with role)
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_org_members_updated
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Invitations (pending invites to join an organization)
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token uuid NOT NULL DEFAULT uuid_generate_v4(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. EXPENSES TABLE (formalize in schema)
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description text NOT NULL,
  amount numeric(10,3) NOT NULL,
  category text NOT NULL DEFAULT 'other',
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_expenses_updated
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. ADD organization_id TO ALL DATA TABLES
-- ============================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE units ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE whatsapp_reminders ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Indexes for org_id lookups
CREATE INDEX IF NOT EXISTS idx_properties_org ON properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_units_org ON units(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenants_org ON tenants(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_org ON invoice_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_org ON maintenance_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_org ON whatsapp_reminders(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);

-- ============================================
-- 4. BACKFILL EXISTING DATA
-- ============================================

-- Create default organization for existing data
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default')
ON CONFLICT (id) DO NOTHING;

-- Backfill all tables with default org
UPDATE properties SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE units SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE tenants SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE contracts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoice_items SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE maintenance_requests SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE notifications SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE whatsapp_reminders SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE expenses SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Add existing users as admins of default org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, 'admin'
FROM auth.users
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- 5. ENFORCE NOT NULL
-- ============================================

ALTER TABLE properties ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE units ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE contracts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE invoice_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE maintenance_requests ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE whatsapp_reminders ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN organization_id SET NOT NULL;

-- ============================================
-- 6. AUTO-SET organization_id ON INSERT
-- ============================================

CREATE OR REPLACE FUNCTION set_organization_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_set_org_id_properties BEFORE INSERT ON properties FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_units BEFORE INSERT ON units FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_tenants BEFORE INSERT ON tenants FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_contracts BEFORE INSERT ON contracts FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_invoices BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_invoice_items BEFORE INSERT ON invoice_items FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_maintenance BEFORE INSERT ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_notifications BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_whatsapp BEFORE INSERT ON whatsapp_reminders FOR EACH ROW EXECUTE FUNCTION set_organization_id();
CREATE TRIGGER trg_set_org_id_expenses BEFORE INSERT ON expenses FOR EACH ROW EXECUTE FUNCTION set_organization_id();

-- ============================================
-- 7. ONBOARDING DATABASE FUNCTIONS
-- ============================================

-- Create a new organization and join as admin
CREATE OR REPLACE FUNCTION create_org_and_join(org_name text)
RETURNS uuid AS $$
DECLARE
  new_org_id uuid;
  org_slug text;
BEGIN
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

-- Accept an invitation by token
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token uuid)
RETURNS void AS $$
DECLARE
  inv record;
BEGIN
  SELECT * INTO inv FROM invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid());

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (inv.organization_id, auth.uid(), inv.role);

  UPDATE invitations SET status = 'accepted' WHERE id = inv.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
