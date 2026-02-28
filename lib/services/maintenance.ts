import { supabase } from '@/lib/supabase'

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

export async function uploadMaintenanceImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const path = `maintenance/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('property-images')
      .upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('property-images').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}
