import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  LayoutDashboard,
  Pill,
  Activity,
  FileText,
  AlertTriangle,
  Users,
  Shield,
  TrendingUp,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Logo from "./Logo";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

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
  { label: "My Medications", icon: Pill, path: "#" },
  { label: "Risk Assessments", icon: Activity, path: "#" },
  { label: "My Records", icon: FileText, path: "#" },
  { label: "Side Effects", icon: AlertTriangle, path: "#" },
];

const providerNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/provider" },
  { label: "Patients", icon: Users, path: "/patients" },
  { label: "Drug Search", icon: Shield, path: "/drugs" },
  { label: "Assessments", icon: Activity, path: "#" },
  { label: "Analytics", icon: TrendingUp, path: "#" },
  { label: "Organization", icon: Building2, path: "#" },
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

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* Logo + collapse */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1 : 2.5,
          py: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && <Logo size="sm" />}
        {!isMobile && (
          <IconButton onClick={onToggleCollapse} size="small">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = window.location.pathname === item.path;
          return (
            <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ""} placement="right">
                <ListItemButton
                  href={item.path}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    px: collapsed ? 2 : 2.5,
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderLeft: isActive ? "3px solid" : "3px solid transparent",
                    borderColor: isActive ? "primary.main" : "transparent",
                    bgcolor: isActive ? "action.selected" : "transparent",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : 40,
                      color: isActive ? "primary.main" : "text.secondary",
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
                        color: isActive ? "primary.main" : "text.primary",
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Bottom actions */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? "Settings" : ""} placement="right">
            <ListItemButton
              sx={{
                borderRadius: 2,
                minHeight: 44,
                px: collapsed ? 2 : 2.5,
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <ListItemIcon
                sx={{ minWidth: collapsed ? 0 : 40, justifyContent: "center" }}
              >
                <Settings size={20} />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Settings" primaryTypographyProps={{ variant: "body2" }} />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: 2,
                minHeight: 44,
                px: collapsed ? 2 : 2.5,
                justifyContent: collapsed ? "center" : "flex-start",
                color: "error.main",
                "&:hover": { bgcolor: "error.light", color: "error.dark" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 40,
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                <LogOut size={20} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText primary="Logout" primaryTypographyProps={{ variant: "body2", fontWeight: 500 }} />
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
            borderRight: "1px solid",
            borderColor: "divider",
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
          borderRight: "1px solid",
          borderColor: "divider",
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
