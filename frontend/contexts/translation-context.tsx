"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, supportedLocales, locales } from '@/locales'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function TranslationProvider({ children, defaultLocale: providedDefaultLocale }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(providedDefaultLocale || defaultLocale)
  const [isLoading, setIsLoading] = useState(true)

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('corp1o1-locale') as Locale
    if (savedLocale && supportedLocales.includes(savedLocale)) {
      setLocaleState(savedLocale)
    }
    setIsLoading(false)
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale)
      localStorage.setItem('corp1o1-locale', newLocale)
      
      // Update document language attribute
      document.documentElement.lang = newLocale
    }
  }

  // Translation function with parameter interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = locales[locale]

    // Navigate through nested object
    for (const k of keys) {
      value = value?.[k]
    }

    // If translation not found, try fallback locale
    if (value === undefined) {
      let fallbackValue: any = locales[defaultLocale]
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k]
      }
      value = fallbackValue
    }

    // If still not found, return the key as fallback
    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key}`)
      return key
    }

    // Replace parameters in the string
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match
      })
    }

    return value
  }

  const contextValue: TranslationContextType = {
    locale,
    setLocale,
    t,
    isLoading,
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export { TranslationContext }
