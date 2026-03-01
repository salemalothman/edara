import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth-context'
import { useTheme } from '../../contexts/theme-context'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function SignupScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const { colors } = useTheme()
  const router = useRouter()

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const result = await signUp(email, password, fullName)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <Text style={[styles.logo, { color: colors.primary }]}>Edara</Text>
          <Text style={[styles.successTitle, { color: colors.text }]}>Account Created!</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            Check your email for a confirmation link, then sign in.
          </Text>
          <Button title="Go to Login" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.primary }]}>Edara</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create your account</Text>
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />

          <Button title="Create Account" onPress={handleSignUp} loading={loading} />

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800' },
  subtitle: { fontSize: 16, marginTop: 4 },
  error: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 14 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', marginTop: 24 },
  successText: { fontSize: 16, textAlign: 'center', marginVertical: 16 },
})
