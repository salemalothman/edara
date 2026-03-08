import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronDown, Check } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { usePermissions } from '../../../hooks/use-permissions'
import { insertInvoice } from '../../../lib/services/invoices'
import { fetchTenants } from '../../../lib/services/tenants'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export default function AddInvoiceScreen() {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [amount, setAmount] = useState('')
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Tenant picker
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [showTenantPicker, setShowTenantPicker] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const { canCreate } = usePermissions()
  const router = useRouter()

  if (!canCreate) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{t('permissions.adminRequired')}</Text>
      </View>
    )
  }

  useEffect(() => {
    fetchTenants().then(setTenants).catch(console.error)
  }, [])

  const selectedTenant = tenants.find(te => te.id === selectedTenantId)

  // Auto-fill property and unit from selected tenant
  const propertyId = selectedTenant?.property_id || ''
  const propertyName = selectedTenant?.property?.name || ''
  const unitId = selectedTenant?.unit_id || ''
  const unitName = selectedTenant?.unit?.name || ''

  const handleSubmit = async () => {
    if (!amount || !paidDate || !selectedTenantId || !propertyId || !unitId) {
      Alert.alert(t('common.error'), t('invoices.requiredFieldsError'))
      return
    }

    setLoading(true)
    try {
      await insertInvoice({
        invoice_number: invoiceNumber,
        tenant_id: selectedTenantId,
        property_id: propertyId,
        unit_id: unitId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: paidDate,
        amount: parseFloat(amount),
        description: description || null,
        items: [{ description: description || t('tenants.monthlyRent'), amount: parseFloat(amount), sort_order: 0 }],
      })
      router.back()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" onScrollBeginDrag={Keyboard.dismiss}>
        <Input label={t('invoices.invoiceNumber')} value={invoiceNumber} onChangeText={setInvoiceNumber} />

        {/* Tenant Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('invoices.tenant')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowTenantPicker(!showTenantPicker)}
        >
          <Text style={[styles.pickerText, { color: selectedTenant ? colors.text : colors.textSecondary }]}>
            {selectedTenant ? `${selectedTenant.first_name} ${selectedTenant.last_name}` : t('invoices.selectTenant')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showTenantPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {tenants.length === 0 && (
              <Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>{t('tenants.noTenants')}</Text>
            )}
            {tenants.map((tenant) => (
              <TouchableOpacity
                key={tenant.id}
                style={[styles.pickerItem, selectedTenantId === tenant.id && { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  setSelectedTenantId(tenant.id)
                  setShowTenantPicker(false)
                  // Auto-fill rent if available
                  if (tenant.rent && !amount) {
                    setAmount(String(tenant.rent))
                  }
                }}
              >
                <View style={styles.pickerItemContent}>
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>
                    {tenant.first_name} {tenant.last_name}
                  </Text>
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>
                    {tenant.property?.name || '—'}{tenant.unit?.name ? ` · ${tenant.unit.name}` : ''}
                  </Text>
                </View>
                {selectedTenantId === tenant.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Property (auto-filled, read-only) */}
        <Input
          label={`${t('invoices.propertyId')} *`}
          value={propertyName}
          editable={false}
          placeholder={t('invoices.selectTenant')}
        />

        {/* Unit (auto-filled, read-only) */}
        <Input
          label={`${t('invoices.unitId')} *`}
          value={unitName}
          editable={false}
          placeholder={t('invoices.selectTenant')}
        />

        <Input label={`${t('invoices.amount')} *`} value={amount} onChangeText={setAmount} placeholder="0.000" keyboardType="decimal-pad" />
        <Input label={`${t('invoices.paidDate')} *`} value={paidDate} onChangeText={setPaidDate} placeholder="YYYY-MM-DD" />
        <Input label={t('invoices.description')} value={description} onChangeText={setDescription} placeholder={t('invoices.description')} multiline />

        <Button title={t('invoices.createInvoice')} onPress={handleSubmit} loading={loading} />
        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
  pickerText: { fontSize: 15 },
  pickerList: { marginTop: -8, marginBottom: 12, borderWidth: 1, maxHeight: 250 },
  pickerEmpty: { fontSize: 14, padding: 16, textAlign: 'center' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  pickerItemContent: { flex: 1 },
  pickerItemText: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 12, marginTop: 2 },
  spacer: { height: 40 },
})
