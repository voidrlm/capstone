import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu, Bell } from "lucide-react";

interface TopBarProps {
  userName: string;
  role: string;
  onMenuClick: () => void;
  onLogout: () => void;
  sidebarWidth: number;
}

export default function TopBar({
  onMenuClick,
  sidebarWidth,
}: TopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
        width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
        ml: isMobile ? 0 : `${sidebarWidth}px`,
        transition: "width 0.2s ease, margin-left 0.2s ease",
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 60, px: { xs: 2, sm: 3 } }}>
        {isMobile && (
          <IconButton onClick={onMenuClick} edge="start" size="small">
            <Menu size={22} />
          </IconButton>
        )}

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>

        <Tooltip title="Notifications">
          <IconButton
            sx={{
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: "grey.100" },
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
      </Toolbar>
    </AppBar>
  );
}
