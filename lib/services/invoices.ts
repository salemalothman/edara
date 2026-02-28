import { supabase } from '@/lib/supabase'

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      tenant:tenants(first_name, last_name),
      property:properties(name),
      unit:units(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    // If join fails (missing FK), fall back to plain fetch
    const { data: plainData, error: plainError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    if (plainError) throw plainError
    return plainData
  }
  return data
}

export async function insertInvoice(invoice: {
  invoice_number: string
  tenant_id: string
  property_id: string
  unit_id: string
  issue_date: string
  due_date: string
  amount: number
  status?: string
  description?: string | null
  send_notification?: boolean
  file_url?: string | null
  items: { description: string; amount: number; sort_order: number }[]
}) {
  const { items, ...invoiceData } = invoice

  // Insert invoice
  const { data: invoiceRow, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()
  if (invoiceError) throw invoiceError

  // Insert line items
  if (items.length > 0) {
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoiceRow.id,
    }))
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId)
    if (itemsError) throw itemsError
  }

  return invoiceRow
}

export async function updateInvoice(id: string, updates: {
  status?: string
  amount?: number
  description?: string | null
}) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInvoice(id: string) {
  // Delete line items first
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}

export async function uploadInvoiceFile(file: File): Promise<string> {
  const path = `invoices/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}
