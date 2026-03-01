import { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useLanguage } from '../../../contexts/language-context'
import { useTheme } from '../../../contexts/theme-context'
import { insertTenant } from '../../../lib/services/tenants'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export default function AddTenantScreen() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [loading, setLoading] = useState(false)

  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'Please fill in the required fields')
      return
    }

    setLoading(true)
    try {
      await insertTenant({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        rent: rent ? parseFloat(rent) : null,
        deposit: deposit ? parseFloat(deposit) : null,
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
        <Input label={`${t('tenants.firstName')} *`} value={firstName} onChangeText={setFirstName} placeholder={t('tenants.firstName')} />
        <Input label={`${t('tenants.lastName')} *`} value={lastName} onChangeText={setLastName} placeholder={t('tenants.lastName')} />
        <Input label={`${t('tenants.email')} *`} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label={t('tenants.phone')} value={phone} onChangeText={setPhone} placeholder="+965 XXXX XXXX" keyboardType="phone-pad" />
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
  spacer: { height: 40 },
})
