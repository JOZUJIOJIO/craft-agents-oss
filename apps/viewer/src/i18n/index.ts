import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { UI_I18N_NAMESPACE, uiI18nResources, type UiLanguage } from '@craft-agent/ui/i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const VIEWER_I18N_NAMESPACE = 'viewer' as const
export type ViewerI18nNamespace = typeof VIEWER_I18N_NAMESPACE

export type ViewerLanguage = UiLanguage

export const viewerI18n = i18next.createInstance()

const STORAGE_KEY = 'craft-language'

const resources = {
  en: {
    ...uiI18nResources.en,
    [VIEWER_I18N_NAMESPACE]: en,
  },
  'zh-CN': {
    ...uiI18nResources['zh-CN'],
    [VIEWER_I18N_NAMESPACE]: zhCN,
  },
} as const

void viewerI18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: [UI_I18N_NAMESPACE, VIEWER_I18N_NAMESPACE],
  defaultNS: VIEWER_I18N_NAMESPACE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export function normalizeLanguage(value: unknown): ViewerLanguage | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (lower === 'en' || lower.startsWith('en-') || lower.includes('english')) return 'en'
  if (lower === 'zh' || lower.startsWith('zh-') || lower.startsWith('zh_') || lower.includes('chinese') || trimmed.includes('中文')) {
    return 'zh-CN'
  }
  return null
}

export function inferLanguageFromEnvironment(): ViewerLanguage {
  const navLang = typeof navigator !== 'undefined' ? navigator.language : ''
  const lower = navLang.toLowerCase()
  if (lower.startsWith('zh')) return 'zh-CN'
  return 'en'
}

export function getStoredLanguage(): ViewerLanguage | null {
  if (typeof localStorage === 'undefined') return null
  return normalizeLanguage(localStorage.getItem(STORAGE_KEY))
}

export function getInitialLanguage(): ViewerLanguage {
  return getStoredLanguage() ?? inferLanguageFromEnvironment()
}

export async function setLanguage(language: ViewerLanguage): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, language)
  }
  await viewerI18n.changeLanguage(language)
}

export async function toggleLanguage(): Promise<ViewerLanguage> {
  const current = normalizeLanguage(viewerI18n.language) ?? 'en'
  const next: ViewerLanguage = current === 'en' ? 'zh-CN' : 'en'
  await setLanguage(next)
  return next
}
