import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Nuke any previously registered service worker and cached files.
// This runs first, before anything else, so stale PWA caches from
// earlier testing can never block a fresh deploy again.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister())
  })
}
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name))
  })
}

window.addEventListener('error', (e) => {
  document.body.innerHTML = '<div style="padding:20px;font-family:monospace;color:red;white-space:pre-wrap;">CRASH: ' + e.message + '\n' + (e.error?.stack || '') + '</div>'
})
window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = '<div style="padding:20px;font-family:monospace;color:red;white-space:pre-wrap;">PROMISE REJECTION: ' + (e.reason?.message || e.reason) + '</div>'
})

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  document.body.innerHTML = '<div style="padding:20px;font-family:monospace;color:red;white-space:pre-wrap;">STARTUP CRASH: ' + err.message + '\n' + (err.stack || '') + '</div>'
}
