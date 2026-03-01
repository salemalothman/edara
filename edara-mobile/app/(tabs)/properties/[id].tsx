import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Alert, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MapPin, Maximize, Home } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { fetchPropertyById, deleteProperty } from '../../../lib/services/properties'
import { fetchUnitsByProperty } from '../../../lib/services/units'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [property, setProperty] = useState<any>(null)
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency } = useFormatter()
  const router = useRouter()

  const loadData = async () => {
    setLoading(true)
    try {
      const [prop, unitsList] = await Promise.all([
        fetchPropertyById(id!),
        fetchUnitsByProperty(id!),
      ])
      setProperty(prop)
      setUnits(unitsList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('properties.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteProperty(id!)
            router.back()
          },
        },
      ]
    )
  }

  if (loading) return <LoadingSpinner />
  if (!property) return null

  const occupiedUnits = units.filter(u => u.status === 'occupied').length

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.primary} />}
    >
      {/* Image Gallery */}
      {property.image_urls?.length > 0 && (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {property.image_urls.map((url: string, idx: number) => (
            <Image key={idx} source={{ uri: url }} style={styles.heroImage} />
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.text }]}>{property.name}</Text>
          <Badge label={property.type} />
        </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {property.address}, {property.city}, {property.state} {property.zip}
          </Text>
        </View>

        {property.size && (
          <View style={styles.infoRow}>
            <Maximize size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{property.size} sqm</Text>
          </View>
        )}

        {property.description && (
          <Text style={[styles.description, { color: colors.text }]}>{property.description}</Text>
        )}

        {/* Amenities */}
        {property.amenities && (
          <View style={styles.amenities}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('properties.amenities')}</Text>
            <View style={styles.amenityChips}>
              {Object.entries(property.amenities)
                .filter(([, v]) => v)
                .map(([key]) => (
                  <Badge key={key} label={t(`properties.${key}`)} variant="default" />
                ))}
            </View>
          </View>
        )}

        {/* Units Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('properties.units')} ({units.length})</Text>
        <Card style={styles.unitsSummary}>
          <View style={styles.unitStat}>
            <Text style={[styles.unitStatValue, { color: colors.success }]}>{occupiedUnits}</Text>
            <Text style={[styles.unitStatLabel, { color: colors.textSecondary }]}>{t('properties.occupied')}</Text>
          </View>
          <View style={styles.unitDivider} />
          <View style={styles.unitStat}>
            <Text style={[styles.unitStatValue, { color: colors.warning }]}>{units.length - occupiedUnits}</Text>
            <Text style={[styles.unitStatLabel, { color: colors.textSecondary }]}>{t('properties.vacant')}</Text>
          </View>
        </Card>

        {/* Unit List */}
        {units.map((unit: any) => (
          <Card key={unit.id} style={styles.unitCard}>
            <View style={styles.unitRow}>
              <View>
                <Text style={[styles.unitName, { color: colors.text }]}>{unit.name}</Text>
                {unit.floor != null && (
                  <Text style={[styles.unitMeta, { color: colors.textSecondary }]}>
                    Floor {unit.floor}{unit.size ? ` · ${unit.size} sqm` : ''}
                  </Text>
                )}
              </View>
              <View style={styles.unitRight}>
                {unit.rent_amount && (
                  <Text style={[styles.unitRent, { color: colors.text }]}>{formatCurrency(unit.rent_amount)}</Text>
                )}
                <Badge
                  label={unit.status}
                  variant={unit.status === 'occupied' ? 'success' : unit.status === 'vacant' ? 'warning' : 'danger'}
                />
              </View>
            </View>
          </Card>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <Button title={t('common.delete')} variant="danger" onPress={handleDelete} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroImage: { width: 400, height: 250 },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '800', flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { fontSize: 14, flex: 1 },
  description: { fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 16 },
  amenities: { marginBottom: 8 },
  amenityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  unitStat: { flex: 1, alignItems: 'center' },
  unitStatValue: { fontSize: 28, fontWeight: '800' },
  unitStatLabel: { fontSize: 13, marginTop: 4 },
  unitDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
  unitCard: { marginBottom: 8 },
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitName: { fontSize: 16, fontWeight: '600' },
  unitMeta: { fontSize: 13, marginTop: 2 },
  unitRight: { alignItems: 'flex-end', gap: 4 },
  unitRent: { fontSize: 15, fontWeight: '600' },
  actions: { marginTop: 24, marginBottom: 40 },
})
