import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { useSupabaseQuery } from '../../../hooks/use-supabase-query'
import { fetchContracts } from '../../../lib/services/contracts'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { SearchBar } from '../../../components/ui/SearchBar'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function ContractsListScreen() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency, formatDate } = useFormatter()
  const router = useRouter()

  const { data: contracts, loading, refetch } = useSupabaseQuery(fetchContracts)

  useFocusEffect(useCallback(() => { refetch() }, []))

  const getContractStatus = (contract: any) => {
    const endDate = new Date(contract.end_date)
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    if (endDate < now) return 'expired'
    if (endDate < thirtyDays) return 'expiring'
    return 'active'
  }

  const filtered = contracts.filter((c: any) => {
    const matchesSearch = (c.contract_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.tenant ? `${c.tenant.first_name} ${c.tenant.last_name}` : '').toLowerCase().includes(search.toLowerCase())
    const status = getContractStatus(c)
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusFilters = ['all', 'active', 'expiring', 'expired']

  const statusVariant = (s: string) => s === 'active' ? 'success' : s === 'expiring' ? 'warning' : 'danger'

  const renderItem = useCallback(({ item }: { item: any }) => {
    const status = getContractStatus(item)
    return (
      <Card style={styles.contractCard}>
        <View style={styles.contractHeader}>
          <Text style={[styles.contractId, { color: colors.text }]}>{item.contract_id}</Text>
          <Badge label={t(`contracts.${status}`)} variant={statusVariant(status)} />
        </View>
        <Text style={[styles.tenantName, { color: colors.textSecondary }]}>
          {item.tenant ? `${item.tenant.first_name} ${item.tenant.last_name}` : '—'}
        </Text>
        <Text style={[styles.propertyName, { color: colors.textSecondary }]}>
          {item.property?.name || '—'}{item.unit?.name ? ` · ${item.unit.name}` : ''}
        </Text>
        <View style={styles.contractFooter}>
          <Text style={[styles.rent, { color: colors.primary }]}>{formatCurrency(item.rent_amount)}/mo</Text>
          <Text style={[styles.dates, { color: colors.textSecondary }]}>
            {formatDate(item.start_date)} — {formatDate(item.end_date)}
          </Text>
        </View>
      </Card>
    )
  }, [colors])

  if (loading && contracts.length === 0) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filterArea}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('contracts.searchContracts')} />
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
                {item === 'all' ? t('contracts.allContracts') : t(`contracts.${item}`)}
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
        ListEmptyComponent={<EmptyState title={t('contracts.allContracts')} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/contracts/add')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterArea: { paddingHorizontal: 16, paddingTop: 8 },
  filterRow: { marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginEnd: 8 },
  list: { padding: 16, paddingTop: 8 },
  contractCard: { marginBottom: 10 },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contractId: { fontSize: 16, fontWeight: '600', flex: 1, marginEnd: 8 },
  tenantName: { fontSize: 14, marginTop: 4 },
  propertyName: { fontSize: 13, marginTop: 2 },
  contractFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  rent: { fontSize: 15, fontWeight: '700' },
  dates: { fontSize: 12 },
  fab: { position: 'absolute', bottom: 24, end: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
})
