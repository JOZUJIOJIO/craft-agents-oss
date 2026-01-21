import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const UI_I18N_NAMESPACE = 'ui' as const
export type UiI18nNamespace = typeof UI_I18N_NAMESPACE

export type UiLanguage = 'en' | 'zh-CN'

export const UI_SUPPORTED_LANGUAGES: ReadonlyArray<UiLanguage> = ['en', 'zh-CN']

export const uiI18nResources = {
  en: { [UI_I18N_NAMESPACE]: en },
  'zh-CN': { [UI_I18N_NAMESPACE]: zhCN },
} as const

