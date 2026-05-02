import { createElement, createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ defaultTheme = 'light', children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('evento_theme')
    const t = saved || defaultTheme
    document.documentElement.className = t
    return t
  })

  useEffect(() => {
    document.documentElement.className = theme
    localStorage.setItem('evento_theme', theme)
  }, [theme])

  const toggleTheme = () => setThemeState(t => (t === 'light' ? 'dark' : 'light'))
  const setTheme = (t) => setThemeState(t)

  return createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme, setTheme } },
    children,
  )
}

export const useTheme = () => useContext(ThemeContext)
