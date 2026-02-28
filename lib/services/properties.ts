import { supabase } from '@/lib/supabase'

export async function fetchProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchPropertyById(id: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateProperty(id: string, updates: {
  name?: string
  type?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  units?: number
  size?: number | null
  description?: string | null
  amenities?: Record<string, boolean>
  image_urls?: string[]
}) {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function insertProperty(property: {
  name: string
  type: string
  address: string
  city: string
  state: string
  zip: string
  units: number
  size?: number | null
  description?: string | null
  amenities?: Record<string, boolean>
  image_urls?: string[]
}) {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

export async function uploadPropertyImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const path = `properties/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('property-images')
      .upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('property-images').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}
