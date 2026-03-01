import { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertInvoice } from '../../../lib/services/invoices'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export default function AddInvoiceScreen() {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [tenantId, setTenantId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!amount || !dueDate || !tenantId || !propertyId || !unitId) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await insertInvoice({
        invoice_number: invoiceNumber,
        tenant_id: tenantId,
        property_id: propertyId,
        unit_id: unitId,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        amount: parseFloat(amount),
        description: description || null,
        items: [{ description: description || 'Rent', amount: parseFloat(amount), sort_order: 0 }],
      })
      router.back()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label={t('invoices.invoiceNumber')} value={invoiceNumber} onChangeText={setInvoiceNumber} />
        <Input label={`${t('invoices.tenantId')} *`} value={tenantId} onChangeText={setTenantId} placeholder="Tenant ID" />
        <Input label={`${t('invoices.propertyId')} *`} value={propertyId} onChangeText={setPropertyId} placeholder="Property ID" />
        <Input label={`${t('invoices.unitId')} *`} value={unitId} onChangeText={setUnitId} placeholder="Unit ID" />
        <Input label={`${t('invoices.amount')} *`} value={amount} onChangeText={setAmount} placeholder="0.000" keyboardType="decimal-pad" />
        <Input label={`${t('invoices.dueDate')} *`} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
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
  spacer: { height: 40 },
})
