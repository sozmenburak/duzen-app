import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App.tsx'

// PWA: Dev'de SW kapalı (konsol hatası önlenir). Production'da vite-plugin-pwa registerSW enjekte eder.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
