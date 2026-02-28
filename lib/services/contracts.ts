import { supabase } from '@/lib/supabase'

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

export async function uploadContractFile(file: File): Promise<string> {
  const path = `contracts/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}
