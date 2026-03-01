import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { useSupabaseQuery } from '../../../hooks/use-supabase-query'
import { fetchInvoices } from '../../../lib/services/invoices'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { SearchBar } from '../../../components/ui/SearchBar'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function InvoicesListScreen() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency, formatDate } = useFormatter()
  const router = useRouter()

  const { data: invoices, loading, refetch } = useSupabaseQuery(fetchInvoices)

  // Summary stats
  const totalDue = invoices.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + i.amount, 0)
  const totalOverdue = invoices.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + i.amount, 0)
  const totalPaid = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.amount, 0)

  const filtered = invoices.filter((inv: any) => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusFilters = ['all', 'pending', 'paid', 'overdue']

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/invoices/${item.id}`)}>
      <Card style={styles.invoiceCard}>
        <View style={styles.invoiceRow}>
          <View style={styles.invoiceInfo}>
            <Text style={[styles.invoiceNum, { color: colors.text }]}>{item.invoice_number}</Text>
            <Text style={[styles.invoiceTenant, { color: colors.textSecondary }]}>
              {item.tenant ? `${item.tenant.first_name} ${item.tenant.last_name}` : '—'}
            </Text>
            <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
              Due: {formatDate(item.due_date)}
            </Text>
          </View>
          <View style={styles.invoiceRight}>
            <Text style={[styles.amount, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
            <Badge
              label={item.status}
              variant={item.status === 'paid' ? 'success' : item.status === 'overdue' ? 'danger' : 'warning'}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  ), [colors])

  if (loading && invoices.length === 0) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary Cards */}
      <View style={styles.summary}>
        <Card style={{ ...styles.summaryCard, borderLeftColor: colors.warning, borderLeftWidth: 3 }}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalDue)}</Text>
        </Card>
        <Card style={{ ...styles.summaryCard, borderLeftColor: colors.danger, borderLeftWidth: 3 }}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Overdue</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalOverdue)}</Text>
        </Card>
        <Card style={{ ...styles.summaryCard, borderLeftColor: colors.success, borderLeftWidth: 3 }}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Paid</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalPaid)}</Text>
        </Card>
      </View>

      <View style={styles.filterArea}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('common.search')} />
        <FlatList
          horizontal
          data={statusFilters}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: statusFilter === item ? colors.primary : colors.card, borderColor: colors.border }]}
              onPress={() => setStatusFilter(item)}
            >
              <Text style={{ color: statusFilter === item ? '#fff' : colors.text, fontSize: 13, fontWeight: '500' }}>
                {item === 'all' ? t('common.all') : t(`status.${item}`)}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.filterRow}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState title={t('invoices.noInvoices')} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/invoices/add')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  summaryCard: { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  filterArea: { paddingHorizontal: 16, paddingTop: 12 },
  filterRow: { marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginEnd: 8 },
  list: { padding: 16, paddingTop: 8 },
  invoiceCard: { marginBottom: 8 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceInfo: { flex: 1 },
  invoiceNum: { fontSize: 15, fontWeight: '600' },
  invoiceTenant: { fontSize: 13, marginTop: 2 },
  dueDate: { fontSize: 12, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
})
