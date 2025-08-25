import { Locale, locales, defaultLocale } from '@/locales'

/**
 * Get translation for a key without React context (for use in utils, server-side, etc.)
 */
export function getTranslation(key: string, locale: Locale = defaultLocale, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: any = locales[locale]

  // Navigate through nested object
  for (const k of keys) {
    value = value?.[k]
  }

  // If translation not found, try fallback locale
  if (value === undefined && locale !== defaultLocale) {
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

/**
 * Check if a translation key exists
 */
export function hasTranslation(key: string, locale: Locale = defaultLocale): boolean {
  const keys = key.split('.')
  let value: any = locales[locale]

  for (const k of keys) {
    value = value?.[k]
  }

  return typeof value === 'string'
}

/**
 * Get all available translation keys for a given section
 */
export function getTranslationKeys(section: string, locale: Locale = defaultLocale): string[] {
  const sectionData = locales[locale][section as keyof typeof locales[typeof locale]]
  
  if (typeof sectionData !== 'object' || sectionData === null) {
    return []
  }

  return Object.keys(sectionData)
}

/**
 * Get browser locale preference
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale
  }

  const browserLang = navigator.language.split('-')[0].toLowerCase()
  
  if (browserLang === 'fr') return 'fr'
  if (browserLang === 'en') return 'en'
  
  return defaultLocale
}

/**
 * Format relative time based on locale
 */
export function formatRelativeTime(date: Date, locale: Locale = defaultLocale): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  const rtf = new Intl.RelativeTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    numeric: 'auto'
  })
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  } else if (diffInSeconds < 2629746) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week')
  } else if (diffInSeconds < 31556952) {
    return rtf.format(-Math.floor(diffInSeconds / 2629746), 'month')
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31556952), 'year')
  }
}

/**
 * Get localized skill level
 */
export function getSkillLevel(level: number, locale: Locale = defaultLocale): string {
  if (level >= 90) {
    return getTranslation('assessments.expert', locale)
  } else if (level >= 70) {
    return getTranslation('assessments.advanced', locale)
  } else if (level >= 50) {
    return getTranslation('assessments.intermediate', locale)
  } else {
    return getTranslation('assessments.beginner', locale)
  }
}

/**
 * Get localized priority level
 */
export function getPriorityLevel(priority: 'high' | 'medium' | 'low', locale: Locale = defaultLocale): string {
  return getTranslation(`dashboard.${priority}_priority`, locale)
}

/**
 * Interpolate parameters in a translation string
 */
export function interpolateParams(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
    return params[paramKey]?.toString() || match
  })
}

/**
 * Get localized file size
 */
export function formatFileSize(bytes: number, locale: Locale = defaultLocale): string {
  const sizes = locale === 'fr' 
    ? ['octets', 'Ko', 'Mo', 'Go', 'To']
    : ['bytes', 'KB', 'MB', 'GB', 'TB']
  
  if (bytes === 0) return `0 ${sizes[0]}`
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = parseFloat((bytes / Math.pow(1024, i)).toFixed(2))
  
  return `${size} ${sizes[i]}`
}

/**
 * Get array from translations safely
 */
export function getTranslationArray(key: string, locale: Locale = defaultLocale): string[] {
  const keys = key.split('.')
  let value: any = locales[locale]

  for (const k of keys) {
    value = value?.[k]
  }

  if (Array.isArray(value)) {
    return value
  }

  // Try fallback locale
  if (locale !== defaultLocale) {
    let fallbackValue: any = locales[defaultLocale]
    for (const k of keys) {
      fallbackValue = fallbackValue?.[k]
    }
    if (Array.isArray(fallbackValue)) {
      return fallbackValue
    }
  }

  console.warn(`Translation array missing for key: ${key}`)
  return []
}

/**
 * Validate translation completeness between locales
 */
export function validateTranslations(): { missing: string[], extra: string[] } {
  const frKeys = getAllKeys(locales.fr)
  const enKeys = getAllKeys(locales.en)
  
  const missing = frKeys.filter(key => !enKeys.includes(key))
  const extra = enKeys.filter(key => !frKeys.includes(key))
  
  return { missing, extra }
}

/**
 * Helper function to get all nested keys from an object
 */
function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = []
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  
  return keys
}