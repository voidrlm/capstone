import { Box, Typography, Button, List, ListItem, ListItemText, Card, CardContent, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AlertTriangle, Shield, Bell, Clock } from "lucide-react";

interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  date: string;
  read: boolean;
}

function getNotificationStyle(type: string, isDark: boolean) {
  const a = (c: string, o: number) => alpha(c, isDark ? o * 0.7 : o);
  switch (type) {
    case "warning":
      return { icon: <AlertTriangle size={18} />, bg: a("#d97706", 0.12), color: "#d97706", border: a("#d97706", 0.2) };
    case "success":
      return { icon: <Shield size={18} />, bg: a("#16a34a", 0.12), color: "#16a34a", border: a("#16a34a", 0.2) };
    default:
      return { icon: <Bell size={18} />, bg: a("#00d4aa", 0.12), color: "#00d4aa", border: a("#00d4aa", 0.2) };
  }
}

export default function NotificationList({ notifications }: { notifications: Notification[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Notifications</Typography>
          <Button variant="text" size="small" sx={{ color: "primary.main", fontWeight: 600 }}>Mark All Read</Button>
        </Box>
        <List sx={{ p: 0 }}>
          {notifications.map((notif, index) => {
            const style = getNotificationStyle(notif.type, isDark);
            return (
              <ListItem
                key={notif.id}
                sx={{
                  px: 2, py: 1.5, borderRadius: 2.5,
                  mb: index < notifications.length - 1 ? 1 : 0,
                  bgcolor: notif.read ? "action.hover" : style.bg,
                  border: "1px solid",
                  borderColor: notif.read ? "divider" : style.border,
                  transition: "all 0.15s ease",
                }}
              >
                <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: notif.read ? "action.hover" : style.bg, color: style.color, display: "flex", mr: 2, flexShrink: 0 }}>
                  {style.icon}
                </Box>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={notif.read ? 400 : 600} color="text.primary" sx={{ mb: 0.25 }}>{notif.message}</Typography>}
                  secondary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Clock size={11} color="#94a3b8" />
                      <Typography variant="caption" color="text.secondary">{notif.date}</Typography>
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}
