import { Linking } from 'react-native'
import { supabase } from '../supabase'

export interface WhatsAppReminder {
  id: string
  invoice_id: string
  tenant_id: string
  phone: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  created_at: string
  invoice?: { invoice_number: string; amount: number; due_date: string } | null
  tenant?: { first_name: string; last_name: string } | null
}

export async function fetchWhatsAppReminders() {
  const { data, error } = await supabase
    .from('whatsapp_reminders')
    .select('*, invoice:invoices(invoice_number, amount, due_date), tenant:tenants(first_name, last_name)')
    .order('created_at', { ascending: false })

  if (error) {
    const { data: plain, error: plainErr } = await supabase
      .from('whatsapp_reminders')
      .select('*')
      .order('created_at', { ascending: false })
    if (plainErr) throw plainErr
    return plain
  }
  return data
}

export async function findUpcomingDueInvoices(daysAhead = 5) {
  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, due_date, tenant_id, tenant:tenants(first_name, last_name, phone)')
    .eq('status', 'pending')
    .gte('due_date', today)
    .lte('due_date', futureDate)

  if (error) throw error

  const { data: existing } = await supabase
    .from('whatsapp_reminders')
    .select('invoice_id')
  const sentInvoiceIds = new Set((existing || []).map((r: any) => r.invoice_id))

  const eligible = (invoices || []).filter((inv: any) => {
    if (sentInvoiceIds.has(inv.id)) return false
    const phone = inv.tenant?.phone
    if (!phone || phone.trim() === '') return false
    return true
  })

  return eligible
}

export function buildReminderMessage(
  tenantName: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
): string {
  return [
    `Hello ${tenantName},`,
    ``,
    `This is a friendly reminder that your payment is due soon.`,
    ``,
    `Invoice: ${invoiceNumber}`,
    `Amount: ${amount.toFixed(3)} KWD`,
    `Due Date: ${dueDate}`,
    ``,
    `Please ensure timely payment to avoid any late fees.`,
    ``,
    `Thank you,`,
    `Edara Property Management`,
  ].join('\n')
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '965' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 8) {
      cleaned = '965' + cleaned
    }
  } else {
    cleaned = cleaned.slice(1)
  }
  return cleaned
}

export async function openWhatsApp(phone: string, message: string) {
  const normalized = normalizePhone(phone)
  const url = `whatsapp://send?phone=${normalized}&text=${encodeURIComponent(message)}`
  const canOpen = await Linking.canOpenURL(url)
  if (canOpen) {
    await Linking.openURL(url)
  } else {
    await Linking.openURL(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`)
  }
}

export async function logWhatsAppReminder(
  invoiceId: string,
  tenantId: string,
  phone: string,
  message: string
) {
  const { error } = await supabase
    .from('whatsapp_reminders')
    .insert({
      invoice_id: invoiceId,
      tenant_id: tenantId,
      phone,
      message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
  if (error) throw error
}

export async function generateWhatsAppReminders(daysAhead = 5) {
  const invoices = await findUpcomingDueInvoices(daysAhead)

  const reminders: {
    invoiceId: string
    tenantName: string
    phone: string
    message: string
    amount: number
    dueDate: string
    invoiceNumber: string
  }[] = []

  for (const inv of invoices) {
    const tenant = inv.tenant as any
    const tenantName = `${tenant.first_name} ${tenant.last_name}`
    const phone = tenant.phone
    const message = buildReminderMessage(tenantName, inv.invoice_number, inv.amount, inv.due_date)

    reminders.push({
      invoiceId: inv.id,
      tenantName,
      phone,
      message,
      amount: inv.amount,
      dueDate: inv.due_date,
      invoiceNumber: inv.invoice_number,
    })
  }

  return reminders
}

export async function sendWhatsAppReminder(
  invoiceId: string,
  tenantId: string,
  phone: string,
  message: string
) {
  await logWhatsAppReminder(invoiceId, tenantId, phone, message)
  await openWhatsApp(phone, message)
}

export async function deleteWhatsAppReminder(id: string) {
  const { error } = await supabase.from('whatsapp_reminders').delete().eq('id', id)
  if (error) throw error
}
