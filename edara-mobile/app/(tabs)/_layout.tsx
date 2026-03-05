import { Tabs } from 'expo-router'
import { Home, Building2, Users, FileText, Receipt, Wrench, DollarSign } from 'lucide-react-native'
import { useLanguage } from '../../contexts/language-context'
import { useTheme } from '../../contexts/theme-context'

export default function TabLayout() {
  const { t } = useLanguage()
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.dashboard'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: t('navigation.properties'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Building2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: t('navigation.tenants'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: t('navigation.invoices'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('navigation.expenses'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t('navigation.maintenance'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="financing"
        options={{
          title: t('navigation.financing'),
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          href: null, // Hidden — contracts are accessed via Tenants tab
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar, accessible via navigation
        }}
      />
    </Tabs>
  )
}
