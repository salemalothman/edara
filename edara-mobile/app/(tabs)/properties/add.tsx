import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, Trash2 } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertProperty } from '../../../lib/services/properties'
import { insertUnit } from '../../../lib/services/units'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

type UnitEntry = {
  name: string
  floor: string
  size: string
  rent_amount: string
}

const emptyUnit = (): UnitEntry => ({ name: '', floor: '', size: '', rent_amount: '' })

export default function AddPropertyScreen() {
  const [name, setName] = useState('')
  const [type, setType] = useState('residential')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [size, setSize] = useState('')
  const [description, setDescription] = useState('')
  const [unitEntries, setUnitEntries] = useState<UnitEntry[]>([emptyUnit()])
  const [loading, setLoading] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const addUnitEntry = () => {
    setUnitEntries(prev => [...prev, emptyUnit()])
  }

  const removeUnitEntry = (index: number) => {
    if (unitEntries.length <= 1) return
    setUnitEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateUnitEntry = (index: number, field: keyof UnitEntry, value: string) => {
    setUnitEntries(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
  }

  const handleSubmit = async () => {
    if (!name || !address || !city) {
      Alert.alert('Error', 'Please fill in the required fields (name, address, city)')
      return
    }

    const validUnits = unitEntries.filter(u => u.name.trim())
    if (validUnits.length === 0) {
      Alert.alert('Error', 'Please add at least one unit with a name')
      return
    }

    setLoading(true)
    try {
      const property = await insertProperty({
        name,
        type,
        address,
        city,
        state,
        zip,
        units: validUnits.length,
        size: size ? parseFloat(size) : null,
        description: description || null,
      })

      // Create unit records
      for (const unit of validUnits) {
        await insertUnit({
          property_id: property.id,
          name: unit.name.trim(),
          floor: unit.floor ? parseInt(unit.floor) : null,
          size: unit.size ? parseFloat(unit.size) : null,
          rent_amount: unit.rent_amount ? parseFloat(unit.rent_amount) : null,
          status: 'vacant',
        })
      }

      router.back()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input label={`${t('properties.propertyName')} *`} value={name} onChangeText={setName} placeholder={t('properties.propertyName')} />

        <Text style={[styles.label, { color: colors.text }]}>{t('properties.propertyType')}</Text>
        <View style={styles.typeRow}>
          {['residential', 'commercial', 'mixed'].map((t_) => (
            <Button
              key={t_}
              title={t(`properties.${t_}`)}
              variant={type === t_ ? 'primary' : 'secondary'}
              onPress={() => setType(t_)}
              style={styles.typeBtn}
            />
          ))}
        </View>

        <Input label={`${t('properties.address')} *`} value={address} onChangeText={setAddress} placeholder={t('properties.address')} />
        <Input label={`${t('properties.city')} *`} value={city} onChangeText={setCity} placeholder={t('properties.city')} />
        <Input label={t('properties.state')} value={state} onChangeText={setState} placeholder={t('properties.state')} />
        <Input label={t('properties.zip')} value={zip} onChangeText={setZip} placeholder={t('properties.zip')} keyboardType="number-pad" />
        <Input label={t('properties.totalSize')} value={size} onChangeText={setSize} placeholder="sqm" keyboardType="decimal-pad" />
        <Input
          label={t('properties.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('properties.description')}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        {/* Units Section */}
        <View style={styles.unitsSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('properties.units')} ({unitEntries.length})
          </Text>
          <TouchableOpacity style={[styles.addUnitBtn, { backgroundColor: colors.primary }]} onPress={addUnitEntry}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addUnitText}>Add Unit</Text>
          </TouchableOpacity>
        </View>

        {unitEntries.map((unit, index) => (
          <Card key={index} style={[styles.unitCard, { borderColor: colors.border }]}>
            <View style={styles.unitHeader}>
              <Text style={[styles.unitLabel, { color: colors.text }]}>Unit {index + 1}</Text>
              {unitEntries.length > 1 && (
                <TouchableOpacity onPress={() => removeUnitEntry(index)}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            <Input
              label="Unit Name *"
              value={unit.name}
              onChangeText={(v) => updateUnitEntry(index, 'name', v)}
              placeholder="e.g. Unit 101, Apt A"
            />
            <View style={styles.unitRow}>
              <View style={styles.unitField}>
                <Input
                  label="Floor"
                  value={unit.floor}
                  onChangeText={(v) => updateUnitEntry(index, 'floor', v)}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.unitField}>
                <Input
                  label="Size (sqm)"
                  value={unit.size}
                  onChangeText={(v) => updateUnitEntry(index, 'size', v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.unitField}>
                <Input
                  label="Rent (KWD)"
                  value={unit.rent_amount}
                  onChangeText={(v) => updateUnitEntry(index, 'rent_amount', v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </Card>
        ))}

        <Button title={t('properties.addProperty')} onPress={handleSubmit} loading={loading} />

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
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  unitsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  addUnitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addUnitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  unitCard: { marginBottom: 12, borderWidth: 1 },
  unitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitLabel: { fontSize: 15, fontWeight: '600' },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitField: { flex: 1 },
  spacer: { height: 40 },
})
