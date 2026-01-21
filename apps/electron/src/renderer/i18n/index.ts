import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { UI_I18N_NAMESPACE, uiI18nResources, type UiLanguage } from '@craft-agent/ui/i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const ELECTRON_I18N_NAMESPACE = 'electron' as const
export type ElectronI18nNamespace = typeof ELECTRON_I18N_NAMESPACE

export type ElectronLanguage = UiLanguage

export const electronI18n = i18next.createInstance()

const resources = {
  en: {
    ...uiI18nResources.en,
    [ELECTRON_I18N_NAMESPACE]: en,
  },
  'zh-CN': {
    ...uiI18nResources['zh-CN'],
    [ELECTRON_I18N_NAMESPACE]: zhCN,
  },
} as const

void electronI18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  ns: [UI_I18N_NAMESPACE, ELECTRON_I18N_NAMESPACE],
  defaultNS: ELECTRON_I18N_NAMESPACE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export function normalizeLanguage(value: unknown): ElectronLanguage | null {
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

export function inferLanguageFromEnvironment(): ElectronLanguage {
  const navLang = typeof navigator !== 'undefined' ? navigator.language : ''
  const lower = navLang.toLowerCase()
  if (lower.startsWith('zh')) return 'zh-CN'
  return 'en'
}

export async function syncLanguageFromPreferences(): Promise<void> {
  const result = await window.electronAPI.readPreferences()
  try {
    const prefs = JSON.parse(result.content) as { language?: unknown }
    const normalized = normalizeLanguage(prefs.language)
    if (normalized) {
      await electronI18n.changeLanguage(normalized)
      return
    }
  } catch {}

  await electronI18n.changeLanguage(inferLanguageFromEnvironment())
}

export function startPreferencesLanguageSync(): () => void {
  void syncLanguageFromPreferences()
  return window.electronAPI.onPreferencesChanged((prefs) => {
    const normalized = normalizeLanguage(prefs.language)
    if (normalized) {
      void electronI18n.changeLanguage(normalized)
    }
  })
}
