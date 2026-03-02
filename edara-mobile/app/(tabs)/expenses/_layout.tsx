import { Stack } from 'expo-router'
import { useTheme } from '../../../contexts/theme-context'
import { useLanguage } from '../../../contexts/language-context'

export default function ExpensesLayout() {
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
      <Stack.Screen name="index" options={{ title: t('navigation.expenses') }} />
      <Stack.Screen name="add" options={{ title: t('expenses.addExpense'), presentation: 'modal' }} />
    </Stack>
  )
}
