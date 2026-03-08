import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronDown, Check } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { usePermissions } from '../../../hooks/use-permissions'
import { insertExpense } from '../../../lib/services/expenses'
import { fetchProperties } from '../../../lib/services/properties'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export default function AddExpenseScreen() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  // Property picker
  const [properties, setProperties] = useState<any[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)

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

  const categories = ['guard', 'cleaning', 'utilities', 'repairs', 'insurance', 'management', 'other']

  useEffect(() => {
    fetchProperties().then(setProperties).catch(console.error)
  }, [])

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)

  const handleSubmit = async () => {
    if (!description || !amount) {
      Alert.alert(t('common.error'), t('expenses.requiredFieldsError'))
      return
    }

    setLoading(true)
    try {
      await insertExpense({
        description,
        amount: parseFloat(amount),
        category,
        property_id: selectedPropertyId,
        date,
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
        <Input label={`${t('expenses.description')} *`} value={description} onChangeText={setDescription} placeholder={t('expenses.description')} />

        <Input label={`${t('expenses.amount')} *`} value={amount} onChangeText={setAmount} placeholder="0.000" keyboardType="decimal-pad" />

        <Text style={[styles.label, { color: colors.text }]}>{t('expenses.category')}</Text>
        <View style={styles.chipRow}>
          {categories.map((c) => (
            <Button key={c} title={t(`expenses.${c}`)} variant={category === c ? 'primary' : 'secondary'} onPress={() => setCategory(c)} style={styles.chip} />
          ))}
        </View>

        {/* Property Picker (optional) */}
        <Text style={[styles.label, { color: colors.text }]}>{t('expenses.property')}</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowPropertyPicker(!showPropertyPicker)}
        >
          <Text style={[styles.pickerText, { color: selectedProperty ? colors.text : colors.textSecondary }]}>
            {selectedProperty ? selectedProperty.name : t('tenants.selectProperty')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showPropertyPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.pickerItem, !selectedPropertyId && { backgroundColor: colors.primaryLight }]}
              onPress={() => { setSelectedPropertyId(null); setShowPropertyPicker(false) }}
            >
              <Text style={[styles.pickerItemText, { color: colors.textSecondary }]}>— {t('common.all')} —</Text>
            </TouchableOpacity>
            {properties.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                style={[styles.pickerItem, selectedPropertyId === prop.id && { backgroundColor: colors.primaryLight }]}
                onPress={() => { setSelectedPropertyId(prop.id); setShowPropertyPicker(false) }}
              >
                <View style={styles.pickerItemContent}>
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>{prop.name}</Text>
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>{prop.address}, {prop.city}</Text>
                </View>
                {selectedPropertyId === prop.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Input label={`${t('expenses.date')} *`} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

        <Button title={t('expenses.addExpense')} onPress={handleSubmit} loading={loading} />
        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8 },
  pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
  pickerText: { fontSize: 15 },
  pickerList: { marginTop: -8, marginBottom: 12, borderWidth: 1, maxHeight: 250 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  pickerItemContent: { flex: 1 },
  pickerItemText: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 12, marginTop: 2 },
  spacer: { height: 40 },
})
