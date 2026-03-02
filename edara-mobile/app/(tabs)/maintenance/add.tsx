import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera } from 'lucide-react-native'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertMaintenanceRequest, uploadMaintenanceImage } from '../../../lib/services/maintenance'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export default function AddMaintenanceScreen() {
  const [title, setTitle] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [category, setCategory] = useState('plumbing')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [contactPref, setContactPref] = useState('phone')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const categories = ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other']
  const priorities = ['low', 'medium', 'high']

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
    if (!title || !propertyId || !unitId || !description) {
      Alert.alert(t('common.error'), t('maintenance.requiredFieldsError'))
      return
    }

    setLoading(true)
    try {
      // Upload images
      const uploadedUrls: string[] = []
      for (const uri of imageUris) {
        const url = await uploadMaintenanceImage(uri, `photo_${Date.now()}.jpg`)
        uploadedUrls.push(url)
      }

      await insertMaintenanceRequest({
        title,
        property_id: propertyId,
        unit_id: unitId,
        category,
        priority,
        description,
        contact_preference: contactPref,
        image_urls: uploadedUrls,
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
        <Input label={`${t('maintenance.property')} *`} value={propertyId} onChangeText={setPropertyId} placeholder={t('invoices.propertyId')} />
        <Input label={`${t('maintenance.unit')} *`} value={unitId} onChangeText={setUnitId} placeholder={t('invoices.unitId')} />

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
  photoBtn: { marginBottom: 8 },
  photoCount: { fontSize: 13, marginBottom: 16 },
  spacer: { height: 40 },
})
