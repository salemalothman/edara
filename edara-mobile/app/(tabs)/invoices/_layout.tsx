import { Stack } from 'expo-router'
import { useTheme } from '../../../contexts/theme-context'
import { useLanguage } from '../../../contexts/language-context'

export default function InvoicesLayout() {
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
      <Stack.Screen name="index" options={{ title: t('navigation.invoices') }} />
      <Stack.Screen name="[id]" options={{ title: t('invoices.invoiceDetails') }} />
      <Stack.Screen name="add" options={{ title: t('invoices.createInvoice'), presentation: 'modal' }} />
    </Stack>
  )
}
