import { supabase } from '@/lib/supabase'

export async function fetchUnits() {
  const { data, error } = await supabase
    .from('units')
    .select('*, property:properties(name)')
    .order('name')
  if (error) throw error
  return data
}

export async function fetchUnitsByProperty(propertyId: string) {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .order('name')
  if (error) throw error
  return data
}

export async function insertUnit(unit: {
  property_id: string
  name: string
  floor?: number | null
  size?: number | null
  rent_amount?: number | null
  status?: string
}) {
  const { data, error } = await supabase
    .from('units')
    .insert(unit)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUnit(id: string, updates: {
  name?: string
  floor?: number | null
  size?: number | null
  rent_amount?: number | null
  status?: string
}) {
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteUnit(id: string) {
  const { error } = await supabase.from('units').delete().eq('id', id)
  if (error) throw error
}
