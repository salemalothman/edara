import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, MapPin } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useSupabaseQuery } from '../../../hooks/use-supabase-query'
import { fetchProperties } from '../../../lib/services/properties'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { SearchBar } from '../../../components/ui/SearchBar'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'

export default function PropertiesListScreen() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const { data: properties, loading, refetch } = useSupabaseQuery(fetchProperties)

  const filtered = properties.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || p.type === filter
    return matchesSearch && matchesFilter
  })

  const filters = ['all', 'residential', 'commercial', 'mixed']

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/properties/${item.id}`)}>
      <Card style={styles.propertyCard}>
        {item.image_urls?.[0] && (
          <Image source={{ uri: item.image_urls[0] }} style={styles.propertyImage} />
        )}
        <View style={styles.propertyInfo}>
          <Text style={[styles.propertyName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={[styles.address, { color: colors.textSecondary }]}>{item.address}, {item.city}</Text>
          </View>
          <View style={styles.metaRow}>
            <Badge label={item.type} />
            <Text style={[styles.units, { color: colors.textSecondary }]}>{item.units} units</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  ), [colors])

  if (loading && properties.length === 0) return <LoadingSpinner />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerArea}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('common.search')} />
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === item ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={{ color: filter === item ? '#fff' : colors.text, fontSize: 13, fontWeight: '500' }}>
                {item === 'all' ? t('common.all') : t(`properties.${item}`)}
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
        ListEmptyComponent={<EmptyState title={t('properties.noProperties')} />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/properties/add')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 16, paddingTop: 8 },
  filterRow: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginEnd: 8 },
  list: { padding: 16, paddingTop: 8 },
  propertyCard: { marginBottom: 12 },
  propertyImage: { width: '100%', height: 140, borderRadius: 8, marginBottom: 12 },
  propertyInfo: {},
  propertyName: { fontSize: 17, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  address: { fontSize: 13, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  units: { fontSize: 13 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
})
