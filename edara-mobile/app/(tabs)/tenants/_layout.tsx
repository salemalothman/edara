import { Stack } from 'expo-router'
import { useTheme } from '../../../contexts/theme-context'
import { useLanguage } from '../../../contexts/language-context'

export default function TenantsLayout() {
  const { colors } = useTheme()
  const { t } = useLanguage()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: t('navigation.tenants') }} />
      <Stack.Screen name="[id]" options={{ title: t('tenants.tenantDetails') }} />
      <Stack.Screen name="add" options={{ title: t('tenants.addTenant'), presentation: 'modal' }} />
    </Stack>
  )
}
