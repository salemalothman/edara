import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { usePermissions } from '../../../hooks/use-permissions'
import { useSupabaseQuery } from '../../../hooks/use-supabase-query'
import { fetchExpenses, fetchApprovedMaintenanceCosts } from '../../../lib/services/expenses'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { SearchBar } from '../../../components/ui/SearchBar'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function ExpensesListScreen() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency, formatDate } = useFormatter()
  const { canCreate } = usePermissions()
  const router = useRouter()

  const { data: manualExpenses, loading: expLoading, refetch: refetchExp } = useSupabaseQuery(fetchExpenses)
  const { data: maintenanceCosts, loading: maintLoading, refetch: refetchMaint } = useSupabaseQuery(fetchApprovedMaintenanceCosts)

  const loading = expLoading || maintLoading

  useFocusEffect(useCallback(() => { refetchExp(); refetchMaint() }, []))

  // Combine both sources into a unified list
  const combinedExpenses = [
    ...manualExpenses.map((e: any) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      property: e.property?.name || null,
      date: e.date,
      source: 'manual' as const,
    })),
    ...maintenanceCosts.map((m: any) => ({
      id: `maint-${m.id}`,
      description: m.title,
      amount: m.cost,
      category: m.category,
      property: m.property?.name || null,
      date: m.created_at?.split('T')[0],
      source: 'maintenance' as const,
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  // Summary stats
  const totalManual = manualExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalMaintenance = maintenanceCosts.reduce((s: number, m: any) => s + (m.cost || 0), 0)
  const totalCombined = totalManual + totalMaintenance

  const filtered = combinedExpenses.filter((exp) => {
    const matchesSearch = exp.description.toLowerCase().includes(search.toLowerCase())
    const matchesSource = sourceFilter === 'all' || exp.source === sourceFilter
    return matchesSearch && matchesSource
  })

  const sourceFilters = ['all', 'manual', 'maintenance']

  const renderItem = useCallback(({ item }: { item: typeof combinedExpenses[0] }) => (
    <Card style={styles.expenseCard}>
      <View style={styles.expenseRow}>
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDesc, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.expenseMeta, { color: colors.textSecondary }]}>
            {t(`expenses.${item.category}`)}{item.property ? ` · ${item.property}` : ''}
          </Text>
          <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={[styles.expenseAmount, { color: colors.danger }]}>{formatCurrency(item.amount)}</Text>
          <Badge
            label={t(`expenses.${item.source}`)}
            variant={item.source === 'maintenance' ? 'warning' : 'default'}
          />
        </View>
      </View>
    </Card>
  ), [colors])

  if (loading && manualExpenses.length === 0 && maintenanceCosts.length === 0) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary Cards */}
      <View style={styles.summary}>
        <Card style={{ ...styles.summaryCard, borderLeftColor: colors.danger, borderLeftWidth: 3 }}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('expenses.manualExpenses')}</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalManual)}</Text>
        </Card>
        <Card style={{ ...styles.summaryCard, borderLeftColor: colors.warning, borderLeftWidth: 3 }}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('expenses.maintenanceCosts')}</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalMaintenance)}</Text>
        </Card>
      </View>
      <View style={styles.totalRow}>
        <Card style={{ ...styles.totalCard, borderLeftColor: colors.primary, borderLeftWidth: 3 }}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('expenses.combinedTotal')}</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(totalCombined)}</Text>
        </Card>
      </View>

      <View style={styles.filterArea}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('common.search')} />
        <FlatList
          horizontal
          data={sourceFilters}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: sourceFilter === item ? colors.primary : colors.card, borderColor: colors.border }]}
              onPress={() => setSourceFilter(item)}
            >
              <Text style={{ color: sourceFilter === item ? '#fff' : colors.text, fontSize: 13, fontWeight: '500' }}>
                {item === 'all' ? t('common.all') : t(`expenses.${item}`)}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.filterRow}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { refetchExp(); refetchMaint() }} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState title={t('expenses.noExpenses')} />}
      />

      {canCreate && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/expenses/add')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  summaryCard: { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  totalRow: { paddingHorizontal: 16, marginTop: 8 },
  totalCard: { paddingVertical: 12, paddingHorizontal: 10 },
  totalValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  filterArea: { paddingHorizontal: 16, paddingTop: 12 },
  filterRow: { marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginEnd: 8 },
  list: { padding: 16, paddingTop: 8 },
  expenseCard: { marginBottom: 8 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 15, fontWeight: '600' },
  expenseMeta: { fontSize: 13, marginTop: 2 },
  expenseDate: { fontSize: 12, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end', gap: 4 },
  expenseAmount: { fontSize: 16, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 24, end: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
})
