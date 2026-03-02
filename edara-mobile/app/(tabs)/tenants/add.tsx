import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronDown, Check } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertTenant } from '../../../lib/services/tenants'
import { fetchProperties } from '../../../lib/services/properties'
import { fetchUnitsByProperty, updateUnit } from '../../../lib/services/units'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export default function AddTenantScreen() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')
  const [loading, setLoading] = useState(false)

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

  // Load properties on mount
  useEffect(() => {
    fetchProperties().then(setProperties).catch(console.error)
  }, [])

  // Load units when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchUnitsByProperty(selectedPropertyId).then(setUnits).catch(console.error)
      setSelectedUnitId(null)
    } else {
      setUnits([])
      setSelectedUnitId(null)
    }
  }, [selectedPropertyId])

  // Auto-fill rent from selected unit
  useEffect(() => {
    if (selectedUnitId) {
      const unit = units.find(u => u.id === selectedUnitId)
      if (unit?.rent_amount && !rent) {
        setRent(String(unit.rent_amount))
      }
    }
  }, [selectedUnitId])

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const selectedUnit = units.find(u => u.id === selectedUnitId)
  const vacantUnits = units.filter(u => u.status === 'vacant')

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill in the required fields (name, email)')
      return
    }
    if (!selectedPropertyId || !selectedUnitId) {
      Alert.alert('Error', 'Please select a property and unit')
      return
    }

    setLoading(true)
    try {
      await insertTenant({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        move_in_date: moveInDate || null,
        lease_end_date: leaseEndDate || null,
        rent: rent ? parseFloat(rent) : null,
        deposit: deposit ? parseFloat(deposit) : null,
      })

      // Mark unit as occupied
      await updateUnit(selectedUnitId, { status: 'occupied' })

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
        <Input label={`${t('tenants.firstName')} *`} value={firstName} onChangeText={setFirstName} placeholder={t('tenants.firstName')} />
        <Input label={`${t('tenants.lastName')} *`} value={lastName} onChangeText={setLastName} placeholder={t('tenants.lastName')} />
        <Input label={`${t('tenants.email')} *`} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label={t('tenants.phone')} value={phone} onChangeText={setPhone} placeholder="+965 XXXX XXXX" keyboardType="phone-pad" />

        {/* Property Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('properties.property')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => { setShowPropertyPicker(!showPropertyPicker); setShowUnitPicker(false) }}
        >
          <Text style={[styles.pickerText, { color: selectedProperty ? colors.text : colors.textSecondary }]}>
            {selectedProperty ? selectedProperty.name : 'Select a property...'}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showPropertyPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {properties.length === 0 && (
              <Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>No properties found. Add a property first.</Text>
            )}
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
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>{prop.address}, {prop.city}</Text>
                </View>
                {selectedPropertyId === prop.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Unit Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('properties.unit')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: selectedPropertyId ? 1 : 0.5 }]}
          onPress={() => {
            if (!selectedPropertyId) {
              Alert.alert('', 'Please select a property first')
              return
            }
            setShowUnitPicker(!showUnitPicker)
            setShowPropertyPicker(false)
          }}
        >
          <Text style={[styles.pickerText, { color: selectedUnit ? colors.text : colors.textSecondary }]}>
            {selectedUnit ? `${selectedUnit.name}${selectedUnit.floor != null ? ` (Floor ${selectedUnit.floor})` : ''}` : 'Select a unit...'}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showUnitPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {vacantUnits.length === 0 && (
              <Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>
                {units.length === 0 ? 'No units in this property. Add units first.' : 'No vacant units available.'}
              </Text>
            )}
            {vacantUnits.map((unit) => (
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
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>
                    {unit.floor != null ? `Floor ${unit.floor}` : ''}
                    {unit.size ? `${unit.floor != null ? ' · ' : ''}${unit.size} sqm` : ''}
                    {unit.rent_amount ? `${(unit.floor != null || unit.size) ? ' · ' : ''}${unit.rent_amount} KWD` : ''}
                  </Text>
                </View>
                {selectedUnitId === unit.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Input label={t('tenants.moveInDate')} value={moveInDate} onChangeText={setMoveInDate} placeholder="YYYY-MM-DD" />
        <Input label={t('tenants.leaseEndDate')} value={leaseEndDate} onChangeText={setLeaseEndDate} placeholder="YYYY-MM-DD" />
        <Input label={t('tenants.monthlyRent')} value={rent} onChangeText={setRent} placeholder="0.000" keyboardType="decimal-pad" />
        <Input label={t('tenants.deposit')} value={deposit} onChangeText={setDeposit} placeholder="0.000" keyboardType="decimal-pad" />

        <Button title={t('tenants.addTenant')} onPress={handleSubmit} loading={loading} />
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
