import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
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

function getNotificationIcon(type: string) {
  switch (type) {
    case "warning":
      return <AlertTriangle size={20} color="#f59e0b" />;
    case "success":
      return <Shield size={20} color="#10b981" />;
    default:
      return <Bell size={20} color="#3b82f6" />;
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
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          <Button variant="text" size="small">
            Mark All Read
          </Button>
        </Box>

        <List sx={{ p: 0 }}>
          {notifications.map((notif, index) => (
            <Box key={notif.id}>
              <ListItem
                sx={{
                  px: 0,
                  py: 2,
                  bgcolor: notif.read ? "transparent" : "action.hover",
                  borderRadius: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  {getNotificationIcon(notif.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={notif.read ? 400 : 600}>
                      {notif.message}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <Clock size={12} color="#64748b" />
                      <Typography variant="caption" color="text.secondary">
                        {notif.date}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
