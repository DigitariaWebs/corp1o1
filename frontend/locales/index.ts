import fr from './fr.json'
import en from './en.json'

export type Locale = 'fr' | 'en'

export type TranslationKey = keyof typeof fr

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)]

export type TranslationPath = NestedKeyOf<typeof fr>

export const locales: Record<Locale, typeof fr> = {
  fr,
  en,
}

export const defaultLocale: Locale = 'fr'

export const supportedLocales: Locale[] = ['fr', 'en']

export { fr, en }
