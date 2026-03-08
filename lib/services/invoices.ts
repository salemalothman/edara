import { supabase } from '@/lib/supabase'
import { isDateInLockedPeriod } from '@/utils/period-lock'

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
  if (isDateInLockedPeriod(invoice.issue_date)) {
    throw new Error('Cannot add invoices to a locked accounting period.')
  }
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
  // Fetch the invoice to check its period
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
  // Check if invoice is in a locked period
  const { data: existing } = await supabase
    .from('invoices')
    .select('issue_date')
    .eq('id', id)
    .single()
  if (existing && isDateInLockedPeriod(existing.issue_date)) {
    throw new Error('Cannot delete invoices in a locked accounting period.')
  }

  // Delete line items first
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}

export async function generateMonthlyInvoices() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  // Fetch active tenants with property, unit, and rent info
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, property_id, unit_id, rent, unit:units(rent_amount)')
    .eq('status', 'active')
    .not('property_id', 'is', null)
    .not('unit_id', 'is', null)

  if (tenantErr || !tenants || tenants.length === 0) return 0

  // Check which tenants already have an invoice this month
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('tenant_id')
    .gte('issue_date', `${monthStr}-01`)
    .lte('issue_date', `${monthStr}-31`)

  const alreadyInvoiced = new Set(
    (existingInvoices || []).map((inv: any) => inv.tenant_id)
  )

  const invoicesToCreate: any[] = []
  let seq = (existingInvoices?.length || 0) + 1

  for (const tenant of tenants as any[]) {
    if (alreadyInvoiced.has(tenant.id)) continue

    // Get rent amount: prefer unit's rent_amount, fall back to tenant's rent
    const unitRent = tenant.unit?.rent_amount
    const rentAmount = unitRent ?? tenant.rent
    if (!rentAmount || rentAmount <= 0) continue

    invoicesToCreate.push({
      invoice_number: `INV-${year}-${String(month + 1).padStart(2, '0')}-${String(seq).padStart(3, '0')}`,
      tenant_id: tenant.id,
      property_id: tenant.property_id,
      unit_id: tenant.unit_id,
      issue_date: `${monthStr}-01`,
      due_date: `${monthStr}-15`,
      amount: rentAmount,
      status: 'pending',
      description: `Monthly rent - ${tenant.first_name} ${tenant.last_name}`,
    })
    seq++
  }

  if (invoicesToCreate.length === 0) return 0

  const { error: insertErr } = await supabase
    .from('invoices')
    .insert(invoicesToCreate)

  if (insertErr) throw insertErr
  return invoicesToCreate.length
}

export async function uploadInvoiceFile(file: File, orgId: string): Promise<string> {
  const path = `${orgId}/invoices/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return data.publicUrl
}
