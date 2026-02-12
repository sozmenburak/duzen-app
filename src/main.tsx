import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA: Geliştirme modunda service worker kaydı (build'de plugin enjekte ediyor)
if ('serviceWorker' in navigator) {
  const isDev = import.meta.env.DEV
  navigator.serviceWorker.register(
    isDev ? '/dev-sw.js?dev-sw' : '/sw.js',
    { type: isDev ? 'module' : 'classic' }
  ).catch(() => {})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
