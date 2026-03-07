import { supabase } from '@/lib/supabase'
import { isDateInLockedPeriod } from '@/utils/period-lock'

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      property:properties(name)
    `)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function insertExpense(expense: {
  description: string
  amount: number
  category?: string
  property_id?: string | null
  date?: string
}) {
  if (isDateInLockedPeriod(expense.date)) {
    throw new Error('Cannot add expenses to a locked accounting period.')
  }
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, updates: {
  description?: string
  amount?: number
  category?: string
  property_id?: string | null
  date?: string
}) {
  const { data: existing } = await supabase
    .from('expenses')
    .select('date, created_at')
    .eq('id', id)
    .single()
  if (existing && isDateInLockedPeriod(existing.date || existing.created_at)) {
    throw new Error('Cannot modify expenses in a locked accounting period.')
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string) {
  const { data: existing } = await supabase
    .from('expenses')
    .select('date, created_at')
    .eq('id', id)
    .single()
  if (existing && isDateInLockedPeriod(existing.date || existing.created_at)) {
    throw new Error('Cannot delete expenses in a locked accounting period.')
  }

  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function fetchApprovedMaintenanceCosts() {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      id, title, category, cost, status, created_at, property_id,
      property:properties(name),
      unit:units(name)
    `)
    .eq('status', 'completed')
    .gt('cost', 0)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
