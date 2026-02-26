import { Box, Card, CardContent, Typography } from "@mui/material";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  value: string | number;
  label: string;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
}

export default function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  trend,
}: StatCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    trend?.direction === "up"
      ? "success.main"
      : trend?.direction === "down"
      ? "error.main"
      : "text.secondary";

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={24} color={iconColor} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
            <TrendIcon size={14} />
            <Typography variant="caption" sx={{ color: trendColor }}>
              {trend.text}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
