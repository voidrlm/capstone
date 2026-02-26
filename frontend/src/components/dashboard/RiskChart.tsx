import { Box, Typography, useTheme } from "@mui/material";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface RadarDataItem {
  subject: string;
  value: number;
}

interface BarDataItem {
  name: string;
  value: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface AreaDataItem {
  date: string;
  risk: number;
}

export function RiskRadarChart({ data }: { data: RadarDataItem[] }) {
  const theme = useTheme();
  return (
    <Box sx={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke={theme.palette.divider} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
          />
          <Radar
            name="Risk"
            dataKey="value"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function RiskBarChart({ data }: { data: BarDataItem[] }) {
  const theme = useTheme();
  return (
    <Box sx={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="value" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function RiskPieChart({ data }: { data: PieDataItem[] }) {
  return (
    <Box sx={{ width: "100%", height: 280, display: "flex", alignItems: "center" }}>
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ flex: 1 }}>
        {data.map((entry) => (
          <Box
            key={entry.name}
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: entry.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary" noWrap>
              {entry.name}
            </Typography>
            <Typography variant="caption" fontWeight={600} sx={{ ml: "auto" }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function RiskAreaChart({ data }: { data: AreaDataItem[] }) {
  const theme = useTheme();
  return (
    <Box sx={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="risk"
            stroke={theme.palette.primary.main}
            fill="url(#riskGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
