import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (e) => {
  document.body.innerHTML = '<div style="padding:20px;font-family:monospace;color:red;white-space:pre-wrap;">CRASH: ' + e.message + '\n' + (e.error?.stack || '') + '</div>'
})
window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = '<div style="padding:20px;font-family:monospace;color:red;white-space:pre-wrap;">PROMISE REJECTION: ' + (e.reason?.message || e.reason) + '</div>'
})

try {
  registerSW({ immediate: true })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  document.body.innerHTML = '<div style="padding:20px;font-family:monospace;color:red;white-space:pre-wrap;">STARTUP CRASH: ' + err.message + '\n' + (err.stack || '') + '</div>'
}
