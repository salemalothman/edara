import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/auth-context'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/ui/Logo'

export default function LoginScreen() {
  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signInWithOtp, verifyOtp } = useAuth()
  const { t } = useLanguage()
  const { colors } = useTheme()
  const router = useRouter()

  const handleEmailLogin = async () => {
    setLoading(true)
    setError('')
    const result = await signIn(email, password)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  const handleSendOtp = async () => {
    setLoading(true)
    setError('')
    const result = await signInWithOtp(phone)
    if (result.error) {
      setError(result.error)
    } else {
      setOtpSent(true)
    }
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    const result = await verifyOtp(phone, otp)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Property Management
            </Text>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === 'email' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => { setMode('email'); setError('') }}
            >
              <Text style={[styles.tabText, { color: mode === 'email' ? colors.primary : colors.textSecondary }]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'phone' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => { setMode('phone'); setError(''); setOtpSent(false) }}
            >
              <Text style={[styles.tabText, { color: mode === 'phone' ? colors.primary : colors.textSecondary }]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          {mode === 'email' ? (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
              />
              <Button title="Sign In" onPress={handleEmailLogin} loading={loading} />
            </>
          ) : (
            <>
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+965 XXXX XXXX"
                keyboardType="phone-pad"
              />
              {otpSent && (
                <Input
                  label="Verification Code"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              )}
              <Button
                title={otpSent ? 'Verify Code' : 'Send OTP'}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                loading={loading}
              />
            </>
          )}

          <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign Up</Text>
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
  subtitle: { fontSize: 16, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginBottom: 24 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabText: { fontSize: 16, fontWeight: '600' },
  error: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  signupLink: { marginTop: 24, alignItems: 'center' },
  signupText: { fontSize: 14 },
})
