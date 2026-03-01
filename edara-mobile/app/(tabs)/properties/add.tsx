import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertProperty, uploadPropertyImage } from '../../../lib/services/properties'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export default function AddPropertyScreen() {
  const [name, setName] = useState('')
  const [type, setType] = useState('residential')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [units, setUnits] = useState('')
  const [size, setSize] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!name || !address || !city || !units) {
      Alert.alert('Error', 'Please fill in the required fields')
      return
    }

    setLoading(true)
    try {
      await insertProperty({
        name,
        type,
        address,
        city,
        state,
        zip,
        units: parseInt(units),
        size: size ? parseFloat(size) : null,
        description: description || null,
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
        <Input label={`${t('properties.numberOfUnits')} *`} value={units} onChangeText={setUnits} placeholder="0" keyboardType="number-pad" />
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
  spacer: { height: 40 },
})
