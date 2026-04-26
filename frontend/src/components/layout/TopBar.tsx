import React, { type MouseEvent } from "react";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu as MuiMenu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Bell, LogOut, Menu, Sparkles } from "lucide-react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { notifications } from "../../data/mockPatientData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type TopBarNotification = {
  id: string;
  type?: "warning" | "info" | "success";
  message: string;
  date: string;
  read: boolean;
  accessRequest?: AccessRequestNotificationItem;
};

type AccessRequestNotificationItem = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string;
  organization_id: string;
  organization_name: string;
  organization_type?: string | null;
  organization_address?: string | null;
  organization_city?: string | null;
  organization_state?: string | null;
  organization_zip_code?: string | null;
  organization_phone?: string | null;
  organization_website?: string | null;
  organization_email?: string | null;
  organization_is_verified?: boolean | null;
  organization_created_at?: string | null;
  requested_by: string;
  requested_by_name: string;
  requested_by_email: string;
  requested_by_phone?: string | null;
  requested_by_role?: string | null;
  requested_by_member_role?: string | null;
  requested_by_member_status?: string | null;
};

type PatientSystemNotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: {
    updatedByRole?: string;
    updatedByName?: string;
    updatedByEmail?: string | null;
    updatedAt?: string;
  } | null;
  created_at: string;
};

interface TopBarProps {
  userName: string;
  role: string;
  mobileOpen: boolean;
  onMobileOpen: () => void;
  onMobileClose: () => void;
}

const titleMap: Record<string, string> = {
  "/dashboard/provider": "Provider Dashboard",
  "/drugs": "Drug Search",
  "/patients": "Patient Workspace",
  "/patient/medications": "My Medications",
  "/patient/records": "My Records",
  "/patient/visits": "My Visits",
  "/patient/insurance": "Insurance",
  "/provider/analytics": "Analytics",
  "/provider/organization": "Organization",
};

function getRoleLabel(role: string) {
  if (role === "patient") return "Patient Portal";
  if (role === "org_admin") return "Organization Admin";
  if (role === "doctor") return "Doctor Workspace";
  if (role === "nurse") return "Nurse Workspace";
  if (role === "provider") return "Healthcare Provider";
  if (role === "admin") return "Admin Workspace";
  return "Workspace";
}

function getNavItems(role: string) {
  if (role === "patient") {
    return [
      { label: "My Records", path: "/patient/records" },
      { label: "My Visits", path: "/patient/visits" },
      { label: "Insurance", path: "/patient/insurance" },
      { label: "My Medications", path: "/patient/medications" },
    ];
  }

  const providerItems = [
    { label: "Dashboard", path: "/dashboard/provider" },
    { label: "Patients", path: "/patients" },
    { label: "Drug Search", path: "/drugs" },
    { label: "Analytics", path: "/provider/analytics" },
    { label: "Organization", path: "/provider/organization" },
  ];

  if (role === "doctor" || role === "nurse") {
    return providerItems.filter((item) => item.path !== "/provider/analytics");
  }

  return providerItems;
}

function isNavActive(currentPath: string, itemPath: string) {
  if (currentPath === itemPath) return true;
  if (itemPath === "/patients") return currentPath.startsWith("/patients");
  return false;
}

