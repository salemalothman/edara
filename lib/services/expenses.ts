import { supabase } from '@/lib/supabase'

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
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export async function fetchApprovedMaintenanceCosts() {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      id, title, category, cost, status, created_at,
      property:properties(name),
      unit:units(name)
    `)
    .eq('status', 'completed')
    .gt('cost', 0)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
