"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define available languages
export type Language = "en" | "ar"

// Define the context type
type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Import translations
import enTranslations from "@/translations/en.json"
import arTranslations from "@/translations/ar.json"

// Translation map
const translations = {
  en: enTranslations,
  ar: arTranslations,
}

// Language provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with saved language or default to English
  const [language, setLanguageState] = useState<Language>("en")

  // Set direction based on language
  const dir = language === "ar" ? "rtl" : "ltr"

  // Effect to load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Function to set language and save preference
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem("language", newLanguage)

    // Update HTML dir attribute
    document.documentElement.dir = newLanguage === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = newLanguage
  }

  // Translation function
  const t = (key: string): string => {
    const keys = key.split(".")
    let result: any = translations[language]

    for (const k of keys) {
      if (result && result[k]) {
        result = result[k]
      } else {
        // Fallback to key if translation not found
        return key
      }
    }

    return result
  }

  // Set initial HTML direction
  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [dir, language])

  return <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>{children}</LanguageContext.Provider>
}

// Hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
