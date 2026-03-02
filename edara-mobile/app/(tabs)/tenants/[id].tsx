import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Linking, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Phone, Mail, Calendar, Home, MessageCircle } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { fetchTenants, deleteTenant } from '../../../lib/services/tenants'
import { openWhatsApp } from '../../../lib/services/whatsapp-reminders'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency, formatDate } = useFormatter()
  const router = useRouter()

  useEffect(() => {
    fetchTenants().then((tenants) => {
      const found = tenants.find((t: any) => t.id === id)
      setTenant(found)
      setLoading(false)
    })
  }, [id])

  const handleDelete = () => {
    Alert.alert(t('common.delete'), t('tenants.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteTenant(id!); router.back() } },
    ])
  }

  if (loading) return <LoadingSpinner />
  if (!tenant) return null

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{tenant.first_name[0]}{tenant.last_name[0]}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{tenant.first_name} {tenant.last_name}</Text>
          <Badge label={t(`status.${tenant.status}`)} variant={tenant.status === 'active' ? 'success' : 'warning'} />
        </View>

        {/* Contact */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tenants.contactInfo')}</Text>
        <Card>
          <View style={styles.contactItem}>
            <Mail size={18} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]} onPress={() => Linking.openURL(`mailto:${tenant.email}`)}>
              {tenant.email}
            </Text>
          </View>
          {tenant.phone && (
            <>
              <View style={styles.contactItem}>
                <Phone size={18} color={colors.primary} />
                <Text style={[styles.contactText, { color: colors.text }]} onPress={() => Linking.openURL(`tel:${tenant.phone}`)}>
                  {tenant.phone}
                </Text>
              </View>
              <View style={styles.contactItem}>
                <MessageCircle size={18} color={colors.success} />
                <Text
                  style={[styles.contactText, { color: colors.success }]}
                  onPress={() => openWhatsApp(tenant.phone, `Hello ${tenant.first_name}`)}
                >
                  WhatsApp
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Property & Lease */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tenants.leaseInfo')}</Text>
        <Card>
          {tenant.property?.name && (
            <View style={styles.infoRow}>
              <Home size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('properties.property')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{tenant.property.name}</Text>
            </View>
          )}
          {tenant.unit?.name && (
            <View style={styles.infoRow}>
              <Home size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('properties.unit')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{tenant.unit.name}</Text>
            </View>
          )}
          {tenant.move_in_date && (
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('tenants.moveInDate')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(tenant.move_in_date)}</Text>
            </View>
          )}
          {tenant.lease_end_date && (
            <View style={styles.infoRow}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('tenants.leaseEndDate')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(tenant.lease_end_date)}</Text>
            </View>
          )}
          {tenant.rent && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>    {t('tenants.monthlyRent')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{formatCurrency(tenant.rent)}</Text>
            </View>
          )}
          {tenant.deposit && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>    {t('tenants.deposit')}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{formatCurrency(tenant.deposit)}</Text>
            </View>
          )}
        </Card>

        <View style={styles.actions}>
          <Button title={t('common.delete')} variant="danger" onPress={handleDelete} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0284c7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10, marginTop: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  contactText: { fontSize: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  actions: { marginTop: 32, marginBottom: 40 },
})
