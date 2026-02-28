import { supabase } from '@/lib/supabase'

export async function fetchTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select('*, property:properties(name), unit:units(name), contracts(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchTenantsByProperty(propertyId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*, unit:units(name)')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertTenant(tenant: {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  property_id?: string | null
  unit_id?: string | null
  move_in_date?: string | null
  lease_end_date?: string | null
  rent?: number | null
  deposit?: number | null
}) {
  const { data, error } = await supabase
    .from('tenants')
    .insert(tenant)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTenant(id: string, updates: {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  property_id?: string | null
  unit_id?: string | null
  move_in_date?: string | null
  lease_end_date?: string | null
  rent?: number | null
  deposit?: number | null
  status?: string
}) {
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTenant(id: string) {
  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) throw error
}
