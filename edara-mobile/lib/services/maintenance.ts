import { supabase } from '../supabase'

export async function fetchMaintenanceRequests() {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      property:properties(name),
      unit:units(name)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertMaintenanceRequest(request: {
  title: string
  property_id: string
  unit_id: string
  category: string
  priority?: string
  description: string
  available_dates?: string | null
  contact_preference?: string
  image_urls?: string[]
  cost?: number | null
}) {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert(request)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMaintenanceRequest(id: string, updates: {
  title?: string
  category?: string
  priority?: string
  status?: string
  description?: string
  cost?: number | null
}) {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMaintenanceRequest(id: string) {
  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id)
  if (error) throw error
}

export async function uploadMaintenanceImage(uri: string, fileName: string, orgId: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
  const path = `${orgId}/maintenance/${Date.now()}-${fileName}`
  const { error } = await supabase.storage
    .from('property-images')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('property-images').getPublicUrl(path)
  return data.publicUrl
}
