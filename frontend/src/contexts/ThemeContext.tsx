import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'
import { createMuiTheme } from '../theme'

interface ThemeCtxValue {
  mode: PaletteMode
  toggleMode: () => void
}

const ThemeCtx = createContext<ThemeCtxValue>({ mode: 'dark', toggleMode: () => {} })

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() =>
    (localStorage.getItem('mr-theme') as PaletteMode) || 'dark',
  )

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.classList.toggle('light', mode === 'light')
    localStorage.setItem('mr-theme', mode)
  }, [mode])

  const toggleMode = () => setMode(m => (m === 'dark' ? 'light' : 'dark'))
  const muiTheme = useMemo(() => createMuiTheme(mode), [mode])

  return (
    <ThemeCtx.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeCtx.Provider>
  )
}

export const useThemeMode = () => useContext(ThemeCtx)
