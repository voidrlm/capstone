import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Tooltip,
  Chip,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu, Bell, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

interface TopBarProps {
  userName: string;
  role: string;
  onMenuClick: () => void;
  onLogout: () => void;
  sidebarWidth: number;
}

const titleMap: Record<string, string> = {
  "/dashboard/patient": "Patient Dashboard",
  "/dashboard/provider": "Provider Dashboard",
  "/drugs": "Drug Search",
  "/patients": "Patient Workspace",
  "/patient/medications": "My Medications",
  "/patient/records": "My Records",
  "/provider/analytics": "Analytics",
  "/provider/organization": "Organization",
  "/settings": "Settings",
};

function getRoleLabel(role: string) {
  if (role === "patient") return "Patient Portal";
  if (role === "org_admin") return "Organization Admin";
  if (role === "provider") return "Healthcare Provider";
  return "Workspace";
}

export default function TopBar({
  userName,
  role,
  onMenuClick,
  sidebarWidth: _sidebarWidth,
}: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const roleLabel = getRoleLabel(role);
  const pageTitle = titleMap[location.pathname] || "MediRisk";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(10px)",
        color: "text.primary",
        borderBottom: "1px solid rgba(148,163,184,0.18)",
        width: "100%",
        left: "auto",
        right: "auto",
        boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 84, px: { xs: 2, sm: 3 } }}>
        {isMobile && (
          <IconButton
            onClick={onMenuClick}
            edge="start"
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(148,163,184,0.2)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
            }}
          >
            <Menu size={22} />
          </IconButton>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              mb: 0.4,
            }}
          >
            {pageTitle}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              icon={<Sparkles size={14} />}
              label={roleLabel}
              sx={{
                bgcolor: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 700,
                borderRadius: 999,
              }}
            />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          {!isMobile ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 1.35,
                py: 0.7,
                borderRadius: 4,
                bgcolor: "#f8fafc",
                border: "1px solid rgba(148,163,184,0.18)",
                minWidth: 220,
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "#dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {(userName || "MR").split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {userName || "MediRisk User"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {roleLabel}
                </Typography>
              </Box>
            </Box>
          ) : null}

          <Tooltip title="Notifications">
            <IconButton
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid rgba(148,163,184,0.18)",
                boxShadow: "0 8px 18px rgba(15,23,42,0.05)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <Badge
                badgeContent={3}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.65rem",
                    height: 18,
                    minWidth: 18,
                  },
                }}
              >
                <Bell size={18} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
