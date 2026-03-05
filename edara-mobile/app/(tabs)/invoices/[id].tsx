import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { useFormatter } from '../../../hooks/use-formatter'
import { fetchInvoices, updateInvoice, deleteInvoice } from '../../../lib/services/invoices'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency, formatDate } = useFormatter()
  const router = useRouter()

  useEffect(() => {
    fetchInvoices().then((invoices) => {
      const found = invoices.find((i: any) => i.id === id)
      setInvoice(found)
      setLoading(false)
    })
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await updateInvoice(id!, { status: newStatus })
      setInvoice({ ...invoice, status: newStatus })
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(t('common.delete'), t('invoices.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteInvoice(id!); router.back() } },
    ])
  }

  if (loading) return <LoadingSpinner />
  if (!invoice) return null

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.invoiceNum, { color: colors.text }]}>{invoice.invoice_number}</Text>
          <Badge
            label={t(`status.${invoice.status}`)}
            variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'}
          />
        </View>

        <Text style={[styles.amount, { color: colors.text }]}>{formatCurrency(invoice.amount)}</Text>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('invoices.tenant')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {invoice.tenant ? `${invoice.tenant.first_name} ${invoice.tenant.last_name}` : '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('invoices.property')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{invoice.property?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('invoices.issueDate')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(invoice.issue_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('invoices.dueDate')}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(invoice.due_date)}</Text>
          </View>
          {invoice.description && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('invoices.description')}</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{invoice.description}</Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {invoice.status !== 'paid' && (
            <Button title={t('invoices.markAsPaid')} onPress={() => handleStatusChange('paid')} loading={updating} />
          )}
          {invoice.status === 'paid' && (
            <Button title={t('invoices.markAsPending')} variant="outline" onPress={() => handleStatusChange('pending')} loading={updating} />
          )}
          <Button title={t('common.delete')} variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  invoiceNum: { fontSize: 22, fontWeight: '800' },
  amount: { fontSize: 32, fontWeight: '800', marginBottom: 24 },
  detailsCard: { marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  actions: { marginTop: 8, marginBottom: 40 },
  deleteBtn: { marginTop: 12 },
})
