import { MotionGlobalConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { installTouchGuards } from './device'

installTouchGuards(document.getElementById('root'))

// dev-хук для автотестов: ?noanim отключает анимации motion (переходы срабатывают мгновенно)
if (import.meta.env.DEV && new URLSearchParams(location.search).has('noanim')) {
  MotionGlobalConfig.skipAnimations = true
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
