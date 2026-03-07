import { supabase } from '../supabase'
import { isDateInLockedPeriod } from '../../utils/period-lock'

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
