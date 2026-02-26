import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Badge,
  Tooltip,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu, Search, Bell, LogOut, User, Stethoscope } from "lucide-react";

interface TopBarProps {
  userName: string;
  role: string;
  onMenuClick: () => void;
  onLogout: () => void;
  sidebarWidth: number;
}

export default function TopBar({
  userName,
  role,
  onMenuClick,
  onLogout,
  sidebarWidth,
}: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
        width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
        ml: isMobile ? 0 : `${sidebarWidth}px`,
        transition: "width 0.2s ease, margin-left 0.2s ease",
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 64 }}>
        {isMobile && (
          <IconButton onClick={onMenuClick} edge="start">
            <Menu size={22} />
          </IconButton>
        )}

        <TextField
          placeholder="Search..."
          size="small"
          sx={{
            maxWidth: 320,
            flex: 1,
            "& .MuiOutlinedInput-root": {
              bgcolor: "grey.50",
              borderRadius: 2,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#94a3b8" />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Notifications">
          <IconButton>
            <Badge badgeContent={3} color="error">
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 1 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            {role === "patient" ? <User size={18} /> : <Stethoscope size={18} />}
          </Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" fontWeight={600}>
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {role === "patient" ? "Patient" : "Healthcare Provider"}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton onClick={onLogout} size="small">
              <LogOut size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
