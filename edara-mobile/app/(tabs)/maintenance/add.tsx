import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, ChevronDown, Check } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { usePermissions } from '../../../hooks/use-permissions'
import { insertMaintenanceRequest, uploadMaintenanceImage } from '../../../lib/services/maintenance'
import { fetchProperties } from '../../../lib/services/properties'
import { fetchUnitsByProperty } from '../../../lib/services/units'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'

export default function AddMaintenanceScreen() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('plumbing')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [contactPref, setContactPref] = useState('phone')
  const [cost, setCost] = useState('')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Property & Unit pickers
  const [properties, setProperties] = useState<any[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [showUnitPicker, setShowUnitPicker] = useState(false)

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

  const categories = ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other']
  const priorities = ['low', 'medium', 'high']

  useEffect(() => {
    fetchProperties().then(setProperties).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedPropertyId) {
      fetchUnitsByProperty(selectedPropertyId).then(setUnits).catch(console.error)
      setSelectedUnitId(null)
    } else {
      setUnits([])
      setSelectedUnitId(null)
    }
  }, [selectedPropertyId])

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const selectedUnit = units.find(u => u.id === selectedUnitId)

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      setImageUris(prev => [...prev, ...result.assets.map(a => a.uri)])
    }
  }

  const handleSubmit = async () => {
    if (!title || !selectedPropertyId || !selectedUnitId || !description) {
      Alert.alert(t('common.error'), t('maintenance.requiredFieldsError'))
      return
    }

    setLoading(true)
    try {
      const uploadedUrls: string[] = []
      for (const uri of imageUris) {
        const url = await uploadMaintenanceImage(uri, `photo_${Date.now()}.jpg`)
        uploadedUrls.push(url)
      }

      await insertMaintenanceRequest({
        title,
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        category,
        priority,
        description,
        contact_preference: contactPref,
        image_urls: uploadedUrls,
        cost: cost ? parseFloat(cost) : null,
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
        <Input label={`${t('maintenance.issueTitle')} *`} value={title} onChangeText={setTitle} placeholder={t('maintenance.issueTitlePlaceholder')} />

        {/* Property Picker */}
        <Text style={[styles.label, { color: colors.text }]}>{t('maintenance.property')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => { setShowPropertyPicker(!showPropertyPicker); setShowUnitPicker(false) }}
        >
          <Text style={[styles.pickerText, { color: selectedProperty ? colors.text : colors.textSecondary }]}>
            {selectedProperty ? selectedProperty.name : t('tenants.selectProperty')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showPropertyPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {properties.length === 0 && (
              <Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>{t('tenants.noProperties')}</Text>
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
        <Text style={[styles.label, { color: colors.text }]}>{t('maintenance.unit')} *</Text>
        <TouchableOpacity
          style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: selectedPropertyId ? 1 : 0.5 }]}
          onPress={() => {
            if (!selectedPropertyId) {
              Alert.alert('', t('tenants.selectPropertyFirst'))
              return
            }
            setShowUnitPicker(!showUnitPicker)
            setShowPropertyPicker(false)
          }}
        >
          <Text style={[styles.pickerText, { color: selectedUnit ? colors.text : colors.textSecondary }]}>
            {selectedUnit ? `${selectedUnit.name}${selectedUnit.floor != null ? ` (${t('properties.floor')} ${selectedUnit.floor})` : ''}` : t('tenants.selectUnit')}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {showUnitPicker && (
          <Card style={[styles.pickerList, { borderColor: colors.border }]}>
            {units.length === 0 && (
              <Text style={[styles.pickerEmpty, { color: colors.textSecondary }]}>
                {t('tenants.noUnits')}
              </Text>
            )}
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
                  <Text style={[styles.pickerItemSub, { color: colors.textSecondary }]}>
                    {unit.floor != null ? `${t('properties.floor')} ${unit.floor}` : ''}
                    {unit.size ? `${unit.floor != null ? ' · ' : ''}${unit.size} ${t('tenants.sqm')}` : ''}
                  </Text>
                </View>
                {selectedUnitId === unit.id && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <Text style={[styles.label, { color: colors.text }]}>{t('maintenance.category')}</Text>
        <View style={styles.chipRow}>
          {categories.map((c) => (
            <Button key={c} title={t(`maintenance.${c}`)} variant={category === c ? 'primary' : 'secondary'} onPress={() => setCategory(c)} style={styles.chip} />
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>{t('maintenance.priority')}</Text>
        <View style={styles.chipRow}>
          {priorities.map((p) => (
            <Button key={p} title={t(`maintenance.${p}`)} variant={priority === p ? 'primary' : 'secondary'} onPress={() => setPriority(p)} style={styles.chip} />
          ))}
        </View>

        <Input
          label={`${t('maintenance.description')} *`}
          value={description}
          onChangeText={setDescription}
          placeholder={t('maintenance.description')}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        <Input label={t('expenses.amount')} value={cost} onChangeText={setCost} placeholder="0.000" keyboardType="decimal-pad" />

        <Text style={[styles.label, { color: colors.text }]}>{t('maintenance.contactPreference')}</Text>
        <View style={styles.chipRow}>
          {['phone', 'email', 'sms'].map((c) => (
            <Button key={c} title={t(`maintenance.contactMethods.${c}`)} variant={contactPref === c ? 'primary' : 'secondary'} onPress={() => setContactPref(c)} style={styles.chip} />
          ))}
        </View>

        <Button
          title={t('maintenance.addPhotos')}
          variant="secondary"
          onPress={pickImages}
          icon={<Camera size={18} color={colors.text} />}
          style={styles.photoBtn}
        />
        {imageUris.length > 0 && (
          <Text style={[styles.photoCount, { color: colors.textSecondary }]}>{imageUris.length} {t('maintenance.photosSelected')}</Text>
        )}

        <Button title={t('maintenance.submitRequest')} onPress={handleSubmit} loading={loading} />
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
  pickerEmpty: { fontSize: 14, padding: 16, textAlign: 'center' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  pickerItemContent: { flex: 1 },
  pickerItemText: { fontSize: 15, fontWeight: '500' },
  pickerItemSub: { fontSize: 12, marginTop: 2 },
  photoBtn: { marginBottom: 8 },
  photoCount: { fontSize: 13, marginBottom: 16 },
  spacer: { height: 40 },
})