function formatLabel(value?: string | null) {
  if (!value) return "Not provided";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function TopBar({
  userName,
  role,
  mobileOpen,
  onMobileOpen,
  onMobileClose,
}: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = React.useState<null | HTMLElement>(null);
  const [topBarNotifications, setTopBarNotifications] = React.useState<TopBarNotification[]>(
    notifications as TopBarNotification[],
  );
  const [selectedAccessRequest, setSelectedAccessRequest] = React.useState<AccessRequestNotificationItem | null>(null);
  const [requestActionLoading, setRequestActionLoading] = React.useState<"approve" | "reject" | null>(null);

  const roleLabel = getRoleLabel(role);
  const pageTitle = titleMap[location.pathname] || "PharmaLogs";
  const navItems = getNavItems(role);
  const unreadNotifications = topBarNotifications.filter((notification) => !notification.read);
  const notificationsOpen = Boolean(notificationAnchorEl);
  const profileOpen = Boolean(profileAnchorEl);

  React.useEffect(() => {
    if (role !== "patient") {
      setTopBarNotifications(notifications as TopBarNotification[]);
      return;
    }

    let active = true;
    const token = localStorage.getItem("token");
    if (!token) {
      setTopBarNotifications(notifications as TopBarNotification[]);
      return;
    }

    void Promise.all([
      fetch(`${API_URL}/api/patients/access-requests/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (response) => {
          const json = await response.json().catch(() => null);
          if (!response.ok) return [] as AccessRequestNotificationItem[];
          return (json?.data?.requests || []) as AccessRequestNotificationItem[];
        })
        .catch(() => [] as AccessRequestNotificationItem[]),
      fetch(`${API_URL}/api/patients/notifications/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (response) => {
          const json = await response.json().catch(() => null);
          if (!response.ok) return [] as PatientSystemNotificationItem[];
          return (json?.data?.notifications || []) as PatientSystemNotificationItem[];
        })
        .catch(() => [] as PatientSystemNotificationItem[]),
    ])
      .then(([requests, systemNotifications]) => {
        if (!active) return;
        const pendingRequestNotifications: TopBarNotification[] = requests
          .filter((request) => request.status === "pending")
          .map((request) => ({
            id: `access-request-${request.id}`,
            type: "info",
            message: `New access request from ${request.organization_name} by ${request.requested_by_name}`,
            date: new Date(request.created_at).toLocaleDateString(),
            read: false,
            accessRequest: request,
          }));

        const medicationUpdateNotifications: TopBarNotification[] = systemNotifications
          .filter((notification) => notification.type === "medication_updated")
          .map((notification) => {
            const updater = notification.metadata?.updatedByName || "A nurse";
            const updaterEmail = notification.metadata?.updatedByEmail ? ` (${notification.metadata.updatedByEmail})` : "";
            return {
              id: `patient-system-${notification.id}`,
              type: "info",
              message: `${updater}${updaterEmail} updated your medications. Please review the latest list.`,
              date: new Date(notification.created_at).toLocaleDateString(),
              read: false,
            } as TopBarNotification;
          });

        setTopBarNotifications([
          ...pendingRequestNotifications,
          ...medicationUpdateNotifications,
          ...(notifications as TopBarNotification[]),
        ]);
      })
      .catch(() => {
        if (active) {
          setTopBarNotifications(notifications as TopBarNotification[]);
        }
      });

    return () => {
      active = false;
    };
  }, [role]);

  const handleLogout = React.useCallback(() => {
    setProfileAnchorEl(null);
    setNotificationAnchorEl(null);
    onMobileClose();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.setTimeout(() => {
      window.location.replace("/login");
    }, 0);
  }, [onMobileClose]);

  const handleAccessRequestDecision = React.useCallback(async (action: "approve" | "reject") => {
    if (!selectedAccessRequest) return;
    setRequestActionLoading(action);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/patients/access-requests/${selectedAccessRequest.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to respond to access request");
      }

      setTopBarNotifications((current) =>
        current.filter((notification) => notification.accessRequest?.id !== selectedAccessRequest.id),
      );
      setSelectedAccessRequest(null);
    } catch {
      // Keep dialog open so patient can retry after transient failures.
    } finally {
      setRequestActionLoading(null);
    }
  }, [selectedAccessRequest]);

  const mobileDrawer = (
    <Box sx={{ width: 320, maxWidth: "100vw", p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Logo size="sm" />
        <Chip
          size="small"
          icon={<Sparkles size={14} />}
          label={roleLabel}
          sx={{
            bgcolor: "#e0fdf4",
            color: "#00b894",
            fontWeight: 700,
            "& .MuiChip-icon": { color: "#00b894" },
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {pageTitle}
      </Typography>
      <List sx={{ p: 0 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            to={item.path}
            onClick={onMobileClose}
            sx={{
              borderRadius: 3,
              mb: 1,
              py: 1.2,
              bgcolor: isNavActive(location.pathname, item.path) ? "rgba(0,212,170,0.1)" : "transparent",
              color: isNavActive(location.pathname, item.path) ? "#008f74" : "text.primary",
            }}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: isNavActive(location.pathname, item.path) ? 700 : 500 }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Button variant="outlined" color="inherit" fullWidth startIcon={<LogOut size={16} />} onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: 78,
            px: { xs: 2, sm: 3, md: 4 },
            gap: { xs: 1.5, md: 2.5 },
            display: "grid",
            gridTemplateColumns: { xs: "auto 1fr auto", md: "auto minmax(0,1fr) auto" },
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            {isMobile ? (
              <IconButton
                onClick={onMobileOpen}
                edge="start"
                size="small"
                sx={{
                  bgcolor: "rgba(15,23,42,0.04)",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "rgba(15,23,42,0.08)" },
                }}
              >
                <Menu size={20} />
              </IconButton>
            ) : null}
            <Box component={RouterLink} to={role === "patient" ? "/patient/records" : "/dashboard/provider"} sx={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <Logo size="sm" />
            </Box>
          </Box>

          <Box sx={{ minWidth: 0, display: "flex", justifyContent: { xs: "center", md: "center" } }}>
            {isMobile ? (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "center",
                }}
              >
                {pageTitle}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  p: 0.5,
                  borderRadius: 999,
                  bgcolor: "rgba(15,23,42,0.04)",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
                  maxWidth: "100%",
                }}
              >
                {navItems.map((item) => {
                  const active = isNavActive(location.pathname, item.path);
                  return (
                    <Button
                      key={item.path}
                      component={RouterLink}
                      to={item.path}
                      variant="text"
                      sx={{
                        minWidth: "auto",
                        px: 1.8,
                        py: 0.8,
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: active ? 700 : 600,
                        color: active ? "#008f74" : "text.secondary",
                        bgcolor: active ? "rgba(0,212,170,0.1)" : "transparent",
                        "&:hover": {
                          bgcolor: active ? "rgba(0,212,170,0.16)" : "rgba(15,23,42,0.05)",
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
            {!isMobile ? (
              <Chip
                size="small"
                icon={<Sparkles size={14} />}
                label={roleLabel}
                sx={{
                  bgcolor: "#e0fdf4",
                  color: "#00b894",
                  fontWeight: 700,
                  "& .MuiChip-icon": { color: "#00b894" },
                }}
              />
            ) : null}
            <Tooltip title="Notifications">
              <IconButton
                onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
                sx={{
                  bgcolor: "rgba(15,23,42,0.04)",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "rgba(15,23,42,0.08)" },
                }}
              >
                <Badge
                  badgeContent={unreadNotifications.length}
                  color="error"
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", height: 18, minWidth: 18 } }}
                >
                  <Bell size={18} />
                </Badge>
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={(event) => setProfileAnchorEl(event.currentTarget)}
              sx={{
                p: 0.35,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)",
                  color: "#04111f",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                {(userName || "MR").split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {!isMobile ? (
        <Box
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Box sx={{ maxWidth: 1440, mx: "auto" }}>
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {pageTitle}
            </Typography>
          </Box>
        </Box>
      ) : null}

      <MuiMenu
        anchorEl={notificationAnchorEl}
        open={notificationsOpen}
        onClose={() => setNotificationAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableScrollLock
        slotProps={{
          root: {
            sx: {
              zIndex: 3000,
              pointerEvents: "none",
            },
          },
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
              pointerEvents: "auto",
              position: "relative",
              zIndex: 3001,
            },
            onMouseDown: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
            onClick: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
          },
          list: {
            sx: {
              pointerEvents: "auto",
            },
            onMouseDown: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
            onClick: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>Notifications</Typography>
            <Typography variant="body2" color="text.secondary">{unreadNotifications.length} unread</Typography>
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
        {topBarNotifications.map((notification, index) => (
          <MenuItem
            key={notification.id}
            onClick={() => {
              if (notification.accessRequest) {
                setSelectedAccessRequest(notification.accessRequest);
              }
              setNotificationAnchorEl(null);
            }}
            sx={{
              alignItems: "flex-start",
              px: 2,
              py: 1.5,
              gap: 1.25,
              bgcolor: notification.read ? "transparent" : "rgba(0,212,170,0.06)",
              borderBottom: index < topBarNotifications.length - 1 ? "1px solid" : "none",
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
            <Box>
              <Typography variant="body2" fontWeight={notification.read ? 500 : 700} sx={{ lineHeight: 1.45 }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.date}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </MuiMenu>

      <Dialog
        open={!!selectedAccessRequest}
        onClose={() => {
          if (!requestActionLoading) {
            setSelectedAccessRequest(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Patient Access Request</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Verify this request carefully. Check whether the requester email belongs to a proper organization before approving access.
          </Alert>
          {selectedAccessRequest ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 1.6 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Requester Details</Typography>
                <Typography variant="body2"><strong>Name:</strong> {selectedAccessRequest.requested_by_name || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {selectedAccessRequest.requested_by_email || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {selectedAccessRequest.requested_by_phone || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Platform Role:</strong> {formatLabel(selectedAccessRequest.requested_by_role)}</Typography>
                <Typography variant="body2"><strong>Org Member Role:</strong> {formatLabel(selectedAccessRequest.requested_by_member_role)}</Typography>
                <Typography variant="body2"><strong>Member Status:</strong> {formatLabel(selectedAccessRequest.requested_by_member_status)}</Typography>
                <Typography variant="body2"><strong>Requester User ID:</strong> {selectedAccessRequest.requested_by}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Organization Details</Typography>
                <Typography variant="body2"><strong>Name:</strong> {selectedAccessRequest.organization_name || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {formatLabel(selectedAccessRequest.organization_type)}</Typography>
                <Typography variant="body2"><strong>Verified:</strong> {selectedAccessRequest.organization_is_verified ? "Yes" : "No"}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {selectedAccessRequest.organization_email || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {selectedAccessRequest.organization_phone || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Website:</strong> {selectedAccessRequest.organization_website || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {selectedAccessRequest.organization_address || "Not provided"}</Typography>
                <Typography variant="body2"><strong>City/State/ZIP:</strong> {[
                  selectedAccessRequest.organization_city,
                  selectedAccessRequest.organization_state,
                  selectedAccessRequest.organization_zip_code,
                ].filter(Boolean).join(", ") || "Not provided"}</Typography>
                <Typography variant="body2"><strong>Organization ID:</strong> {selectedAccessRequest.organization_id}</Typography>
                <Typography variant="body2"><strong>Organization Created:</strong> {selectedAccessRequest.organization_created_at ? new Date(selectedAccessRequest.organization_created_at).toLocaleString() : "Not provided"}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>Request Timeline</Typography>
                <Typography variant="body2"><strong>Current Status:</strong> {formatLabel(selectedAccessRequest.status)}</Typography>
                <Typography variant="body2"><strong>Requested On:</strong> {new Date(selectedAccessRequest.created_at).toLocaleString()}</Typography>
                <Typography variant="body2"><strong>Last Updated:</strong> {selectedAccessRequest.updated_at ? new Date(selectedAccessRequest.updated_at).toLocaleString() : "Not available"}</Typography>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setSelectedAccessRequest(null);
            }}
            disabled={!!requestActionLoading}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => void handleAccessRequestDecision("reject")}
            disabled={!!requestActionLoading}
          >
            {requestActionLoading === "reject" ? <CircularProgress size={18} color="inherit" /> : "Decline"}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => void handleAccessRequestDecision("approve")}
            disabled={!!requestActionLoading}
          >
            {requestActionLoading === "approve" ? <CircularProgress size={18} color="inherit" /> : "Accept"}
          </Button>
        </DialogActions>
      </Dialog>

      <MuiMenu
        anchorEl={profileAnchorEl}
        open={profileOpen}
        onClose={() => setProfileAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableScrollLock
        slotProps={{
          root: {
            sx: {
              zIndex: 3000,
              pointerEvents: "none",
            },
          },
          paper: {
            sx: {
              width: 248,
              maxWidth: "calc(100vw - 32px)",
              mt: 1.25,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 20px 45px rgba(15,23,42,0.14)",
              pointerEvents: "auto",
              position: "relative",
              zIndex: 3001,
            },
            onMouseDown: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
            onClick: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
          },
          list: {
            sx: {
              pointerEvents: "auto",
            },
            onMouseDown: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
            onClick: (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight={700}>{userName || "PharmaLogs User"}</Typography>
          <Typography variant="body2" color="text.secondary">{roleLabel}</Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleLogout();
          }}
          sx={{
            mx: 1,
            my: 1,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            py: 1.2,
            gap: 1,
            fontWeight: 700,
          }}
        >
          <LogOut size={16} />
          <ListItemText primary="Logout" />
        </MenuItem>
      </MuiMenu>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            boxShadow: "0 24px 60px rgba(2,6,23,0.24)",
          },
        }}
      >
        {mobileDrawer}
      </Drawer>
    </>
  );
}
