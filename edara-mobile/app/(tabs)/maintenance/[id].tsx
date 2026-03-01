import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { fetchMaintenanceRequests, updateMaintenanceRequest, deleteMaintenanceRequest } from '../../../lib/services/maintenance'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatDate } = useFormatter()
  const router = useRouter()

  useEffect(() => {
    fetchMaintenanceRequests().then((requests) => {
      const found = requests.find((r: any) => r.id === id)
      setRequest(found)
      setLoading(false)
    })
  }, [id])

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true)
    try {
      await updateMaintenanceRequest(id!, { status })
      setRequest({ ...request, status })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(t('common.delete'), 'Delete this maintenance request?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteMaintenanceRequest(id!); router.back() } },
    ])
  }

  if (loading) return <LoadingSpinner />
  if (!request) return null

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{request.title}</Text>
        <View style={styles.badges}>
          <Badge label={request.category} />
          <Badge label={request.priority} variant={request.priority === 'high' ? 'danger' : request.priority === 'medium' ? 'warning' : 'default'} />
          <Badge label={request.status} variant={request.status === 'completed' ? 'success' : 'warning'} />
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('properties.property')}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{request.property?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('properties.unit')}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{request.unit?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.date')}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatDate(request.created_at)}</Text>
          </View>
          {request.contact_preference && (
            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Contact</Text>
              <Text style={[styles.value, { color: colors.text }]}>{request.contact_preference}</Text>
            </View>
          )}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('maintenance.description')}</Text>
        <Card>
          <Text style={[styles.description, { color: colors.text }]}>{request.description}</Text>
        </Card>

        {/* Images */}
        {request.image_urls?.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {request.image_urls.map((url: string, idx: number) => (
                <Image key={idx} source={{ uri: url }} style={styles.image} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Status Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Status</Text>
        <View style={styles.statusActions}>
          {['pending', 'assigned', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              title={status.replace('_', ' ')}
              variant={request.status === status ? 'primary' : 'secondary'}
              onPress={() => handleStatusUpdate(status)}
              loading={updating}
              style={styles.statusBtn}
            />
          ))}
        </View>

        <Button title={t('common.delete')} variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
        <View style={styles.spacer} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  detailsCard: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  label: { fontSize: 14 },
  value: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 16 },
  description: { fontSize: 15, lineHeight: 22 },
  image: { width: 200, height: 150, borderRadius: 8, marginEnd: 10 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  deleteBtn: { marginTop: 24 },
  spacer: { height: 40 },
})
