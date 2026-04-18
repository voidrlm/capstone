import React from "react";
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
  Menu as MuiMenu,
  MenuItem,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu, Bell, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { notifications } from "../../data/mockPatientData";

interface TopBarProps {
  userName: string;
  role: string;
  onMenuClick: () => void;
  onLogout: () => void;
  sidebarWidth: number;
}

const titleMap: Record<string, string> = {
  "/dashboard/provider": "Provider Dashboard",
  "/drugs": "Drug Search",
  "/patients": "Patient Workspace",
  "/patient/medications": "My Medications",
  "/patient/records": "My Records",
  "/provider/analytics": "Analytics",
  "/provider/organization": "Organization",
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
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);

  const roleLabel = getRoleLabel(role);
  const pageTitle = titleMap[location.pathname] || "MediRisk";
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const notificationsOpen = Boolean(notificationAnchorEl);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        backdropFilter: "blur(10px)",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
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
              bgcolor: "rgba(0,0,0,0.04)",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: "rgba(0,0,0,0.07)" },
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
                bgcolor: "#e0fdf4",
                color: "#00d4aa",
                fontWeight: 700,
                borderRadius: 999,
                "& .MuiChip-icon": { color: "#00d4aa" },
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
                bgcolor: "rgba(0,0,0,0.03)",
                border: "1px solid",
                borderColor: "divider",
                minWidth: 220,
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)",
                  color: "#04080f",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {(userName || "MR")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
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
              onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
              sx={{
                bgcolor: "rgba(0,0,0,0.04)",
                border: "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "rgba(0,0,0,0.07)" },
              }}
            >
              <Badge
                badgeContent={3}
                color="error"
                sx={{
                  "& .MuiBadge-badge": { fontSize: "0.65rem", height: 18, minWidth: 18 },
                }}
              >
                <Bell size={18} />
              </Badge>
            </IconButton>
          </Tooltip>
          <MuiMenu
            anchorEl={notificationAnchorEl}
            open={notificationsOpen}
            onClose={() => setNotificationAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  width: { xs: "calc(100vw - 32px)", sm: 360 },
                  maxWidth: 360,
                  mt: 1.25,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 20px 45px rgba(15,23,42,0.16)",
                  overflow: "hidden",
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unreadNotifications.length} unread
                </Typography>
              </Box>
              <Chip
                size="small"
                label={unreadNotifications.length > 0 ? "Active" : "All caught up"}
                sx={{
                  bgcolor: unreadNotifications.length > 0 ? "#e0fdf4" : "action.hover",
                  color: unreadNotifications.length > 0 ? "#00b894" : "text.secondary",
                  fontWeight: 700,
                }}
              />
            </Box>
            <Divider />
            {notifications.map((notification, index) => (
              <MenuItem
                key={notification.id}
                onClick={() => setNotificationAnchorEl(null)}
                sx={{
                  alignItems: "flex-start",
                  px: 2,
                  py: 1.5,
                  gap: 1.25,
                  bgcolor: notification.read ? "transparent" : "rgba(0,212,170,0.06)",
                  borderBottom: index < notifications.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                  whiteSpace: "normal",
                }}
              >
                <Box
                  sx={{
                    mt: 0.45,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: notification.read ? "rgba(148,163,184,0.45)" : "#00d4aa",
                  }}
                />
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={notification.read ? 500 : 700} sx={{ lineHeight: 1.45 }}>
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {notification.date}
                    </Typography>
                  }
                />
              </MenuItem>
            ))}
          </MuiMenu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
