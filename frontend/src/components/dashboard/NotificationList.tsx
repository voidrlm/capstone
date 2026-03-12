import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material";
import { AlertTriangle, Shield, Bell, Clock } from "lucide-react";

interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  date: string;
  read: boolean;
}

function getNotificationStyle(type: string) {
  switch (type) {
    case "warning":
      return { icon: <AlertTriangle size={18} />, bg: "#fffbeb", color: "#d97706", border: "#fef3c7" };
    case "success":
      return { icon: <Shield size={18} />, bg: "#f0fdf4", color: "#16a34a", border: "#dcfce7" };
    default:
      return { icon: <Bell size={18} />, bg: "#eff6ff", color: "#2563eb", border: "#dbeafe" };
  }
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Notifications
          </Typography>
          <Button variant="text" size="small" sx={{ color: "primary.main", fontWeight: 600 }}>
            Mark All Read
          </Button>
        </Box>

        <List sx={{ p: 0 }}>
          {notifications.map((notif, index) => {
            const style = getNotificationStyle(notif.type);
            return (
              <ListItem
                key={notif.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2.5,
                  mb: index < notifications.length - 1 ? 1 : 0,
                  bgcolor: notif.read ? "#f8fafc" : style.bg,
                  border: "1px solid",
                  borderColor: notif.read ? "#f1f5f9" : style.border,
                  transition: "all 0.15s ease",
                }}
              >
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 2,
                    bgcolor: notif.read ? "#f1f5f9" : "white",
                    color: style.color,
                    display: "flex",
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {style.icon}
                </Box>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notif.read ? 400 : 600}
                      color="text.primary"
                      sx={{ mb: 0.25 }}
                    >
                      {notif.message}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Clock size={11} color="#94a3b8" />
                      <Typography variant="caption" color="text.secondary">
                        {notif.date}
                      </Typography>
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
