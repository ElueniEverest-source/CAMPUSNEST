import { useState, useEffect } from 'react'

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button onClick={() => setDark(d => !d)}>
      {dark ? '☀️ Light mode' : '🌙 Dark mode'}
    </button>
  )
}
