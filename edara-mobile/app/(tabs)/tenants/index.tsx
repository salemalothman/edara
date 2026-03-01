import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, Phone, Mail } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { useSupabaseQuery } from '../../../hooks/use-supabase-query'
import { fetchTenants } from '../../../lib/services/tenants'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { SearchBar } from '../../../components/ui/SearchBar'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function TenantsListScreen() {
  const [search, setSearch] = useState('')
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency } = useFormatter()
  const router = useRouter()

  const { data: tenants, loading, refetch } = useSupabaseQuery(fetchTenants)

  const filtered = tenants.filter((tenant: any) => {
    const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase()
    return fullName.includes(search.toLowerCase()) ||
      tenant.email.toLowerCase().includes(search.toLowerCase()) ||
      (tenant.phone || '').includes(search)
  })

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/tenants/${item.id}`)}>
      <Card style={styles.tenantCard}>
        <View style={styles.tenantHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.first_name[0]}{item.last_name[0]}
            </Text>
          </View>
          <View style={styles.tenantInfo}>
            <Text style={[styles.tenantName, { color: colors.text }]}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={[styles.tenantProperty, { color: colors.textSecondary }]}>
              {item.property?.name || '—'}{item.unit?.name ? ` · ${item.unit.name}` : ''}
            </Text>
          </View>
          <Badge
            label={item.status}
            variant={item.status === 'active' ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.tenantMeta}>
          {item.rent && (
            <Text style={[styles.rent, { color: colors.text }]}>{formatCurrency(item.rent)}/mo</Text>
          )}
          <View style={styles.contactRow}>
            {item.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Phone size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
              <Mail size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  ), [colors])

  if (loading && tenants.length === 0) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchArea}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('common.search')} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState title={t('tenants.noTenants')} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/tenants/add')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchArea: { paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, paddingTop: 0 },
  tenantCard: { marginBottom: 10 },
  tenantHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center', marginEnd: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tenantInfo: { flex: 1 },
  tenantName: { fontSize: 16, fontWeight: '600' },
  tenantProperty: { fontSize: 13, marginTop: 2 },
  tenantMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  rent: { fontSize: 15, fontWeight: '600' },
  contactRow: { flexDirection: 'row', gap: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
})
