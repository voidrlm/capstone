import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  LayoutDashboard,
  Pill,
  Activity,
  FileText,
  Users,
  Shield,
  TrendingUp,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
} from "lucide-react";
import Logo from "./Logo";

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

const SIDEBAR_BG = "#0f172a";
const SIDEBAR_TEXT = "rgba(255,255,255,0.7)";
const SIDEBAR_TEXT_ACTIVE = "#ffffff";
const SIDEBAR_HOVER = "rgba(255,255,255,0.06)";
const SIDEBAR_ACTIVE_BG = "rgba(37, 99, 235, 0.15)";
const SIDEBAR_ACTIVE_ACCENT = "#60a5fa";

interface SidebarProps {
  role: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
}

const patientNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/patient" },
  { label: "Drug Search", icon: Shield, path: "/drugs" },
  { label: "My Medications", icon: Pill, path: "/patient/medications" },
  { label: "Risk Assessments", icon: Activity, path: "/patient/assessments" },
  { label: "My Records", icon: FileText, path: "/patient/records" },
];

const providerNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/provider" },
  { label: "Patients", icon: Users, path: "/patients" },
  { label: "Drug Search", icon: Shield, path: "/drugs" },
  { label: "Assessments", icon: Activity, path: "/provider/assessments" },
  { label: "Analytics", icon: TrendingUp, path: "/provider/analytics" },
  { label: "Organization", icon: Building2, path: "/provider/organization" },
];

export default function Sidebar({
  role,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
  onLogout,
}: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navItems = role === "patient" ? patientNav : providerNav;
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: SIDEBAR_BG,
        color: SIDEBAR_TEXT,
      }}
    >
      {/* Logo + collapse */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1 : 2.5,
          py: 2.5,
          minHeight: 68,
        }}
      >
        {!collapsed && <Logo size="sm" variant="light" />}
        {!isMobile && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: SIDEBAR_TEXT,
              bgcolor: "rgba(255,255,255,0.06)",
              width: 28,
              height: 28,
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </IconButton>
        )}
      </Box>

      {/* User info */}
      {!collapsed && (
        <Box
          sx={{
            mx: 2,
            mb: 2,
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: SIDEBAR_ACTIVE_ACCENT,
                fontSize: 14,
              }}
            >
              {role === "patient" ? <User size={18} /> : <Stethoscope size={18} />}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="body2"
                fontWeight={600}
                color={SIDEBAR_TEXT_ACTIVE}
                noWrap
              >
                {user?.name || (role === "patient" ? "Patient" : "Provider")}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                {role === "patient" ? "Patient" : "Healthcare Provider"}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Section label */}
      {!collapsed && (
        <Typography
          variant="caption"
          sx={{
            px: 3,
            mb: 1,
            color: "rgba(255,255,255,0.3)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "0.65rem",
          }}
        >
          Navigation
        </Typography>
      )}

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1.5, py: 0.5 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = window.location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
              <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
                <ListItemButton
                  href={item.path}
                  sx={{
                    borderRadius: 2.5,
                    minHeight: 44,
                    px: collapsed ? 2 : 2,
                    justifyContent: collapsed ? "center" : "flex-start",
                    bgcolor: isActive ? SIDEBAR_ACTIVE_BG : "transparent",
                    color: isActive ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                    position: "relative",
                    "&:hover": {
                      bgcolor: isActive ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER,
                    },
                    "&::before": isActive
                      ? {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: 3,
                          borderRadius: "0 4px 4px 0",
                          bgcolor: SIDEBAR_ACTIVE_ACCENT,
                        }
                      : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 36,
                      color: isActive ? SIDEBAR_ACTIVE_ACCENT : SIDEBAR_TEXT,
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: isActive ? 600 : 400,
                        fontSize: "0.8125rem",
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom actions */}
      {!collapsed && (
        <Typography
          variant="caption"
          sx={{
            px: 3,
            mb: 1,
            color: "rgba(255,255,255,0.3)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "0.65rem",
          }}
        >
          Account
        </Typography>
      )}
      <List sx={{ px: 1.5, py: 1, pb: 2 }}>
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <Tooltip title={collapsed ? "Settings" : ""} placement="right" arrow>
            <ListItemButton
              href="/settings"
              sx={{
                borderRadius: 2.5,
                minHeight: 44,
                px: collapsed ? 2 : 2,
                justifyContent: collapsed ? "center" : "flex-start",
                color: SIDEBAR_TEXT,
                "&:hover": { bgcolor: SIDEBAR_HOVER },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  justifyContent: "center",
                  color: SIDEBAR_TEXT,
                }}
              >
                <Settings size={20} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Settings"
                  primaryTypographyProps={{ variant: "body2", fontSize: "0.8125rem" }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: 2.5,
                minHeight: 44,
                px: collapsed ? 2 : 2,
                justifyContent: collapsed ? "center" : "flex-start",
                color: "rgba(248,113,113,0.8)",
                "&:hover": {
                  bgcolor: "rgba(248,113,113,0.08)",
                  color: "#f87171",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                <LogOut size={20} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 500,
                    fontSize: "0.8125rem",
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: EXPANDED_WIDTH,
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          border: "none",
          transition: "width 0.2s ease",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH };
