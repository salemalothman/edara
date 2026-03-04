import { supabase } from '@/lib/supabase'

export async function fetchTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select('*, property:properties(name), unit:units(name, rent_amount), contracts(*)')
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

  // Mark unit as occupied when a tenant is assigned
  if (tenant.unit_id) {
    await supabase.from('units').update({ status: 'occupied' }).eq('id', tenant.unit_id)
  }

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
  // If unit_id is changing, handle old/new unit status
  if ('unit_id' in updates) {
    const { data: oldTenant } = await supabase.from('tenants').select('unit_id').eq('id', id).single()
    const oldUnitId = oldTenant?.unit_id
    const newUnitId = updates.unit_id

    if (oldUnitId && oldUnitId !== newUnitId) {
      await supabase.from('units').update({ status: 'vacant' }).eq('id', oldUnitId)
    }
    if (newUnitId && newUnitId !== oldUnitId) {
      await supabase.from('units').update({ status: 'occupied' }).eq('id', newUnitId)
    }
  }

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
  // Get the tenant's unit_id before deleting so we can mark it vacant
  const { data: tenant } = await supabase.from('tenants').select('unit_id').eq('id', id).single()

  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) throw error

  // Mark the unit as vacant after tenant is removed
  if (tenant?.unit_id) {
    await supabase.from('units').update({ status: 'vacant' }).eq('id', tenant.unit_id)
  }
}
