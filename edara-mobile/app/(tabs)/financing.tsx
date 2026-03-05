import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Pencil, Save } from 'lucide-react-native'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { useFormatter } from '../../hooks/use-formatter'
import { useSupabaseQuery } from '../../hooks/use-supabase-query'
import { fetchProperties, updateProperty } from '../../lib/services/properties'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export default function FinancingScreen() {
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { formatCurrency } = useFormatter()

  const { data: properties, loading, refetch } = useSupabaseQuery(fetchProperties)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => { refetch() }, []))

  const totals = properties.reduce((acc: any, p: any) => ({
    value: acc.value + (p.current_property_value || 0),
    debt: acc.debt + (p.annual_debt_service || 0),
    cash: acc.cash + (p.total_cash_invested || 0),
  }), { value: 0, debt: 0, cash: 0 })

  const startEditing = (property: any) => {
    setEditingId(property.id)
    setEditValues({
      current_property_value: String(property.current_property_value || ''),
      annual_debt_service: String(property.annual_debt_service || ''),
      total_cash_invested: String(property.total_cash_invested || ''),
    })
  }

  const handleSave = async (propertyId: string) => {
    setSaving(true)
    try {
      await updateProperty(propertyId, {
        current_property_value: editValues.current_property_value ? parseFloat(editValues.current_property_value) : null,
        annual_debt_service: editValues.annual_debt_service ? parseFloat(editValues.annual_debt_service) : null,
        total_cash_invested: editValues.total_cash_invested ? parseFloat(editValues.total_cash_invested) : null,
      })
      setEditingId(null)
      refetch()
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message)
    } finally {
      setSaving(false)
    }
  }

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isEditing = editingId === item.id
    return (
      <Card style={styles.propertyCard}>
        <View style={styles.cardHeader}>
          <Text style={[styles.propertyName, { color: colors.text }]}>{item.name}</Text>
          {isEditing ? (
            <TouchableOpacity onPress={() => handleSave(item.id)} disabled={saving}>
              <Save size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => startEditing(item)}>
              <Pencil size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editFields}>
            <Input
              label={t('financing.propertyValue')}
              value={editValues.current_property_value}
              onChangeText={(v) => setEditValues(prev => ({ ...prev, current_property_value: v }))}
              placeholder="0.000"
              keyboardType="decimal-pad"
            />
            <Input
              label={t('financing.annualDebtService')}
              value={editValues.annual_debt_service}
              onChangeText={(v) => setEditValues(prev => ({ ...prev, annual_debt_service: v }))}
              placeholder="0.000"
              keyboardType="decimal-pad"
            />
            <Input
              label={t('financing.totalCashInvested')}
              value={editValues.total_cash_invested}
              onChangeText={(v) => setEditValues(prev => ({ ...prev, total_cash_invested: v }))}
              placeholder="0.000"
              keyboardType="decimal-pad"
            />
          </View>
        ) : (
          <View style={styles.readFields}>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('financing.propertyValue')}</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {item.current_property_value ? formatCurrency(item.current_property_value) : '—'}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('financing.annualDebtService')}</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {item.annual_debt_service ? formatCurrency(item.annual_debt_service) : '—'}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('financing.totalCashInvested')}</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {item.total_cash_invested ? formatCurrency(item.total_cash_invested) : '—'}
              </Text>
            </View>
          </View>
        )}
      </Card>
    )
  }, [editingId, editValues, colors, saving])

  if (loading && properties.length === 0) return <LoadingSpinner />

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('financing.financing')}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('financing.propertyValue')}</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(totals.value)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('financing.annualDebtService')}</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatCurrency(totals.debt)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('financing.totalCashInvested')}</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCurrency(totals.cash)}</Text>
            </View>
          </View>
        </Card>

        <FlatList
          data={properties}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.primary} />}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  summaryCard: { margin: 16, marginBottom: 8, padding: 16 },
  summaryTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  summaryRow: { gap: 10 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  propertyCard: { marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  propertyName: { fontSize: 16, fontWeight: '700' },
  editFields: { gap: 4 },
  readFields: { gap: 8 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13 },
  fieldValue: { fontSize: 14, fontWeight: '600' },
})
