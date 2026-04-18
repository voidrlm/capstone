import { useMemo, type ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { createMuiTheme } from '../theme'

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const muiTheme = useMemo(() => createMuiTheme('light'), [])

  return (
    <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
  )
}
