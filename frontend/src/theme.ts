import { createTheme } from "@mui/material/styles"
import type { PaletteMode } from "@mui/material"

export function createMuiTheme(mode: PaletteMode) {
  const isDark = mode === "dark"

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#00d4aa",
        light: "#33ddbb",
        dark: "#00a888",
        contrastText: isDark ? "#04080f" : "#ffffff",
      },
      secondary: {
        main: isDark ? "rgba(0,212,170,0.15)" : "#e0fdf4",
        contrastText: isDark ? "#dce8ff" : "#0f172a",
      },
      error: {
        main: "#dc2626",
        light: isDark ? "#7f1d1d" : "#fecaca",
      },
      warning: {
        main: "#d97706",
        light: isDark ? "#78350f" : "#fde68a",
      },
      info: {
        main: "#0284c7",
        light: isDark ? "#075985" : "#bae6fd",
      },
      success: {
        main: "#16a34a",
        light: isDark ? "#14532d" : "#bbf7d0",
      },
      background: {
        default: isDark ? "#0a1628" : "#f1f5f9",
        paper: isDark ? "#0d1d34" : "#ffffff",
      },
      text: {
        primary: isDark ? "#dce8ff" : "#0f172a",
        secondary: isDark ? "rgba(220,232,255,0.6)" : "#64748b",
        disabled: isDark ? "rgba(220,232,255,0.28)" : "#94a3b8",
      },
      divider: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
      action: {
        hover: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        selected: isDark ? "rgba(0,212,170,0.1)" : "rgba(0,212,170,0.08)",
      },
    },
    typography: {
      fontFamily: '"DM Sans", "Inter", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: "2.5rem",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        "@media (min-width:900px)": { fontSize: "3.5rem" },
      },
      h2: {
        fontWeight: 700,
        fontSize: "2rem",
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
        "@media (min-width:900px)": { fontSize: "2.5rem" },
      },
      h3: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.4, letterSpacing: "-0.01em" },
      h4: { fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.01em" },
      h5: { fontWeight: 700, fontSize: "1.125rem" },
      h6: { fontWeight: 600, fontSize: "1rem" },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
      button: { textTransform: "none", fontWeight: 600 },
      caption: { fontSize: "0.75rem", lineHeight: 1.4 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "10px 24px",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          contained: {
            "&:hover": { boxShadow: "0 4px 14px rgba(0,212,170,0.25)" },
          },
          sizeLarge: { padding: "14px 32px", fontSize: "1rem" },
          sizeSmall: { padding: "6px 16px", fontSize: "0.8125rem" },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)"
              : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
            border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e2e8f0",
            backgroundImage: "none",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              "& fieldset": {
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0",
              },
              "&:hover fieldset": {
                borderColor: isDark ? "rgba(0,212,170,0.45)" : "#cbd5e1",
              },
              "&.Mui-focused fieldset": { borderColor: "#00d4aa" },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
      },
      MuiAppBar: {
        styleOverrides: { root: { boxShadow: "none" } },
      },
      MuiDrawer: {
        styleOverrides: { paper: { borderRight: "none" } },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-root": {
              backgroundColor: isDark ? "#060f1f" : "#f8fafc",
              fontWeight: 600,
              color: isDark ? "rgba(220,232,255,0.5)" : "#475569",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f1f5f9",
            padding: "14px 16px",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.03) !important"
                : "#f8fafc !important",
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
    },
  })
}

export default createMuiTheme("light")
