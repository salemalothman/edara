import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Keyboard } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ChevronDown, Check } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertContract } from '../../../lib/services/contracts'
import { fetchTenants } from '../../../lib/services/tenants'
import { fetchProperties } from '../../../lib/services/properties'
import { fetchUnitsByProperty } from '../../../lib/services/units'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export default function AddContractScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId?: string }>()
  const [contractId, setContractId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [loading, setLoading] = useState(false)

  // Tenant selection
  const [allTenants, setAllTenants] = useState<any[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(tenantId || null)
  const [showTenantPicker, setShowTenantPicker] = useState(false)

  // Property & Unit selection
  const [properties, setProperties] = useState<any[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [showUnitPicker, setShowUnitPicker] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  useEffect(() => {
    fetchTenants().then(setAllTenants).catch(console.error)
    fetchProperties().then(setProperties).catch(console.error)
  }, [])

  // Auto-fill property/unit from selected tenant
  useEffect(() => {
    if (selectedTenantId) {
      const tenant = allTenants.find(t => t.id === selectedTenantId)
      if (tenant?.property_id) {
        setSelectedPropertyId(tenant.property_id)
        if (tenant.unit_id) setSelectedUnitId(tenant.unit_id)
      }
    }
  }, [selectedTenantId, allTenants])

  // Load units when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchUnitsByProperty(selectedPropertyId).then(setUnits).catch(console.error)
    } else {
      setUnits([])
      setSelectedUnitId(null)
    }
  }, [selectedPropertyId])

  const selectedTenant = allTenants.find(t => t.id === selectedTenantId)
  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const selectedUnit = units.find(u => u.id === selectedUnitId)

  const handleSubmit = async () => {
    if (!contractId || !selectedTenantId || !selectedPropertyId || !selectedUnitId || !startDate || !endDate || !rentAmount) {
      Alert.alert(t('common.error'), t('contracts.addError'))
      return
    }

    setLoading(true)
    try {
      await insertContract({
        contract_id: contractId,
        tenant_id: selectedTenantId,
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        start_date: startDate,
        end_date: endDate,
        rent_amount: parseFloat(rentAmount),
        deposit_amount: depositAmount ? parseFloat(depositAmount) : null,
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
        <Input label={`${t('contracts.contractId')} *`} value={contractId} onChangeText={setContractId} placeholder={t('contracts.contractIdPlaceholder')} />

        {/* Tenant Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('contracts.tenant')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => { setShowTenantPicker(!showTenantPicker); setShowPropertyPicker(false); setShowUnitPicker(false) }}
        >
          <Text style={[styles.pickerText, { color: selectedTenant ? colors.text : colors.textSecondary }]}>
            {selectedTenant ? `${selectedTenant.first_name} ${selectedTenant.last_name}` : t('contracts.selectTenant')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showTenantPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {allTenants.length === 0 && (
              <Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>No tenants</Text>
            )}
            {allTenants.map((tenant) => (
              <TouchableOpacity
                key={tenant.id}
                style={[styles.pickerItem, selectedTenantId === tenant.id && { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  setSelectedTenantId(tenant.id)
                  setShowTenantPicker(false)
                }}
              >
                <View style={styles.pickerItemContent}>
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>{tenant.first_name} {tenant.last_name}</Text>
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>{tenant.email}</Text>
                </View>
                {selectedTenantId === tenant.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Property Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('contracts.property')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => { setShowPropertyPicker(!showPropertyPicker); setShowTenantPicker(false); setShowUnitPicker(false) }}
        >
          <Text style={[styles.pickerText, { color: selectedProperty ? colors.text : colors.textSecondary }]}>
            {selectedProperty ? selectedProperty.name : t('contracts.selectProperty')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showPropertyPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {properties.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                style={[styles.pickerItem, selectedPropertyId === prop.id && { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  setSelectedPropertyId(prop.id)
                  setShowPropertyPicker(false)
                }}
              >
                <View style={styles.pickerItemContent}>
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>{prop.name}</Text>
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>{prop.address}</Text>
                </View>
                {selectedPropertyId === prop.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Unit Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('contracts.unit')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: selectedPropertyId ? 1 : 0.5 }]}
          onPress={() => {
            if (!selectedPropertyId) return
            setShowUnitPicker(!showUnitPicker)
            setShowTenantPicker(false)
            setShowPropertyPicker(false)
          }}
        >
          <Text style={[styles.pickerText, { color: selectedUnit ? colors.text : colors.textSecondary }]}>
            {selectedUnit ? selectedUnit.name : t('contracts.selectUnit')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showUnitPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {units.map((unit) => (
              <TouchableOpacity
                key={unit.id}
                style={[styles.pickerItem, selectedUnitId === unit.id && { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  setSelectedUnitId(unit.id)
                  setShowUnitPicker(false)
                }}
              >
                <View style={styles.pickerItemContent}>
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>{unit.name}</Text>
                </View>
                {selectedUnitId === unit.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Input label={`${t('contracts.startDate')} *`} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <Input label={`${t('contracts.endDate')} *`} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
        <Input label={`${t('contracts.rentAmount')} *`} value={rentAmount} onChangeText={setRentAmount} placeholder="0.000" keyboardType="decimal-pad" />
        <Input label={t('contracts.depositAmount')} value={depositAmount} onChangeText={setDepositAmount} placeholder="0.000" keyboardType="decimal-pad" />

        <Button title={t('contracts.addContract')} onPress={handleSubmit} loading={loading} />
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
