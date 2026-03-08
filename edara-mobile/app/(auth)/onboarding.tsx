import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { useOrganization } from '../../contexts/organization-context'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/ui/Logo'

export default function OnboardingScreen() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [orgName, setOrgName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { t } = useLanguage()
  const { colors } = useTheme()
  const { refetchOrg } = useOrganization()
  const router = useRouter()

  const handleCreateOrg = async () => {
    setError('')
    setLoading(true)

    const { data, error: rpcError } = await supabase.rpc('create_org_and_join', {
      org_name: orgName,
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }

    await refetchOrg()
    setLoading(false)
  }

  const handleJoinOrg = async () => {
    setError('')
    setLoading(true)

    const { error: rpcError } = await supabase.rpc('accept_invitation', {
      invitation_token: inviteCode,
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }

    await refetchOrg()
    setLoading(false)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('onboarding.subtitle')}
            </Text>
          </View>

          {mode === 'choose' && (
            <View style={styles.choiceContainer}>
              <TouchableOpacity
                style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setMode('create')}
              >
                <Text style={[styles.choiceTitle, { color: colors.text }]}>{t('onboarding.createOrg')}</Text>
                <Text style={[styles.choiceDesc, { color: colors.textSecondary }]}>{t('onboarding.createOrgDesc')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setMode('join')}
              >
                <Text style={[styles.choiceTitle, { color: colors.text }]}>{t('onboarding.joinOrg')}</Text>
                <Text style={[styles.choiceDesc, { color: colors.textSecondary }]}>{t('onboarding.joinOrgDesc')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'create' && (
            <View>
              <Input
                label={t('onboarding.propertyManagerName')}
                value={orgName}
                onChangeText={setOrgName}
                placeholder={t('onboarding.orgNamePlaceholder')}
              />

              {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

              <Button title={t('onboarding.createOrg')} onPress={handleCreateOrg} loading={loading} />

              <TouchableOpacity style={styles.backLink} onPress={() => { setMode('choose'); setError('') }}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'join' && (
            <View>
              <Input
                label={t('onboarding.inviteCode')}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t('onboarding.inviteCodePlaceholder')}
              />

              {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

              <Button title={t('onboarding.joinOrg')} onPress={handleJoinOrg} loading={loading} />

              <TouchableOpacity style={styles.backLink} onPress={() => { setMode('choose'); setError('') }}>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          )}
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
  subtitle: { fontSize: 16, marginTop: 8, textAlign: 'center' },
  choiceContainer: { gap: 16 },
  choiceCard: { padding: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 8 },
  choiceTitle: { fontSize: 18, fontWeight: '700' },
  choiceDesc: { fontSize: 13, textAlign: 'center' },
  error: { fontSize: 14, marginVertical: 12, textAlign: 'center' },
  backLink: { marginTop: 16, alignItems: 'center' },
})
