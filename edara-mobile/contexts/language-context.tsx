import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { I18nManager } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Language = 'en' | 'ar'

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

import enTranslations from '../translations/en.json'
import arTranslations from '../translations/ar.json'

const translations: Record<Language, any> = {
  en: enTranslations,
  ar: arTranslations,
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  const dir = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    AsyncStorage.getItem('language').then((saved) => {
      if (saved === 'en' || saved === 'ar') {
        setLanguageState(saved)
        const isRTL = saved === 'ar'
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL)
          I18nManager.allowRTL(isRTL)
        }
      }
    })
  }, [])

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage)
    await AsyncStorage.setItem('language', newLanguage)

    const isRTL = newLanguage === 'ar'
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL)
      I18nManager.allowRTL(isRTL)
      // Note: RTL change requires app restart to take full effect
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let result: any = translations[language]
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k]
      } else {
        return key
      }
    }
    return result
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
