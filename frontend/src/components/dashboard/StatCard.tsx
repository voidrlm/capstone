import { Box, Card, CardContent, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
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

export default function StatCard({ icon: Icon, iconColor, iconBg, value, label, trend }: StatCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const resolvedIconBg = isDark ? alpha(iconColor, 0.15) : iconBg;

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor = trend?.direction === "up" ? "#16a34a" : trend?.direction === "down" ? "#dc2626" : theme.palette.text.secondary as string;
  const trendBg = trend?.direction === "up"
    ? alpha("#16a34a", isDark ? 0.12 : 0.08)
    : trend?.direction === "down"
    ? alpha("#dc2626", isDark ? 0.12 : 0.08)
    : theme.palette.action.hover;

  return (
    <Card sx={{ position: "relative", overflow: "hidden", transition: "all 0.2s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.35)" : "0 8px 24px rgba(0,0,0,0.08)" } }}>
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: iconColor, opacity: 0.7 }} />
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>{label}</Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary">{value}</Typography>
          </Box>
          <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: resolvedIconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={22} color={iconColor} />
          </Box>
        </Box>
        {trend && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 1.5, px: 1, py: 0.25, borderRadius: 1.5, bgcolor: trendBg }}>
            <TrendIcon size={13} color={trendColor} />
            <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>{trend.text}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
