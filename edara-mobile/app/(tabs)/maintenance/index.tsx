import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Plus, AlertTriangle, Clock, CheckCircle } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { useSupabaseQuery } from '../../../hooks/use-supabase-query'
import { fetchMaintenanceRequests } from '../../../lib/services/maintenance'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { SearchBar } from '../../../components/ui/SearchBar'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function MaintenanceListScreen() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatDate } = useFormatter()
  const router = useRouter()

  const { data: requests, loading, refetch } = useSupabaseQuery(fetchMaintenanceRequests)

  useFocusEffect(useCallback(() => { refetch() }, []))

  const filtered = requests.filter((req: any) => {
    const matchesSearch = req.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusFilters = ['all', 'pending', 'assigned', 'in_progress', 'completed']

  const priorityVariant = (p: string) => p === 'high' ? 'danger' : p === 'medium' ? 'warning' : 'default'
  const statusVariant = (s: string) => s === 'completed' ? 'success' : s === 'pending' ? 'warning' : 'default'

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/maintenance/${item.id}`)}>
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Badge label={item.priority} variant={priorityVariant(item.priority)} />
        </View>
        <Text style={[styles.property, { color: colors.textSecondary }]}>
          {item.property?.name || '—'}{item.unit?.name ? ` · ${item.unit.name}` : ''}
        </Text>
        <View style={styles.requestFooter}>
          <Badge label={item.category} />
          <Badge label={t(`status.${item.status}`)} variant={statusVariant(item.status)} />
          <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  ), [colors])

  if (loading && requests.length === 0) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        ListEmptyComponent={<EmptyState title={t('maintenance.noRequests')} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/maintenance/add')}
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
  requestCard: { marginBottom: 10 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginEnd: 8 },
  property: { fontSize: 13, marginTop: 4 },
  requestFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  date: { fontSize: 12, marginStart: 'auto' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
})
