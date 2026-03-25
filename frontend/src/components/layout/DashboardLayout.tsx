import { useState } from "react";
import { Box, LinearProgress, useMediaQuery, useTheme } from "@mui/material";
import Sidebar, { EXPANDED_WIDTH, COLLAPSED_WIDTH } from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function DashboardLayout({
  children,
  requiredRole,
}: DashboardLayoutProps) {
  const { user, loading, logout } = useAuth(requiredRole);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (loading || !user) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <LinearProgress />
      </Box>
    );
  }

  const sidebarWidth = isMobile ? 0 : collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(191,219,254,0.45), transparent 22%), radial-gradient(circle at bottom right, rgba(224,242,254,0.55), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
      }}
    >
      <Sidebar
        role={user.role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={logout}
      />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar
          userName={user.name}
          role={user.role}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={logout}
          sidebarWidth={sidebarWidth}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1440,
            width: "100%",
            mx: "auto",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: { xs: 16, sm: 24, md: 32 },
              top: { xs: 12, sm: 18, md: 20 },
              borderRadius: 8,
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.55)",
              pointerEvents: "none",
            }}
          />
          <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
