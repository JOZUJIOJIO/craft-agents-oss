import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider as JotaiProvider } from 'jotai'
import { I18nextProvider } from 'react-i18next'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from '@/components/ui/sonner'
import { electronI18n, startPreferencesLanguageSync } from './i18n'
import './index.css'

/**
 * Root component - always renders App
 * App.tsx handles window mode detection internally (main vs tab-content)
 */
function Root() {
  React.useEffect(() => {
    return startPreferencesLanguageSync()
  }, [])
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={electronI18n}>
      <JotaiProvider>
        <ThemeProvider>
          <Root />
          <Toaster />
        </ThemeProvider>
      </JotaiProvider>
    </I18nextProvider>
  </React.StrictMode>
)
