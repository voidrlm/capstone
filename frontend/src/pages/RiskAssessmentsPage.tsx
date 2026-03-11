import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { Activity, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const performanceData = [
    { month: "Sep", score: 85 },
    { month: "Oct", score: 82 },
    { month: "Nov", score: 88 },
    { month: "Dec", score: 79 },
    { month: "Jan", score: 75 },
    { month: "Feb", score: 68 }, // Dip due to missed tests or new medication
    { month: "Mar", score: 74 },
];

export default function RiskAssessmentsPage() {
    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">Risk Assessments</Typography>
                <Chip icon={<Activity size={16} />} label="Last updated: Today, 08:30 AM" variant="outlined" />
            </Box>

            <Grid container spacing={3}>
                {/* Main Score Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: "100%", borderRadius: 4, background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white" }}>
                        <CardContent sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                            <Typography variant="h6" sx={{ opacity: 0.8, mb: 2 }}>Overall Health Score</Typography>
                            <Typography variant="h1" fontWeight="bold" sx={{ mb: 1 }}>74</Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>Fair condition. Action recommended.</Typography>

                            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                                <Box sx={{ flex: 1, bgcolor: "rgba(255,255,255,0.1)", p: 2, borderRadius: 3 }}>
                                    <TrendingUp size={24} style={{ marginBottom: 8 }} />
                                    <Typography variant="h5" fontWeight="bold">+6</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>from last month</Typography>
                                </Box>
                                <Box sx={{ flex: 1, bgcolor: "rgba(255,255,255,0.1)", p: 2, borderRadius: 3 }}>
                                    <ShieldCheck size={24} style={{ marginBottom: 8 }} />
                                    <Typography variant="h5" fontWeight="bold">78</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Target Score</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Timeline Chart */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ height: "100%", borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 4 }}>Health Score Trend (6 Months)</Typography>
                            <Box sx={{ height: 300, width: "100%" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9e9e9e" }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9e9e9e" }} domain={[60, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                            cursor={{ stroke: '#1976d2', strokeWidth: 1, strokeDasharray: '5 5' }}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#1976d2" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Insights */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, mt: 2 }}>AI-Generated Insights</Typography>
                    <Grid container spacing={2}>
                        {[
                            { title: "Medication Adherence", desc: "Your missed Atorvastatin doses in Feb contributed to the score drop. Adherence has improved this month.", status: "warning" },
                            { title: "Blood Pressure", desc: "Latest readings show stabilization within normal limits since adjusting Lisinopril dosage.", status: "success" },
                            { title: "Follow-up Required", desc: "You are due for your semi-annual lipid panel. Scheduling this will impact your risk predictability.", status: "info" }
                        ].map((insight, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <Card sx={{ borderRadius: 3, height: "100%", position: "relative", overflow: "visible", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
                                    <Box sx={{
                                        position: "absolute", top: 0, left: 0, right: 0, height: 4,
                                        bgcolor: insight.status === "warning" ? "warning.main" : insight.status === "success" ? "success.main" : "info.main",
                                        borderRadius: "12px 12px 0 0"
                                    }} />
                                    <CardContent sx={{ p: 3, pt: 4 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
                                            {insight.status === "warning" && <AlertTriangle size={20} color="#ed6c02" />}
                                            {insight.status === "success" && <ShieldCheck size={20} color="#2e7d32" />}
                                            {insight.status === "info" && <Activity size={20} color="#0288d1" />}
                                            <Typography variant="subtitle1" fontWeight="bold">{insight.title}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{insight.desc}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
