import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import { viewerI18n } from './i18n'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')

createRoot(container).render(
  <React.StrictMode>
    <I18nextProvider i18n={viewerI18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
)
