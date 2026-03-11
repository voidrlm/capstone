import { Box, Typography, Card, CardContent, Grid, Select, MenuItem, FormControl } from "@mui/material";
import { Users, TrendingUp, AlertTriangle, Pill } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

export default function ProviderAnalyticsPage() {
    const populationTrend = [
        { month: "Sep", "Low Risk": 400, "Med Risk": 240, "High Risk": 80 },
        { month: "Oct", "Low Risk": 410, "Med Risk": 230, "High Risk": 85 },
        { month: "Nov", "Low Risk": 420, "Med Risk": 220, "High Risk": 75 },
        { month: "Dec", "Low Risk": 430, "Med Risk": 210, "High Risk": 70 },
        { month: "Jan", "Low Risk": 415, "Med Risk": 215, "High Risk": 60 },
        { month: "Feb", "Low Risk": 440, "Med Risk": 200, "High Risk": 50 },
        { month: "Mar", "Low Risk": 450, "Med Risk": 190, "High Risk": 55 },
    ];

    const sideEffectsDist = [
        { name: "Muscle Aches", value: 35 },
        { name: "Nausea", value: 25 },
        { name: "Dizziness", value: 20 },
        { name: "Fatigue", value: 15 },
        { name: "Other", value: 5 },
    ];
    const COLORS = ['#1976d2', '#ed6c02', '#0288d1', '#9c27b0', '#757575'];

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">Analytics & Population Health</Typography>
                <FormControl size="small" sx={{ width: 150 }}>
                    <Select defaultValue="30days">
                        <MenuItem value="7days">Last 7 Days</MenuItem>
                        <MenuItem value="30days">Last 30 Days</MenuItem>
                        <MenuItem value="90days">Last 90 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: "Active Patients", value: "7,243", diff: "+4.2%", icon: Users, color: "#1976d2" },
                    { title: "Avg Adherence Rate", value: "84.5%", diff: "+1.1%", icon: Pill, color: "#2e7d32" },
                    { title: "Critical Risk Alerts", value: "42", diff: "-12.5%", icon: AlertTriangle, color: "#ed6c02", positiveIsDown: true },
                    { title: "Predicted Admissions", value: "18", diff: "-5.0%", icon: TrendingUp, color: "#d32f2f", positiveIsDown: true },
                ].map((kpi, idx) => {
                    const Icon = kpi.icon;
                    const isPositive = kpi.positiveIsDown ? kpi.diff.startsWith("-") : kpi.diff.startsWith("+");
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                            <Card sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                        <Box sx={{ p: 1.5, bgcolor: `${kpi.color}15`, borderRadius: 2, color: kpi.color }}>
                                            <Icon size={24} />
                                        </Box>
                                        <Typography variant="caption" fontWeight="bold" sx={{ color: isPositive ? "success.main" : "error.main", bgcolor: isPositive ? "success.50" : "error.50", px: 1, py: 0.5, borderRadius: 1 }}>
                                            {kpi.diff}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h4" fontWeight="bold">{kpi.value}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{kpi.title}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 15px rgba(0,0,0,0.03)", height: "100%" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Population Risk Stratification (6 mo)</Typography>
                            <Box sx={{ height: 300, width: "100%" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={populationTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9e9e9e" }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9e9e9e" }} />
                                        <RechartsTooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                                        <Bar dataKey="High Risk" stackId="a" fill="#ed6c02" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="Med Risk" stackId="a" fill="#0288d1" />
                                        <Bar dataKey="Low Risk" stackId="a" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 2px 15px rgba(0,0,0,0.03)", height: "100%" }}>
                        <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Top Side Effects Reported</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>Based on 324 patient logs this month</Typography>
                            <Box sx={{ flexGrow: 1, minHeight: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={sideEffectsDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                            {sideEffectsDist.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
