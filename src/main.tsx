import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA: Sadece geliştirme modunda SW kaydı (production'da plugin registerSW.js enjekte ediyor)
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.register('/dev-sw.js?dev-sw', { type: 'module' }).catch(() => {})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
