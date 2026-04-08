import { Box, Typography, Grid, Card, CardContent, useTheme } from "@mui/material";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
}

export default function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2.5}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={action.label}>
                <Box
                  sx={{
                    p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: isDark ? "rgba(0,212,170,0.06)" : "rgba(0,212,170,0.04)",
                      transform: "translateY(-1px)",
                      boxShadow: isDark ? "0 4px 12px rgba(0,212,170,0.1)" : "0 4px 12px rgba(0,212,170,0.08)",
                    },
                  }}
                >
                  <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: "rgba(0,212,170,0.12)", color: "#00d4aa", display: "flex", flexShrink: 0 }}>
                    <Icon size={20} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">{action.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{action.description}</Typography>
                  </Box>
                  <ChevronRight size={16} color="#94a3b8" />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
