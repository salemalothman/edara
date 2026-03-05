import { supabase } from '../supabase'

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
  current_property_value?: number | null
  annual_debt_service?: number | null
  total_cash_invested?: number | null
  document_url?: string | null
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

export async function uploadPropertyDocument(propertyId: string, fileUri: string, fileName: string): Promise<string> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `property-documents/${Date.now()}-${sanitizedName}`

  const response = await fetch(fileUri)
  const arrayBuffer = await response.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })
  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
  const documentUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('properties')
    .update({ document_url: documentUrl })
    .eq('id', propertyId)
  if (updateError) {
    throw new Error(`Failed to save document reference: ${updateError.message || JSON.stringify(updateError)}`)
  }

  return documentUrl
}

export async function deletePropertyDocument(propertyId: string, documentUrl: string) {
  try {
    const url = new URL(documentUrl)
    const pathMatch = url.pathname.match(/\/object\/public\/documents\/(.+)/)
    if (pathMatch) {
      const storagePath = decodeURIComponent(pathMatch[1])
      const { error } = await supabase.storage
        .from('documents')
        .remove([storagePath])
      if (error) console.error('Storage delete error:', error)
    }
  } catch (e) {
    console.error('Failed to parse document URL for deletion:', e)
  }

  const { error } = await supabase
    .from('properties')
    .update({ document_url: null })
    .eq('id', propertyId)
  if (error) {
    throw new Error(`Failed to remove document reference: ${error.message || JSON.stringify(error)}`)
  }
}

export async function uploadPropertyImage(uri: string, fileName: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
  const path = `properties/${Date.now()}-${fileName}`
  const { error } = await supabase.storage
    .from('property-images')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data } = supabase.storage.from('property-images').getPublicUrl(path)
  return data.publicUrl
}
