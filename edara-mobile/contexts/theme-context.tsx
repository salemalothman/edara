import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, type ThemeColors } from '../constants/colors'

type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: 'light' | 'dark'
  themeMode: ThemeMode
  colors: ThemeColors
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved)
      }
    })
  }, [])

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode)
    AsyncStorage.setItem('themeMode', mode)
  }

  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode
  const theme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light'
  const colors = Colors[theme]

  return (
    <ThemeContext.Provider value={{ theme, themeMode, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
