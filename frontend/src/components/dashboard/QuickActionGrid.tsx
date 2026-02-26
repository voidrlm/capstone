import { Box, Typography, Button, Grid, Card, CardContent } from "@mui/material";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
}

export default function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Quick Actions
        </Typography>

        <Grid container spacing={2}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={action.label}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 2,
                    justifyContent: "flex-start",
                    textAlign: "left",
                  }}
                  startIcon={<Icon size={20} />}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {action.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
