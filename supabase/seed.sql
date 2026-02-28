-- Edara Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

-- ============================================
-- PROPERTIES
-- ============================================
insert into properties (id, name, type, address, city, state, zip, units, size, description, amenities) values
  ('a1000000-0000-0000-0000-000000000001', 'Sunset Towers', 'residential', '123 Main St', 'Kuwait City', 'Kuwait', '12345', 24, 45000, 'Modern residential tower with premium amenities', '{"parking": true, "security": true, "elevator": true, "pool": true, "gym": true, "airConditioning": true}'::jsonb),
  ('a1000000-0000-0000-0000-000000000002', 'Ocean View Apartments', 'residential', '456 Beach Rd', 'Salmiya', 'Kuwait', '22345', 18, 32000, 'Beachfront apartments with ocean views', '{"parking": true, "security": true, "elevator": true, "pool": false, "gym": true, "airConditioning": true}'::jsonb),
  ('a1000000-0000-0000-0000-000000000003', 'Downtown Business Center', 'commercial', '789 Commerce Ave', 'Sharq', 'Kuwait', '32345', 12, 28000, 'Premium office spaces in the heart of downtown', '{"parking": true, "security": true, "elevator": true, "pool": false, "gym": false, "airConditioning": true}'::jsonb),
  ('a1000000-0000-0000-0000-000000000004', 'Parkside Residences', 'residential', '321 Park Lane', 'Hawally', 'Kuwait', '42345', 32, 60000, 'Family-friendly residential complex near parks', '{"parking": true, "security": true, "elevator": true, "pool": true, "gym": true, "airConditioning": true}'::jsonb),
  ('a1000000-0000-0000-0000-000000000005', 'Retail Plaza', 'commercial', '555 Shopping Blvd', 'Fahaheel', 'Kuwait', '52345', 8, 15000, 'High-traffic retail spaces', '{"parking": true, "security": true, "elevator": false, "pool": false, "gym": false, "airConditioning": true}'::jsonb);

-- ============================================
-- UNITS
-- ============================================
insert into units (id, property_id, name, floor, size, rent_amount, status) values
  -- Sunset Towers
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Apartment 301', 3, 120, 1250.000, 'occupied'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Apartment 302', 3, 95, 950.000, 'occupied'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Apartment 401', 4, 150, 1500.000, 'vacant'),
  -- Ocean View Apartments
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Unit 205', 2, 110, 950.000, 'occupied'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Unit 310', 3, 130, 1100.000, 'vacant'),
  -- Downtown Business Center
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Office 405', 4, 200, 2000.000, 'occupied'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'Office 502', 5, 180, 1800.000, 'vacant'),
  -- Parkside Residences
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004', 'Villa 12', 1, 250, 1800.000, 'occupied'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000004', 'Villa 15', 1, 280, 2000.000, 'vacant'),
  -- Retail Plaza
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000005', 'Shop 3', 1, 80, 1500.000, 'occupied'),
  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000005', 'Shop 5', 1, 100, 1800.000, 'vacant');

-- ============================================
-- TENANTS
-- ============================================
insert into tenants (id, first_name, last_name, email, phone, property_id, unit_id, move_in_date, lease_end_date, rent, deposit, status) values
  ('c1000000-0000-0000-0000-000000000001', 'John', 'Doe', 'john.doe@email.com', '+965-5551-0001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2023-01-15', '2024-01-14', 1250.000, 2500.000, 'active'),
  ('c1000000-0000-0000-0000-000000000002', 'Maria', 'Smith', 'maria.smith@email.com', '+965-5551-0002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', '2023-03-03', '2024-03-02', 950.000, 1900.000, 'active'),
  ('c1000000-0000-0000-0000-000000000003', 'Robert', 'Johnson', 'robert.johnson@email.com', '+965-5551-0003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', '2022-11-10', '2023-11-09', 1800.000, 3600.000, 'active'),
  ('c1000000-0000-0000-0000-000000000004', 'Amanda', 'Lee', 'amanda.lee@email.com', '+965-5551-0004', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', '2023-06-01', '2024-05-31', 2000.000, 4000.000, 'active'),
  ('c1000000-0000-0000-0000-000000000005', 'David', 'Wilson', 'david.wilson@email.com', '+965-5551-0005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000010', '2023-02-01', '2024-01-31', 1500.000, 3000.000, 'active');

-- ============================================
-- CONTRACTS
-- ============================================
insert into contracts (contract_id, tenant_id, property_id, unit_id, start_date, end_date, rent_amount, deposit_amount, payment_frequency, status) values
  ('CONT-2023-001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2023-01-15', '2024-01-14', 1250.000, 2500.000, 'monthly', 'active'),
  ('CONT-2023-002', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', '2023-03-03', '2024-03-02', 950.000, 1900.000, 'monthly', 'active'),
  ('CONT-2022-045', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', '2022-11-10', '2023-11-09', 1800.000, 3600.000, 'monthly', 'expiring_soon'),
  ('CONT-2023-003', 'c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', '2023-06-01', '2024-05-31', 2000.000, 4000.000, 'monthly', 'active'),
  ('CONT-2023-004', 'c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000010', '2023-02-01', '2024-01-31', 1500.000, 3000.000, 'monthly', 'active');

-- ============================================
-- INVOICES
-- ============================================
insert into invoices (id, invoice_number, tenant_id, property_id, unit_id, issue_date, due_date, amount, status, description) values
  ('d1000000-0000-0000-0000-000000000001', 'INV-2023-0125', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2023-06-01', '2023-06-15', 1250.000, 'paid', 'Monthly rent - June 2023'),
  ('d1000000-0000-0000-0000-000000000002', 'INV-2023-0126', 'c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', '2023-06-01', '2023-06-15', 950.000, 'pending', 'Monthly rent - June 2023'),
  ('d1000000-0000-0000-0000-000000000003', 'INV-2023-0110', 'c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', '2023-05-01', '2023-05-15', 1800.000, 'overdue', 'Monthly rent - May 2023');

-- Invoice line items
insert into invoice_items (invoice_id, description, amount, sort_order) values
  ('d1000000-0000-0000-0000-000000000001', 'Monthly Rent - Apartment 301', 1250.000, 0),
  ('d1000000-0000-0000-0000-000000000002', 'Monthly Rent - Unit 205', 950.000, 0),
  ('d1000000-0000-0000-0000-000000000003', 'Monthly Rent - Villa 12', 1800.000, 0);

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================
insert into maintenance_requests (title, property_id, unit_id, category, priority, description, contact_preference, status) values
  ('Leaking faucet in kitchen', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'plumbing', 'medium', 'Kitchen faucet has been dripping consistently for the past week.', 'email', 'in_progress'),
  ('AC not cooling properly', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'hvac', 'high', 'Air conditioning unit is running but not cooling the apartment effectively.', 'phone', 'pending'),
  ('Broken window lock', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008', 'structural', 'low', 'Window lock in the master bedroom is broken and needs replacement.', 'email', 'assigned'),
  ('Electrical outlet sparking', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'electrical', 'high', 'Outlet in the main office area is sparking when plugging in devices.', 'phone', 'pending');
