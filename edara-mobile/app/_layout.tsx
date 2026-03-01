import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../contexts/auth-context'
import { LanguageProvider } from '../contexts/language-context'
import { ThemeProvider, useTheme } from '../contexts/theme-context'
import { useRouter, useSegments } from 'expo-router'

function RootLayoutNav() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const { colors, theme } = useTheme()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments])

  return (
    <>
      <StatusBar style={colors.statusBar} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}
