import { supabase } from '../supabase'

export async function fetchContracts() {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      tenant:tenants(first_name, last_name),
      property:properties(name),
      unit:units(name)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertContract(contract: {
  contract_id: string
  tenant_id: string
  property_id: string
  unit_id: string
  start_date: string
  end_date: string
  rent_amount: number
  deposit_amount?: number | null
  payment_frequency?: string
  terms?: string | null
  file_url?: string | null
}) {
  const { data, error } = await supabase
    .from('contracts')
    .insert(contract)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadContractFile(uri: string, fileName: string, orgId: string): Promise<string> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${orgId}/contracts/${Date.now()}-${sanitizedName}`

  const response = await fetch(uri)
  const arrayBuffer = await response.arrayBuffer()
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })
  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`File upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadContractForTenant(tenantId: string, propertyId: string, unitId: string, fileUri: string, fileName: string, orgId: string) {
  const fileUrl = await uploadContractFile(fileUri, fileName, orgId)

  const now = new Date().toISOString().split('T')[0]
  const contractData: Record<string, any> = {
    contract_id: `CT-${Date.now()}`,
    tenant_id: tenantId,
    start_date: now,
    end_date: now,
    rent_amount: 0,
    file_url: fileUrl,
  }
  if (propertyId) contractData.property_id = propertyId
  if (unitId) contractData.unit_id = unitId

  const { data, error } = await supabase
    .from('contracts')
    .insert(contractData)
    .select()
    .single()
  if (error) {
    console.error('Contract insert error:', error)
    throw new Error(`Contract save failed: ${error.message}`)
  }
  return data
}

export async function deleteContract(contractId: string, fileUrl: string | null) {
  if (fileUrl) {
    try {
      const url = new URL(fileUrl)
      const pathMatch = url.pathname.match(/\/object\/public\/documents\/(.+)/)
      if (pathMatch) {
        const storagePath = decodeURIComponent(pathMatch[1])
        const { error } = await supabase.storage
          .from('documents')
          .remove([storagePath])
        if (error) console.error('Storage delete error:', error)
      }
    } catch (e) {
      console.error('Failed to parse file URL for deletion:', e)
    }
  }

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId)
  if (error) {
    throw new Error(`Contract delete failed: ${error.message}`)
  }
}
