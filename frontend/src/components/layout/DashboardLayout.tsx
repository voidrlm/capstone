import { useCallback, useState } from "react";
import { Box, LinearProgress } from "@mui/material";
import TopBar from "./TopBar";
import { useAuth } from "../../hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, loading } = useAuth(requiredRole);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileOpen = useCallback(() => setMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  if (loading || !user) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: "#00d4aa" } }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <TopBar
        userName={user.name}
        role={user.role}
        mobileOpen={mobileOpen}
        onMobileOpen={handleMobileOpen}
        onMobileClose={handleMobileClose}
      />
      <Box
        component="main"
        sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1440, width: "100%", mx: "auto" }}
      >
        {children}
      </Box>
    </Box>
  );
}
