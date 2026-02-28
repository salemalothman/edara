import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  tenant_id: string | null
  property_id: string | null
  related_id: string | null
  is_read: boolean
  created_at: string
  tenant?: { first_name: string; last_name: string } | null
  property?: { name: string } | null
}

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, tenant:tenants(first_name, last_name), property:properties(name)')
    .order('created_at', { ascending: false })

  if (error) {
    // Fallback without joins
    const { data: plain, error: plainErr } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    if (plainErr) throw plainErr
    return plain
  }
  return data
}

export async function fetchUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) return 0
  return count || 0
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
  if (error) throw error
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

export async function clearAllNotifications() {
  const { error } = await supabase.from('notifications').delete().neq('id', '')
  if (error) throw error
}

export async function generateNotifications() {
  const today = new Date().toISOString().split('T')[0]
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch existing notification related_ids to avoid duplicates
  const { data: existing } = await supabase
    .from('notifications')
    .select('related_id')
  const existingIds = new Set((existing || []).map((n: any) => n.related_id))

  const newNotifications: any[] = []

  // 1. Payment overdue — invoices with status='overdue'
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, tenant_id, property_id, due_date, tenant:tenants(first_name, last_name), property:properties(name)')
    .eq('status', 'overdue')

  for (const inv of overdueInvoices || []) {
    const relId = `overdue-${inv.id}`
    if (existingIds.has(relId)) continue
    const tenantName = inv.tenant ? `${(inv.tenant as any).first_name} ${(inv.tenant as any).last_name}` : 'Unknown'
    newNotifications.push({
      type: 'payment_overdue',
      title: `Overdue Payment — ${inv.invoice_number}`,
      message: `${tenantName} has an overdue invoice of ${inv.amount} KWD (due ${inv.due_date})`,
      tenant_id: inv.tenant_id,
      property_id: inv.property_id,
      related_id: relId,
    })
  }

  // 2. Payment reminder — pending invoices due within 3 days
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, tenant_id, property_id, due_date, tenant:tenants(first_name, last_name)')
    .eq('status', 'pending')
    .lte('due_date', threeDaysFromNow)
    .gte('due_date', today)

  for (const inv of pendingInvoices || []) {
    const relId = `reminder-${inv.id}`
    if (existingIds.has(relId)) continue
    const tenantName = inv.tenant ? `${(inv.tenant as any).first_name} ${(inv.tenant as any).last_name}` : 'Unknown'
    newNotifications.push({
      type: 'payment_reminder',
      title: `Payment Due Soon — ${inv.invoice_number}`,
      message: `${tenantName}'s payment of ${inv.amount} KWD is due on ${inv.due_date}`,
      tenant_id: inv.tenant_id,
      property_id: inv.property_id,
      related_id: relId,
    })
  }

  // 3. Lease expiring — active contracts ending within 30 days
  const { data: expiringContracts } = await supabase
    .from('contracts')
    .select('id, contract_id, tenant_id, property_id, end_date, tenant:tenants(first_name, last_name), property:properties(name)')
    .eq('status', 'active')
    .lte('end_date', thirtyDaysFromNow)
    .gte('end_date', today)

  for (const c of expiringContracts || []) {
    const relId = `expiring-${c.id}`
    if (existingIds.has(relId)) continue
    const tenantName = c.tenant ? `${(c.tenant as any).first_name} ${(c.tenant as any).last_name}` : 'Unknown'
    newNotifications.push({
      type: 'lease_expiring',
      title: `Lease Expiring — ${c.contract_id}`,
      message: `${tenantName}'s contract expires on ${c.end_date}`,
      tenant_id: c.tenant_id,
      property_id: c.property_id,
      related_id: relId,
    })
  }

  // 4. Lease expired — active contracts past end_date
  const { data: expiredContracts } = await supabase
    .from('contracts')
    .select('id, contract_id, tenant_id, property_id, end_date, tenant:tenants(first_name, last_name)')
    .eq('status', 'active')
    .lt('end_date', today)

  for (const c of expiredContracts || []) {
    const relId = `expired-${c.id}`
    if (existingIds.has(relId)) continue
    const tenantName = c.tenant ? `${(c.tenant as any).first_name} ${(c.tenant as any).last_name}` : 'Unknown'
    newNotifications.push({
      type: 'lease_expired',
      title: `Lease Expired — ${c.contract_id}`,
      message: `${tenantName}'s contract expired on ${c.end_date}. Renewal required.`,
      tenant_id: c.tenant_id,
      property_id: c.property_id,
      related_id: relId,
    })
  }

  // 5. Maintenance completed recently (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: completedMaint } = await supabase
    .from('maintenance_requests')
    .select('id, title, property_id, property:properties(name)')
    .eq('status', 'completed')
    .gte('updated_at', sevenDaysAgo)

  for (const m of completedMaint || []) {
    const relId = `maint-${m.id}`
    if (existingIds.has(relId)) continue
    const propName = m.property ? (m.property as any).name : 'Property'
    newNotifications.push({
      type: 'maintenance_update',
      title: `Maintenance Completed`,
      message: `"${m.title}" at ${propName} has been completed`,
      property_id: m.property_id,
      related_id: relId,
    })
  }

  // Insert all new notifications
  if (newNotifications.length > 0) {
    const { error } = await supabase.from('notifications').insert(newNotifications)
    if (error) throw error
  }

  return newNotifications.length
}
