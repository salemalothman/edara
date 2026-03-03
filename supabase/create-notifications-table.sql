-- Run this in Supabase Dashboard > SQL Editor
-- Creates the notifications table (if not already created)

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('payment_reminder','payment_overdue','maintenance_update','lease_expiring','lease_expired','system')),
  title text NOT NULL,
  message text NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  related_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists, then create
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for notifications" ON notifications;
  CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
END $$;
