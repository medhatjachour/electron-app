import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

console.log('[Renderer] main.tsx loaded')
console.log('[Renderer] window.api available:', !!window.api)
console.log('[Renderer] document readyState:', document.readyState)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)

console.log('[Renderer] React app rendered')
