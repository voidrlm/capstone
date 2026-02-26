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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
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
            p: { xs: 2, sm: 3 },
            maxWidth: 1400,
            width: "100%",
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
