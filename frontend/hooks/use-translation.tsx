"use client"

import { useTranslation as useBaseTranslation } from '@/contexts/translation-context'
import { Locale } from '@/locales'

export function useTranslation() {
  const { locale, setLocale, t, isLoading } = useBaseTranslation()

  // Helper function for conditional translations based on locale
  const tConditional = (frKey: string, enKey: string, params?: Record<string, string | number>) => {
    return locale === 'fr' ? t(frKey, params) : t(enKey, params)
  }

  // Helper function for pluralization
  const tPlural = (key: string, count: number, params?: Record<string, string | number>) => {
    const pluralKey = count === 1 ? `${key}_singular` : `${key}_plural`
    return t(pluralKey, { count, ...params })
  }

  // Helper function to get current locale info
  const getLocaleInfo = () => ({
    locale,
    language: locale === 'fr' ? 'Français' : 'English',
    direction: 'ltr', // Both French and English are left-to-right
    flag: locale === 'fr' ? '🇫🇷' : '🇺🇸',
  })

  // Helper function to check if locale is available
  const isLocaleSupported = (testLocale: string): testLocale is Locale => {
    return testLocale === 'fr' || testLocale === 'en'
  }

  // Helper function to toggle between locales
  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr')
  }

  // Helper function for formatted dates based on locale
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      ...defaultOptions,
      ...options,
    }).format(date)
  }

  // Helper function for formatted numbers based on locale
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', options).format(number)
  }

  // Helper function for currency formatting
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  // Helper function to get arrays from translations
  const tArray = (key: string): string[] => {
    const keys = key.split('.')
    let value: any = locale === 'fr' ? 
      require('@/locales/fr.json') : 
      require('@/locales/en.json')

    for (const k of keys) {
      value = value?.[k]
    }

    if (Array.isArray(value)) {
      return value
    }

    console.warn(`Translation array missing for key: ${key}`)
    return []
  }

  return {
    // Core translation functions
    t,
    tArray,
    locale,
    setLocale,
    isLoading,
    
    // Helper functions
    tConditional,
    tPlural,
    getLocaleInfo,
    isLocaleSupported,
    toggleLocale,
    
    // Formatting functions
    formatDate,
    formatNumber,
    formatCurrency,
  }
}