import { supabase } from '../supabase'
import { isDateInLockedPeriod } from '../../utils/period-lock'

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
  if (isDateInLockedPeriod(invoice.issue_date)) {
    throw new Error('Cannot add invoices to a locked accounting period.')
  }

  const { items, ...invoiceData } = invoice

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()
  if (invoiceError) throw invoiceError

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
  const { data: existing } = await supabase
    .from('invoices')
    .select('issue_date')
    .eq('id', id)
    .single()
  if (existing && isDateInLockedPeriod(existing.issue_date)) {
    throw new Error('Cannot modify invoices in a locked accounting period.')
  }

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
  const { data: existing } = await supabase
    .from('invoices')
    .select('issue_date')
    .eq('id', id)
    .single()
  if (existing && isDateInLockedPeriod(existing.issue_date)) {
    throw new Error('Cannot delete invoices in a locked accounting period.')
  }

  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}
