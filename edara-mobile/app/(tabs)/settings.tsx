import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Globe, Moon, Sun, Monitor, LogOut, ChevronRight } from 'lucide-react-native'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'
import { useAuth } from '../../contexts/auth-context'
import { Card } from '../../components/ui/Card'

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage()
  const { themeMode, setThemeMode, colors } = useTheme()
  const { user, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert(t('common.signOut'), t('common.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.signOut'), style: 'destructive', onPress: signOut },
    ])
  }

  const handleLanguageChange = () => {
    const newLang = language === 'en' ? 'ar' : 'en'
    setLanguage(newLang)
    Alert.alert(
      'Language Changed',
      'The app may need to restart for RTL changes to take full effect.',
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('common.settings')}</Text>

        {/* Account */}
        {user && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email || user.phone}</Text>
          </Card>
        )}

        {/* Language */}
        <Card style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
            <Globe size={20} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('common.language')}</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {language === 'en' ? 'English' : 'العربية'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Theme */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.theme')}</Text>
          {[
            { mode: 'light' as const, icon: Sun, label: 'Light' },
            { mode: 'dark' as const, icon: Moon, label: 'Dark' },
            { mode: 'system' as const, icon: Monitor, label: 'System' },
          ].map(({ mode, icon: Icon, label }) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.themeOption,
                themeMode === mode && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setThemeMode(mode)}
            >
              <Icon size={18} color={themeMode === mode ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeLabel, { color: themeMode === mode ? colors.primary : colors.text }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign Out */}
        <Card style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
            <LogOut size={20} color={colors.danger} />
            <Text style={[styles.signOutText, { color: colors.danger }]}>{t('common.signOut')}</Text>
          </TouchableOpacity>
        </Card>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>Edara v1.0.0</Text>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  screenTitle: { fontSize: 28, fontWeight: '800', marginVertical: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  email: { fontSize: 15 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '500' },
  settingValue: { fontSize: 13, marginTop: 2 },
  themeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  themeLabel: { fontSize: 15, fontWeight: '500' },
  signOutText: { fontSize: 16, fontWeight: '600' },
  version: { fontSize: 13, textAlign: 'center', marginTop: 24 },
  spacer: { height: 40 },
})
