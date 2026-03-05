import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Linking, Alert, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Phone, Mail, Calendar, Home, MessageCircle, FileText, ExternalLink, Trash2, Upload } from 'lucide-react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { fetchTenants, deleteTenant } from '../../../lib/services/tenants'
import { deleteContract, uploadContractForTenant } from '../../../lib/services/contracts'
import { openWhatsApp } from '../../../lib/services/whatsapp-reminders'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency, formatDate } = useFormatter()
  const router = useRouter()

  const loadTenant = async () => {
    const tenants = await fetchTenants()
    const found = tenants.find((t: any) => t.id === id)
    setTenant(found)
    setLoading(false)
  }

  useEffect(() => { loadTenant() }, [id])

  const handleDelete = () => {
    Alert.alert(t('common.delete'), t('tenants.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteTenant(id!); router.back() } },
    ])
  }

  const handleDeleteContract = (contractId: string, fileUrl: string | null) => {
    Alert.alert(t('contracts.deleteContract'), t('contracts.confirmDeleteContract'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await deleteContract(contractId, fileUrl)
            await loadTenant()
          } catch (err: any) {
            Alert.alert(t('common.error'), err.message)
          }
        },
      },
    ])
  }

  const handleUploadContract = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.length) return
      const asset = result.assets[0]

      setUploading(true)
      await uploadContractForTenant(
        tenant.id,
        tenant.property_id || '',
        tenant.unit_id || '',
        asset.uri,
        asset.name
      )
      await loadTenant()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!tenant) return null

  const sortedContracts = tenant.contracts?.length
    ? [...tenant.contracts].sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
    : []
  const contract = sortedContracts[0] || null

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

        {/* Contract Info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.contracts')}</Text>
        {contract ? (
          <Card>
            {contract.file_url ? (
              <>
                <TouchableOpacity
                  style={styles.viewContractBtn}
                  onPress={() => Linking.openURL(contract.file_url)}
                >
                  <View style={[styles.pdfIcon, { backgroundColor: colors.primaryLight || '#e0f2fe' }]}>
                    <FileText size={24} color={colors.primary} />
                  </View>
                  <View style={styles.viewContractInfo}>
                    <Text style={[styles.viewContractTitle, { color: colors.text }]}>{t('contracts.viewContract')}</Text>
                    <Text style={[styles.viewContractSub, { color: colors.textSecondary }]}>{contract.contract_id}</Text>
                  </View>
                  <ExternalLink size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteContractBtn, { borderTopColor: colors.border || '#e2e8f0' }]}
                  onPress={() => handleDeleteContract(contract.id, contract.file_url)}
                >
                  <Trash2 size={16} color={colors.danger || '#dc2626'} />
                  <Text style={[styles.deleteContractText, { color: colors.danger || '#dc2626' }]}>
                    {t('contracts.deleteContract')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.contractIdRow}>
                <FileText size={16} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('contracts.contractId')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{contract.contract_id}</Text>
              </View>
            )}
          </Card>
        ) : (
          <Card>
            <Text style={[styles.noContract, { color: colors.textSecondary }]}>{t('contracts.noContract')}</Text>
          </Card>
        )}
        <Button
          title={t('contracts.addContract')}
          variant="outline"
          icon={<Upload size={16} color={colors.primary} />}
          onPress={handleUploadContract}
          loading={uploading}
          style={{ marginTop: 12 }}
        />

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
  noContract: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  viewContractBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  pdfIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  viewContractInfo: { flex: 1 },
  viewContractTitle: { fontSize: 16, fontWeight: '600' },
  viewContractSub: { fontSize: 13, marginTop: 2 },
  contractIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  deleteContractBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, marginTop: 8, borderTopWidth: 0.5 },
  deleteContractText: { fontSize: 14, fontWeight: '500' },
  actions: { marginTop: 32, marginBottom: 40 },
})
