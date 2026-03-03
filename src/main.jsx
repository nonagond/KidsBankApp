import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

// Register service worker with periodic update checks
// Critical for iOS standalone PWAs which don't auto-check for SW updates
const updateSW = registerSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update()
      }, 60 * 1000)
    }
  },
  onNeedRefresh() {
    // Auto-apply update and reload
    updateSW(true)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
