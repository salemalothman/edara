-- Edara Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROPERTIES
-- ============================================
create table properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('residential', 'commercial', 'mixed')),
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  units integer not null default 0,
  size numeric,
  description text,
  amenities jsonb not null default '{
    "parking": false,
    "security": false,
    "elevator": false,
    "pool": false,
    "gym": false,
    "airConditioning": false
  }'::jsonb,
  image_urls text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- UNITS
-- ============================================
create table units (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  floor integer,
  size numeric,
  rent_amount numeric(10,3),
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- TENANTS
-- ============================================
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  property_id uuid references properties(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  move_in_date date,
  lease_end_date date,
  rent numeric(10,3),
  deposit numeric(10,3),
  status text not null default 'active' check (status in ('active', 'pending', 'former')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- CONTRACTS
-- ============================================
create table contracts (
  id uuid primary key default uuid_generate_v4(),
  contract_id text not null unique,
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  rent_amount numeric(10,3) not null,
  deposit_amount numeric(10,3),
  payment_frequency text not null default 'monthly'
    check (payment_frequency in ('monthly', 'quarterly', 'biannually', 'annually')),
  terms text,
  file_url text,
  status text not null default 'active'
    check (status in ('active', 'pending', 'expiring_soon', 'expired', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- INVOICES
-- ============================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  tenant_id uuid not null references tenants(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  issue_date date not null,
  due_date date not null,
  amount numeric(10,3) not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'overdue')),
  description text,
  send_notification boolean not null default true,
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoice line items
create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  amount numeric(10,3) not null,
  sort_order integer not null default 0
);

-- ============================================
-- MAINTENANCE REQUESTS
-- ============================================
create table maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  category text not null
    check (category in ('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  description text not null,
  available_dates text,
  contact_preference text not null default 'email'
    check (contact_preference in ('email', 'phone', 'sms')),
  image_urls text[] default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_units_property on units(property_id);
create index idx_tenants_property on tenants(property_id);
create index idx_tenants_unit on tenants(unit_id);
create index idx_contracts_tenant on contracts(tenant_id);
create index idx_contracts_property on contracts(property_id);
create index idx_invoices_tenant on invoices(tenant_id);
create index idx_invoices_property on invoices(property_id);
create index idx_invoices_status on invoices(status);
create index idx_maintenance_property on maintenance_requests(property_id);
create index idx_maintenance_status on maintenance_requests(status);
create index idx_invoice_items_invoice on invoice_items(invoice_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_properties_updated before update on properties
  for each row execute function update_updated_at();
create trigger trg_units_updated before update on units
  for each row execute function update_updated_at();
create trigger trg_tenants_updated before update on tenants
  for each row execute function update_updated_at();
create trigger trg_contracts_updated before update on contracts
  for each row execute function update_updated_at();
create trigger trg_invoices_updated before update on invoices
  for each row execute function update_updated_at();
create trigger trg_maintenance_updated before update on maintenance_requests
  for each row execute function update_updated_at();

-- ============================================
-- RLS POLICIES (permissive - no auth yet)
-- ============================================
alter table properties enable row level security;
alter table units enable row level security;
alter table tenants enable row level security;
alter table contracts enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table maintenance_requests enable row level security;

create policy "Allow all for properties" on properties for all using (true) with check (true);
create policy "Allow all for units" on units for all using (true) with check (true);
create policy "Allow all for tenants" on tenants for all using (true) with check (true);
create policy "Allow all for contracts" on contracts for all using (true) with check (true);
create policy "Allow all for invoices" on invoices for all using (true) with check (true);
create policy "Allow all for invoice_items" on invoice_items for all using (true) with check (true);
create policy "Allow all for maintenance_requests" on maintenance_requests for all using (true) with check (true);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('payment_reminder','payment_overdue','maintenance_update','lease_expiring','lease_expired','system')),
  title text not null,
  message text not null,
  tenant_id uuid references tenants(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  related_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_created on notifications(created_at desc);

alter table notifications enable row level security;
create policy "Allow all for notifications" on notifications for all using (true) with check (true);

-- ============================================
-- WHATSAPP REMINDERS LOG
-- ============================================
create table whatsapp_reminders (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  phone text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_whatsapp_reminders_invoice on whatsapp_reminders(invoice_id);
create index idx_whatsapp_reminders_tenant on whatsapp_reminders(tenant_id);

alter table whatsapp_reminders enable row level security;
create policy "Allow all for whatsapp_reminders" on whatsapp_reminders for all using (true) with check (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', true);

create policy "Allow public uploads to property-images"
  on storage.objects for insert with check (bucket_id = 'property-images');
create policy "Allow public read from property-images"
  on storage.objects for select using (bucket_id = 'property-images');
create policy "Allow public uploads to documents"
  on storage.objects for insert with check (bucket_id = 'documents');
create policy "Allow public read from documents"
  on storage.objects for select using (bucket_id = 'documents');
