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

export async function uploadContractFile(uri: string, fileName: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
  const path = `contracts/${Date.now()}-${fileName}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, blob)
  if (error) throw error
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadContractForTenant(tenantId: string, propertyId: string, unitId: string, fileUri: string, fileName: string) {
  const fileUrl = await uploadContractFile(fileUri, fileName)
  const now = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      contract_id: `CT-${Date.now()}`,
      tenant_id: tenantId,
      property_id: propertyId,
      unit_id: unitId,
      start_date: now,
      end_date: now,
      rent_amount: 0,
      file_url: fileUrl,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
